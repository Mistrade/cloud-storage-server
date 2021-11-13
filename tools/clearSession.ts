import { Response } from 'express'

export const clearSession = (res: Response): Response<any> => {
  res.cookie( 'AccessToken', null, { maxAge: 0 } )
  res.cookie( 'RefreshToken', null, { maxAge: 0 } )

  return res
}