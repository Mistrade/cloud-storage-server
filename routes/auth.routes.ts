import { User, UserModel } from '../models/User'
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { validateTools } from '../tools/validate'
import validator from 'validator'
import { checkTokens } from '../tools/tokenActions'
import { getUserInfo } from '../tools/getUserInfo'
import { Device, DeviceModel } from '../models/Device'
import { getDeviceInfo } from '../tools/getDeviceInfo'
import { UpdateDevice, UpdateDeviceRequestModel } from '../models/UpdateDeviceRequest'
import { checkDeviceInfo } from '../tools/checkDeviceInfo'
import { clearSession } from '../tools/clearSession'
import { createSession } from '../tools/createSession'
import { userInfo } from '../../client/src/reducers/UserReducer'

interface RegistrationInput {
  email: string,
  password: string
  name: string,
  surname: string
}

interface LoginResponse {
  userData: UserDataModel | null
}

export interface UserDataModel {
  avatar: string | null,
  name: string,
  surname: string,
  id: string,
  email: string,
  storageSpace: number,
  usingSpace: number,
  usingPercent: number,
}

interface ResponseModel {
  message: string,
  userId?: string,
  type?: 'confirm-password' | 'repeat-confirm-password'
}

export interface Token {
  id: string,
  email: string,
  date: number,
  dateEnd: number,
  type: 'access' | 'refresh'
}

const router = express.Router()

//Api-запрос на регистрацию пользователя
router.post( '/registration', async ( req: Request<RegistrationInput>, res: Response<ResponseModel> ) => {

  //Пытаемся проверить данные пользователя и зарегистрировать его
  try {

    //Получаем данные о пользователе
    const { email, password, name, surname } = req.body

    //Выводим данные о пользователе в лог сервера
    console.log( 'Регистрация нового пользователя: ', email )

    //Проводим проверку email-адреса
    if( !validator.isEmail( email ) ) {
      return res.status( 400 ).json( { message: 'Указан невалидный Email при регистрации пользователя' } )
    }

    //Получаем пользователя из БД по полученному Email
    const candidate: UserModel | null = await User.findOne( { email } )

    //Проверяем существует ли пользователь, если не существует возвращаем ответ на фронт с статусом 400
    if( candidate ) {
      return res.status( 400 ).json( { message: 'Пользователь с таким Email-адресом уже существует.' } )
    }

    //Проверяем исходный (без хеша) на правила валидации
    const passwordValidate = validateTools.checkPassword( password )

    //Если пароль оказался невалидным - возвращаем ответ на фронт со статусом 400
    if( !passwordValidate.status ) {
      return res.status( 400 ).json( { message: passwordValidate.message || 'Указан некорректный пароль для регистрации нового пользователя.' } )
    }

    //Создаем хеш-пароль для хранения его в Базе данных
    const hashPassword: string = await bcrypt.hash( password, 8 )

    //Формируем данные об устройстве, с которого регистрируется пользователь
    const deviceInfo = getDeviceInfo( req, null )
    //Создаем модель устройства пользователя и сохраняем данные в Базу данных
    const device = new Device( deviceInfo.data )
    await device.save()

    //Создаем модель пользователя со всеми необходимыми данными
    const user: UserModel = new User( {
      email,
      password: hashPassword,
      name,
      surname,
      device: device.id
    } )

    //Сохраняем данные пользователя (регистрируем)
    await user.save()

    //Возвращаем ответ на фронт с успешным сообщением о регистрации
    return res.status( 200 ).json( { message: 'Поздравляем! Вы успешно зарегистрированы!' } )
  } catch (e) {

    //В случае если в блоке TRY произошла ошибка возвращаем ответ со статусом 500 и сообщением о непредвиденной ошибке
    //Выводим ошибку в лог сервера
    console.log( e )
    return res.status( 500 ).json( {
      message: 'Во время обработки регистрации нового пользователя на сервере произошла ошибка'
    } )
  }
} )

