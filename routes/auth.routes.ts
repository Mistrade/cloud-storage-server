import { User, UserModel } from '../models/User'
import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { validateTools } from '../tools/validate'
import validator from 'validator'

interface RegistrationInput {
  email: string,
  password: string
}

interface ResponseModel {
  message: string
}

const router = express.Router()

router.post( '/registration',
  async ( req: Request<RegistrationInput>, res: Response<ResponseModel> ) => {
    try {
      const { email, password } = req.body
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
      const user = new User( { email, password: hashPassword } )

      await user.save()

      return res.status(200).json({message: 'Поздравляем! Вы успешно зарегистрированы!'})
    } catch (e) {
      console.log( e )
      res.status( 500 ).json( {
        message: 'Во время обработки регистрации нового пользователя на сервере произошла ошибка',
      } )
    }
  } )

router.post('/login', async () => {

})


export const authRouter = router