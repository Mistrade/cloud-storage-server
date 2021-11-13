import { User, UserModel } from '../models/User'
import { setCookie } from './tokenActions'
import { validateTools } from './validate'
import { Response } from 'express'

export const createSession = async ( res: Response<any>, user: UserModel ) => {
  try {
    const authData = setCookie( res, user )

    const lastLoginPattern = 'DD.MM.YYYY HH:MM:SS'

    await User.updateOne( { email: user.email }, {
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      lastLogin: validateTools.getLastLoginDate( lastLoginPattern )
    }, { multi: false } )

    res = authData.res
    return {
      status: 200,
      message: '',
      res
    }
  } catch (e) {
    return {
      res,
      status: 500,
      message: 'Произошла непредвиденная ошибка вовремя создания сессии.'
    }
  }
}