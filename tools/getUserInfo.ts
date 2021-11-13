import { UserModel } from '../models/User'
import { UserDataModel } from '../routes/auth.routes'

export const getUserInfo = ( user: UserModel | null ): UserDataModel | null => {
  return user ? {
    avatar: user.avatar,
    id: user.id,
    email: user.email,
    name: user.name || '',
    surname: user.surname || '',
    storageSpace: user.storageSpace,
    usingSpace: user.usingSpace,
    usingPercent: ( user.usingSpace / user.storageSpace ) * 100
  } : null
}