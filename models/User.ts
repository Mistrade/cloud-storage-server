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
  avatar: string,
  files: Array<mongoose.Schema.Types.ObjectId>,
}

const UserSchema = new Schema( {
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  password: { type: String, required: true },
  storageSpace: { type: Number, default: 100 * megabyte },
  usingSpace: { type: Number, default: 0 },
  avatar: { type: String },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }]
} )

export const User = model<UserModel>( 'User', UserSchema )