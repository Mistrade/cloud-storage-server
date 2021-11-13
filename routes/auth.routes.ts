import { User, UserModel } from '../models/User'
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { validateTools } from '../tools/validate'
import validator from 'validator'
import jwt from 'jsonwebtoken'
import config from 'config'
import {
  checkTokens,
  createAccessToken,
  createRefreshToken,
  setCookie
} from '../tools/tokenActions'
import { getUserInfo } from '../tools/getUserInfo'

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
  message: string
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
      const user = new User( { email, password: hashPassword, name, surname } )

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
    console.log( 'Пользовать логинится: ', email )
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

    console.log('password: ' + password)
    console.log('passwordEquality: ', passwordEquality)
    console.log(user.password)

    if( !passwordEquality ) {
      return res.status( 403 ).json( { message: 'Указаны неверный логин или пароль!' } )
    }

    const token = createAccessToken( user )
    const refreshToken = createRefreshToken( user )

    res = setCookie( res, user ).res

    // await user.set()
    await User.updateOne( { email: user.email }, {
      accessToken: token,
      refreshToken: refreshToken
    }, { multi: false } )

    return res.status( 200 ).json( {
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

  res.cookie( 'AccessToken', null, { maxAge: 0 } )
  res.cookie( 'RefreshToken', null, { maxAge: 0 } )

  const status = result.status === 201 || result.status === 200 ? 200 : result.status

  return res.status( status ).json( { message: status === 200 ? 'Пользователь успешно завершил сессию.' : result.message } )
} )


export const authRouter = router