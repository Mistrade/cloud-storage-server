import { model, Schema } from 'mongoose'

export interface UpdateDeviceRequestModel {
  userId: string,
  die: number
}

const UpdateDeviceRequestSchema = new Schema({
  userId: {type: Schema.Types.ObjectId, required: true, unique: true},
  die: {type: Number, required: true}
})

export const UpdateDevice = model<UpdateDeviceRequestModel>('UpdateDevice', UpdateDeviceRequestSchema)