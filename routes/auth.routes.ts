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
  type?: 'access-account'
}

export interface Token {
  id: string,
  email: string,
  date: number,
  dateEnd: number,
  type: 'access' | 'refresh'
}

const router = express.Router()

router.post( '/registration',
  async ( req: Request<RegistrationInput>, res: Response<ResponseModel> ) => {
    try {
      const { email, password, name, surname } = req.body
      console.log( 'Регистрация нового пользователя: ', email )

      if( !validator.isEmail( email ) ) {
        return res.status( 400 ).json( { message: 'Указан невалидный Email при регистрации пользователя' } )
      }

      const candidate: UserModel | null = await User.findOne( { email } )

      if( candidate ) {
        return res.status( 400 ).json( { message: 'Пользователь с таким Email-адресом уже существует.' } )
      }

      const passwordValidate = validateTools.checkPassword( password )

      if( !passwordValidate.status ) {
        return res.status( 400 ).json( { message: passwordValidate.message || 'Указан некорректный пароль для регистрации нового пользователя.' } )
      }
      const hashPassword: string = await bcrypt.hash( password, 8 )

      const deviceInfo = getDeviceInfo( req, null )
      const device = new Device( deviceInfo.data )
      await device.save()

      const user: UserModel = new User( {
        email,
        password: hashPassword,
        name,
        surname,
        device: device.id
      } )

      await user.save()


      return res.status( 200 ).json( { message: 'Поздравляем! Вы успешно зарегистрированы!' } )
    } catch (e) {
      console.log( e )
      return res.status( 500 ).json( {
        message: 'Во время обработки регистрации нового пользователя на сервере произошла ошибка'
      } )
    }
  } )

router.post( '/', async ( req: Request<RegistrationInput>, res: Response<LoginResponse | ResponseModel> ) => {
  try {
    const { email, password } = req.body
    console.log( 'Пользователь авторизуется: ', email )
    if( !validator.isEmail( email ) ) {
      return res.status( 400 ).json( { message: 'Указан невалидный Email-адрес' } )
    }

    const passwordValidate = validateTools.checkPassword( password )

    if( !passwordValidate.status ) {
      return res.status( 400 ).json( { message: 'Указан некорректный пароль. Пароль должен содержать не менее 8 и не более 32 символов' } )
    }

    const user: UserModel | null = await User.findOne( { email } )

    if( !user ) {
      return res.status( 404 ).json( { message: 'Пользователь с таким Email не найден!' } )
    }

    const passwordEquality = await bcrypt.compare( password, user.password )

    if( !passwordEquality ) {
      return res.status( 403 ).json( { message: 'Указаны неверный логин или пароль!' } )
    }

    const device: DeviceModel | null = await Device.findOne( {
      _id: user.device
    } )

    if( !device ) {
      await checkDeviceInfo( user )

      return res.status( 406 ).json( {
        message: 'Вы пытаетесь зайти с неизвестного нам устройства. Пожалуйста, подтвердите что это вы!',
        userId: user.id,
        type: 'access-account'
      } )
    }

    const deviceInfo = getDeviceInfo( req, device )

    if( deviceInfo.needUpdate ) {
      await checkDeviceInfo( user )

      return res.status( 406 ).json( {
        message: 'Вы пытаетесь зайти с неизвестного нам устройства или IP-адреса.\nВ целях безопасности мы просим вас подтвердить, что вход в систему выполняете именно вы.\nПожалуйста укажите повторно пароль от вашей учетной записи.',
        userId: user.id,
        type: 'access-account'
      } )
    }

    const session = await createSession( res, user )

    res = session.res

    return res.status( session.status ).json( session.message ? { message: session.message } : {
      userData: getUserInfo( user )
    } )

  } catch (e) {
    console.log( e )
    return res.status( 500 ).json( {
      message: 'При создании сессии пользователя на сервере произошла неизвестная ошибка'
    } )
  }
} )

router.post( '/check', async ( req: Request, res: Response<LoginResponse | ResponseModel> ) => {

  //TODO Доработать функцию checkTokens, так как она не сбрасывает сессию пользователя с другого браузера

  const result = await checkTokens( req, res )
  res = result.res

  if( result.status === 200 ) {
    return res.status( result.status ).json( { userData: getUserInfo( result.user ) } )
  } else {
    return res.status( result.status ).json( { message: result.message } )
  }
} )

router.post( '/logout', async ( req: Request, res: Response<ResponseModel> ) => {
  const result = await checkTokens( req, res, 'logout' )

  if( result.status === 201 && result.user ) {
    await User.updateOne( { email: result.user.email }, {
      accessToken: null,
      refreshToken: null
    }, { multi: false } )
  }

  res = clearSession( res )

  const status = result.status === 201 || result.status === 200 ? 200 : result.status

  return res.status( status ).json( { message: status === 200 ? 'Пользователь успешно завершил сессию.' : result.message } )
} )

router.post( '/update_device', async ( req: Request<{ userId: string, password: string }>, res ) => {
  const { userId, password } = req.body

  const user: UserModel | null = await User.findOne( { id: userId } )

  if( !user ) {
    return res.status( 403 ).json( { message: 'Пользователь не найден!' } )
  }

  const updateRequest: UpdateDeviceRequestModel | null = await UpdateDevice.findOne( { userId: user.id } )

  if( !updateRequest ) {
    return res.status( 409 ).json( { message: 'Время сессии для обновления информации об устройстве пользователя истекло.\nПожалуйста, попробуйте войти в систему снова.' } )
  }

  const passwordEquality = await bcrypt.compare( password, user.password )

  if( !passwordEquality ) {
    return res.status( 403 ).json( { message: 'Вы указали неверный пароль!' } )
  }

  const device = await Device.findOne( { id: user.device } )
  const deviceInfo = getDeviceInfo( req, device )
  const updating = await Device.updateOne( { id: user.device }, deviceInfo.data, { multi: false } )

  if( !updating ) {
    return res.status( 400 ).json( { message: 'Нам не удалось обновить информацию о вашем устройстве, пожалуйста попробуйте позже' } )
  }

  const session = await createSession( res, user )
  res = session.res

  return res.status( session.status ).json( session.status !== 200 ? {
    message: session.message
  } : {
    userData: getUserInfo( user )
  } )

} )


export const authRouter = router