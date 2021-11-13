import mongoose from 'mongoose'

const megabyte = 1024 * 1000

const { Schema, model } = mongoose

export type UserModel = mongoose.Document & {
  email: string,
  name: string,
  surname: string,
  password: string,
  storageSpace: number,
  usingSpace: number,
  accessToken: string | null,
  refreshToken: string | null,
  avatar: string | null,
  files: Array<mongoose.Schema.Types.ObjectId>,
  lastLogin: number | null
}

const UserSchema = new Schema( {
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  password: { type: String, required: true },
  accessToken: { type: String || null, default: null },
  refreshToken: { type: String || null, default: null },
  lastLogin: { type: Number || null, default: null },
  storageSpace: { type: Number, default: 100 * megabyte },
  usingSpace: { type: Number, default: 0 },
  avatar: { type: String || null, default: null },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }]
} )

export const User = model<UserModel>( 'User', UserSchema )