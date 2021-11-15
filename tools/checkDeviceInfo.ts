import { UserModel } from '../models/User'
import { UpdateDevice, UpdateDeviceRequestModel } from '../models/UpdateDeviceRequest'

export const checkDeviceInfo = async (user: UserModel) => {
  const item: UpdateDeviceRequestModel | null = await UpdateDevice.findOne( { userId: user.id } )

  if( !item ) {

    const updateDeviceRequest = new UpdateDevice( {
      userId: user.id,
      die: Date.now() + 1000 * 60 * 5
    } )
    await updateDeviceRequest.save()

  } else {

    if( item.die < Date.now() ) {

      await UpdateDevice.updateOne( item, {
        die: Date.now() + 1000 * 60 * 5
      }, { multi: false } )

    }

  }
}