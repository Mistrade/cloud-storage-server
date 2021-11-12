import { User, UserModel } from '../models/User'
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { validateTools } from '../tools/validate'
import validator from 'validator'
import jwt from 'jsonwebtoken'
import config from 'config'

interface RegistrationInput {
  email: string,
  password: string
  name: string,
  surname: string
}

interface LoginResponse {
  userData: UserDataModel
}

interface UserDataModel {
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
      console.log('Регистрация нового пользователя: ', email)

      if(!validator.isEmail(email)){
        return res.status(400).json({message: 'Указан невалидный Email при регистрации пользователя'})
      }

      const candidate: UserModel | null = await User.findOne( { email } )

      if( candidate ) {
        return res.status( 400 ).json( { message: 'Пользователь с таким Email-адресом уже существует.' } )
      }

      const passwordValidate = validateTools.checkPassword(password)

      if(!passwordValidate.status){
        return res.status(400).json({message: passwordValidate.message || 'Указан некорректный пароль для регистрации нового пользователя.'})
      }

      const hashPassword: string = await bcrypt.hash( password, 8 )
      const user = new User( { email, password: hashPassword, name, surname } )

      await user.save()

      return res.status(200).json({message: 'Поздравляем! Вы успешно зарегистрированы!'})
    } catch (e) {
      console.log( e )
      return res.status( 500 ).json( {
        message: 'Во время обработки регистрации нового пользователя на сервере произошла ошибка',
      } )
    }
  } )

router.post('/', async (req: Request<RegistrationInput>, res: Response<LoginResponse | ResponseModel>) => {
  try {
    const {email, password} = req.body
    console.log('Пользовать логинится: ', email)
    if(!validator.isEmail(email)){
      return res.status(400).json({message: 'Указан невалидный Email-адрес'})
    }

    const passwordValidate = validateTools.checkPassword(password)

    if(!passwordValidate.status){
      return res.status(400).json({message: 'Указан некорректный пароль. Пароль должен содержать не менее 8 и не более 32 символов'})
    }

    const user: UserModel | null = await User.findOne({email})

    if(!user){
      return res.status(404).json({message: 'Пользователь с таким Email не найден!'})
    }

    const passwordEquality = await bcrypt.compare(password, user.password)

    if(!passwordEquality){
      return res.status(403).json({message: 'Указаны неверный логин или пароль!'})
    }

    const tokenSettings: Token = {
      id: user.id,
      email: user.email,
      date: Date.now(),
      dateEnd: Date.now() + 1000*60*15,
      type: 'access'
    }

    const token = jwt.sign(tokenSettings, config.get('secretKey'), {
      expiresIn: '15m'
    })

    const refreshTokenSettings: Token = {
      id: user.id,
      email: user.email,
      date: Date.now(),
      dateEnd: Date.now() + 1000*60*60*24,
      type: 'refresh',
    }

    const refreshToken = jwt.sign(refreshTokenSettings, config.get('secretKey'), {
      expiresIn: '1d'
    })

    res.cookie('AccessToken', token, {
      maxAge: 60*15,
      path: '/',
      httpOnly: true,
    } )

    res.cookie('RefreshToken', refreshToken, {
      maxAge: 60*60*24,
      path: '/',
      httpOnly: true
    })

    return res.status(200).json({
      userData: {
        email: user.email,
        storageSpace: user.storageSpace,
        usingSpace: user.usingSpace,
        usingPercent: (user.usingSpace / user.storageSpace)*100,
        id: user.id,
      }
    })
  } catch (e) {
    console.log( e )
    return res.status( 500 ).json( {
      message: 'Во время обработки регистрации нового пользователя на сервере произошла ошибка',
    } )
  }
})


export const authRouter = router