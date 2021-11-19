import { User, UserModel } from '../../models/User'
import { Request, Response } from 'express'
import { LoginSuccessModel } from '../../../client/src/api/Methods/AuthApi'
import validator from 'validator'
import { validateTools } from '../../tools/validate'
import bcrypt from 'bcryptjs'
import { Device, DeviceModel } from '../../models/Device'
import { checkDeviceInfo } from '../../tools/checkDeviceInfo'
import { getDeviceInfo } from '../../tools/getDeviceInfo'
import { createSession } from '../../tools/createSession'
import jwt from 'jsonwebtoken'
import { Token } from '../../routes/auth.routes'

export const loginResolver = async ( parent: any, args: any, context: { req: Request<{ email: string, password: string }>, res: Response } ) => {
  const { req, res } = context

  try {
    //Получаем данные, которые отправил пользователь
    const { email, password } = args

    //Проверяем Email пользователя на валидность и если он не валидный, то возвращаю ответ со статусом 400 (BAD REQUEST)
    if( !validator.isEmail( email ) ) {
      return {
        errors: {
          message: 'Указан невалидный Email-адрес',
          type: "Email is not valid",
        }
      }
    }

    //Проверяем пароль на стандартные правила валидации (без хеша)
    const passwordValidate = validateTools.checkPassword( password )

    //Если пароль оказался не валидным, возвращаем статус-код 400 на фронт с описанием ошибки
    if( !passwordValidate.status ) {
      return {
        errors: {
          message: 'Указан некорректный пароль. Пароль должен содержать не менее 8 и не более 32 символов',
          type: "Incorrect password"
        }
      }
    }

    //Запрашиваем юзера в БД
    const user: UserModel | null = await User.findOne( { email } )

    //Если пользователь с указанным Email не найден, возвращаем статус-код 404 (Not Found) с описанием ошибки
    if( !user ) {
      return {
        errors: {
          message: "Пользователь с таким Email не найден!",
          type: "User not found",
        }
      }
      // res.status( 404 ).json( { message: '' } )
    }

    //Если карточка пользователя была найдена в Базе данных, то сверяем пароли из БД и полученный от пользователя
    const passwordEquality = await bcrypt.compare( password, user.password )

    //Если пароли не совпадают, то возвращаем запрет на авторизацию с описанием ошибки
    if( !passwordEquality ) {
      return {
        errors: {
          message: "Указаны неверный логин или пароль!",
          type: "Email or password is incorrect"
        }
      }
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

      return {
        errors: {
          message: 'Вы пытаетесь зайти с неизвестного нам устройства. Пожалуйста, подтвердите что это вы!',
          userId: user._id,
          type: 'confirm-password'
        }
      }
    }

    //Если список устройств был найден, то формируем информацию об устройствах
    const deviceInfo = getDeviceInfo( req, device )

    //Если список устройств не содержит текущее устройство / Ip-адрес / браузер, то создаем сессию на подтверждение пароля
    //Возвращаем ответ со статусом 403, описанием ошибки, идентификатором пользователя и типом необходимого действия
    if( deviceInfo.needUpdate ) {
      await checkDeviceInfo( user )

      return {
        errors: {
          message: 'Вы пытаетесь зайти с неизвестного нам устройства или IP-адреса.\nВ целях безопасности мы просим вас подтвердить, что вход в систему выполняете именно вы.\nПожалуйста укажите повторно пароль от вашей учетной записи.',
          userId: user._id,
          type: 'confirm-password'
        }
      }
    }

    //Если список содержит текущее устройство / Ip - адрес / браузер пользователя, то генерируем сессию пользователя
    await createSession( res, user )

    //Отправляем сообщение об успешно авторизации, в случае если при создании сессии не возникло проблем
    //Если проблемы возникли, отправляем статус код ошибки и сообщение об ошибке
    return user

  } catch (e) {

    //Если в блоке Try произошли необработанные ошибки возвращаем ответ со статусом 500 и выводим ошибки в консоль
    console.log( e )
    return e
  }
}