//Api-запрос для авторизации пользователя в системе
router.post( '/', async ( req: Request<RegistrationInput>, res: Response<LoginResponse | ResponseModel> ) => {

  //Пробуем проверить данные пользователя и авторизовать его в системе
  try {

    //Получаем данные, которые отправил пользователь
    const { email, password } = req.body

    //Вывожу в консоль о том, что пользователь с определенным Email пытается авторизоваться
    console.log( 'Пользователь авторизуется: ', email )

    //Проверяем Email пользователя на валидность и если он не валидный, то возвращаю ответ со статусом 400 (BAD REQUEST)
    if( !validator.isEmail( email ) ) {
      return res.status( 400 ).json( { message: 'Указан невалидный Email-адрес' } )
    }

    //Проверяем пароль на стандартные правила валидации (без хеша)
    const passwordValidate = validateTools.checkPassword( password )

    //Если пароль оказался не валидным, возвращаем статус-код 400 на фронт с описанием ошибки
    if( !passwordValidate.status ) {
      return res.status( 400 ).json( { message: 'Указан некорректный пароль. Пароль должен содержать не менее 8 и не более 32 символов' } )
    }

    //Запрашиваем юзера в БД
    const user: UserModel | null = await User.findOne( { email } )

    //Если пользователь с указанным Email не найден, возвращаем статус-код 404 (Not Found) с описанием ошибки
    if( !user ) {
      return res.status( 404 ).json( { message: 'Пользователь с таким Email не найден!' } )
    }

    //Если карточка пользователя была найдена в Базе данных, то сверяем пароли из БД и полученный от пользователя
    const passwordEquality = await bcrypt.compare( password, user.password )

    //Если пароли не совпадают, то возвращаем запрет на авторизацию с описанием ошибки
    if( !passwordEquality ) {
      return res.status( 400 ).json( { message: 'Указаны неверный логин или пароль!' } )
    }

    //Если пароли совпадают, то получаем информацию об устройствах и IP-адресах, с которых пользователь посещал сайт
    const device: DeviceModel | null = await Device.findOne( {
      _id: user.device
    } )

    //Если список устройств не был найден, то проверяем сессии на добавление устройства в список устройств для текущего пользователя
    //Если сессия на подтверждение пароля не была найдена, создаем ее
    //Возвращаем ответ со статусом 403, описанием ошибки, идентификатором пользователя и типом необходимого действия
    if( !device ) {
      //Тут проверка и создание сессии на подтверждение пароля
      await checkDeviceInfo( user )

      return res.status( 403 ).json( {
        message: 'Вы пытаетесь зайти с неизвестного нам устройства. Пожалуйста, подтвердите что это вы!',
        userId: user.id,
        type: 'confirm-password'
      } )
    }

    //Если список устройств был найден, то формируем информацию об устройствах
    const deviceInfo = getDeviceInfo( req, device )

    //Если список устройств не содержит текущее устройство / Ip-адрес / браузер, то создаем сессию на подтверждение пароля
    //Возвращаем ответ со статусом 403, описанием ошибки, идентификатором пользователя и типом необходимого действия
    if( deviceInfo.needUpdate ) {
      await checkDeviceInfo( user )

      return res.status( 403 ).json( {
        message: 'Вы пытаетесь зайти с неизвестного нам устройства или IP-адреса.\nВ целях безопасности мы просим вас подтвердить, что вход в систему выполняете именно вы.\nПожалуйста укажите повторно пароль от вашей учетной записи.',
        userId: user.id,
        type: 'confirm-password'
      } )
    }

    //Если список содержит текущее устройство / Ip - адрес / браузер пользователя, то генерируем сессию пользователя
    const session = await createSession( res, user )

    //Обновляем полученный response с установленным cookie-файлами
    res = session.res

    //Отправляем сообщение об успешно авторизации, в случае если при создании сессии не возникло проблем
    //Если проблемы возникли, отправляем статус код ошибки и сообщение об ошибке
    return res.status( session.status ).json( session.message ? { message: session.message } : {
      userData: getUserInfo( user )
    } )

  } catch (e) {

    //Если в блоке Try произошли необработанные ошибки возвращаем ответ со статусом 500 и выводим ошибки в консоль
    console.log( e )
    return res.status( 500 ).json( {
      message: 'При создании сессии пользователя на сервере произошла неизвестная ошибка'
    } )
  }
} )

//Api-запрос на проверку авторизованности пользователя
router.post( '/check', async ( req: Request, res: Response<LoginResponse | ResponseModel> ) => {

  //Производим попытку проверить сессию пользователя
  try {

    //TODO Доработать функцию checkTokens, так как она не сбрасывает сессию пользователя с другого браузера
    //Функция checkTokens выполняет проверку токена доступа и refresh токена
    //Если AccessToken уничтожился, обновляем его
    //При каждом обновлении AccessToken'a обновляется и RefreshToken
    const result = await checkTokens( req, res )

    //Обновляем сформированный ответ
    res = result.res

    //Если при обновлении токена статус === 200, значит сессия активна и/или обновлена без проблем
    //Иначе возвращаем статус код при возникновении ошибки во время проверки и/или обновления сессии и описание этой ошибки
    if( result.status === 200 ) {
      return res.status( result.status ).json( { userData: getUserInfo( result.user ) } )
    } else {
      return res.status( result.status ).json( { message: result.message } )
    }
  } catch (e) {

    //Если во время проверки сессии произошла необработанная ошибка, возвращаем статус 500 и описание
    console.log( e )
    return res.status( 500 ).json( { message: 'Во время проверки сессии пользователя произошла непредвиденная ошибка' } )
  }
} )

