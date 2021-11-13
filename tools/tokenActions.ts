import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User, UserModel } from '../models/User'
import { Token } from '../routes/auth.routes'
import config from 'config'

export const createRefreshToken = ( user: UserModel ) => {
  const token: Token = {
    id: user.id,
    email: user.email,
    date: Date.now(),
    dateEnd: Date.now() + 1000 * 60 * 60 * 24,
    type: 'refresh'
  }

  return jwt.sign( token, config.get( 'secretKey' ), {
    expiresIn: '30d'
  } )
}

export const createAccessToken = ( user: UserModel ) => {
  const token: Token = {
    id: user.id,
    email: user.email,
    date: Date.now(),
    dateEnd: Date.now() + 1000 * 60 * 15,
    type: 'access'
  }

  return jwt.sign( token, config.get( 'secretKey' ), {
    expiresIn: '15m'
  } )
}

export const accessTokenCookieConfig = {
  maxAge: 60 * 15 * 1000,
  path: '/',
  httpOnly: true
}

export const refreshTokenCookieConfig = {
  maxAge: 60 * 60 * 24 * 1000 * 30,
  path: '/',
  httpOnly: true
}

export const setCookie = ( res: Response, user: UserModel ) => {
  const accessToken = createAccessToken( user )
  const refreshToken = createRefreshToken( user )
  console.log( 'старый RefreshToken: ', user.refreshToken )
  console.log( 'новый RefreshToken: ', refreshToken )
  console.log( 'старый accessToken: ', user.accessToken )
  console.log( 'новый AccessToken: ', accessToken )
  res.cookie( 'AccessToken', accessToken, accessTokenCookieConfig )
  res.cookie( 'RefreshToken', refreshToken, refreshTokenCookieConfig )

  return {
    res,
    accessToken,
    refreshToken
  }
}

export const checkTokens = async ( req: Request<any>, res: Response<any>, action: 'logout' | 'any' = 'any' ): Promise<{
  status: number,
  message: string,
  req: Request<any>,
  res: Response<any>,
  user: UserModel | null
}> => {
  const cookie = req.headers.cookie?.split( ';' )

  if( !cookie?.length ) {
    return { status: 401, message: 'Пользователь не авторизован', req, res, user: null }
  }

  let accessToken = ''
  let refreshToken = ''

  cookie.forEach( ( item ) => {
    if( item.includes( 'AccessToken' ) ) {
      const newItem = item.split( '=' )
      if( newItem[ 0 ].trim() === 'AccessToken' ) {
        accessToken = newItem[ 1 ].trim()
      }
    }

    if( item.includes( 'RefreshToken' ) ) {
      const newItem = item.split( '=' )
      if( newItem[ 0 ].trim() === 'RefreshToken' ) {
        refreshToken = newItem[ 1 ].trim()
      }
    }
  } )

  if( !refreshToken ) {
    return { status: 429, message: 'Пользователь не авторизован!', req, res, user: null }
  }

  const { email, dateEnd, id } = jwt.decode( refreshToken ) as Token
  const user: UserModel | null = await User.findOne( { email, id } )


  if( !user ) {
    return { status: 404, message: 'Пользователь не найден!', req, res, user: null }
  }

  if( !accessToken && action !== 'logout' ) {
    const tokens = setCookie( res, user )
    res = tokens.res

    console.log( 'refreshTokens: ', tokens.refreshToken === refreshToken )
    await User.updateOne( { email: user.email, id, refreshToken }, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }, { multi: false } )
    return { status: 200, message: 'Токены доступа были обновлены!', req, res, user }
  }

  return action !== 'logout'
    ? { status: 200, message: 'Токены доступа не нуждаются в обновлении!', req, res, user }
    : { status: 201, message: 'Юзер существует', req, res, user }
}