//Api-запрос на завершение сессии пользователя (logout)
router.post( '/logout', async ( req: Request, res: Response<LoginResponse | ResponseModel> ) => {

  //Производим попытку завершить сессию пользователя
  try {
    //Проверяем сессию пользователя для действия logout
    const result = await checkTokens( req, res, 'logout' )

    //Если статус === 201 и пользователь с активной сессией был найден, то обновляем запись текущего пользователя
    if( result.status === 201 && result.user ) {
      await User.updateOne( { email: result.user.email }, {
        accessToken: null,
        refreshToken: null
      }, { multi: false } )
    }

    //Завершаем сессию пользователя, удаляя файлы cookie, устанавливая время жизни 0 секунд
    res = clearSession( res )

    //Формируем статус ответа
    const status = result.status === 201 || result.status === 200 ? 200 : result.status

    //Возвращаем ответ на фронт со статусом сформированным выше и описанием ответа
    return res.status( status ).json( { message: status === 200 ? 'Пользователь успешно завершил сессию.' : result.message } )
  } catch (e) {

    //Если произошла непредвиденная ошибка, то сообщаем об этом.
    console.log( e )
    return res.status( 500 ).json( { message: 'Во время завершения сессии пользователя произошла непредвиденная ошибка' } )
  }
} )

//Api-запрос для подтверждения пароля при добавлении нового устройства / браузера / IP-адреса к карточке пользователя
router.post( '/update_device', async ( req: Request<{ userId: string, password: string }>, res: Response<LoginResponse | ResponseModel> ) => {

  //Производим попытку обновить список устройств / браузеров / IP-адресов пользователя
  try {

    //Получаем идентификатор пользователя и пароль
    const { userId, password } = req.body
    console.log( 'Получаем userId: ', userId )

    //Производим поиск пользователя в базе данных
    const user: UserModel | null = await User.findOne( { _id: userId } )

    //Если пользователь не найден, запрещаем операцию
    if( !user ) {
      return res.status( 403 ).json( { message: 'Пользователь не найден!' } )
    }

    //Производим поиск сессии на подтверждение пароля и обновления списка устройств / браузеров / IP-адресов
    const updateRequest: UpdateDeviceRequestModel | null = await UpdateDevice.findOne( { userId: user.id } )

    console.clear()
    console.log( user )
    console.log( updateRequest )

    //Если такая сессия не была найдена, сообщаем о том, что сессия не была создана
    if( !updateRequest ) {
      return res.status( 409 ).json( { message: 'Некорректный запрос.' } )
    }

    //Если сессия умерла, то возвращаем ошибку 400 (Bad Request)
    if( updateRequest.die < Date.now() ) {
      return res.status( 400 ).json( {
        message: 'Время жизни сессии для подтверждения пароля - истекло.',
        userId: user.id,
        type: 'repeat-confirm-password'
      } )
    }

    //Если сессия на обновление списка доступных точек входа существует
    //Тогда сравниваем пароли пользователя, тот который он ввел, с тем что хранится в БД
    const passwordEquality = await bcrypt.compare( password, user.password )

    //Если пароли не совпадают, запрещаем операцию с описанием ошибки
    if( !passwordEquality ) {
      return res.status( 403 ).json( { message: 'Вы указали неверный пароль!' } )
    }

    //Получаем список точек входа, доступных для пользователя
    const device = await Device.findOne( { id: user.device } )
    //Формируем обновленный список точек входа, доступных для пользователя
    const deviceInfo = getDeviceInfo( req, device )
    //Обновляем информацию в базе данных
    const updating = await Device.updateOne( { id: user.device }, deviceInfo.data, { multi: false } )

    //Если данные не были успешно обновлены, возвращаем сообщение об ошибке
    if( !updating ) {
      return res.status( 400 ).json( {
        message: 'Нам не удалось обновить информацию о вашем устройстве, пожалуйста попробуйте позже',
        userId: user.id,
        type: 'confirm-password'
      } )
    }

    //Создаем запрос на удаление сессии для подтверждения пароля и добавления новых точек входа
    const deleteRequest = await UpdateDevice.findOneAndRemove( updateRequest, { multi: false } )

    //Если при поиске и удалении сессии произошла ошибка, сообщаем об этом.
    if( !deleteRequest ) {
      return res.status( 400 ).json( {
        message: 'При удалении сессии на подтверждение пароля и добавление нового устройства произошла ошибка!',
        userId: user.id,
        type: 'confirm-password'
      } )
    }

    //Если информация о точках входа пользователя успешно обновлена, создаем сессию пользователя
    const session = await createSession( res, user )
    //Обновляем данные для ответа
    res = session.res

    //Возвращаем ответ со статусом 200 и информацией о пользователя в случае успеха операции
    //Возвращаем статус с ошибкой при формировании сессии и описанием ошибки, если таковые имеются
    return res.status( session.status ).json( session.status !== 200 ? {
      //Сообщение об ошибке
      message: session.message
    } : {
      //Информация о пользователе
      userData: getUserInfo( user )
    } )
  } catch (e) {

    //Если произошла непредвиденная ошибка, сообщаем об этом.
    console.log( e )
    return res.status( 500 ).json( { message: 'Во время обновления списка устройств пользователя произошла непредвиденная ошибка!' } )
  }

} )


export const authRouter = router