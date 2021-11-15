import { Request } from 'express'
import { UserModel } from '../models/User'
import uaParser from 'ua-parser-js'
import { Schema } from 'mongoose'
import { DeviceModel } from '../models/Device'

interface GetDeviceInfoResultType {
  needUpdate: boolean,
  data: DeviceModel
}

export const getDeviceInfo = ( req: Request<any>, device: DeviceModel | null ): GetDeviceInfoResultType => {
  let needUpdate: boolean = false
  const userIp = req.ip === '::1' ? '127.0.0.1' : req.ip
  const userAgent = req.headers[ 'user-agent' ] || null
  const deviceInfoItem = uaParser( userAgent || '' )
  const ipAddressList = device?.ipAddressList || []
  const deviceList: DeviceModel['deviceInfo'] = device?.deviceInfo || []

  const hasIp = ipAddressList.find( ( item ) => {
    return item.ip === userIp
  } )

  const hasDevice = deviceList.find( ( item ) => {
    return item.userAgent === userAgent
  } )

  if( !hasDevice ) {
    console.log('Пользователь зашел с неизвестного устройства/браузера: ', userAgent)
    needUpdate = true
    deviceList.push( {
      userAgent: userAgent || null,
      browser: {
        version: deviceInfoItem.browser.version || null,
        name: deviceInfoItem.browser.name || null,
        major: deviceInfoItem.browser.major || null
      },
      engine: {
        name: deviceInfoItem.engine.name || null,
        version: deviceInfoItem.engine.version || null
      },
      os: {
        name: deviceInfoItem.os.name || null,
        version: deviceInfoItem.os.version || null
      },
      device: {
        vendor: deviceInfoItem.device.vendor || null,
        model: deviceInfoItem.device.model || null,
        type: deviceInfoItem.device.type || null
      },
      cpu: {
        architecture: deviceInfoItem.cpu.architecture || null
      }
    } )
  }


  console.log('Ip-адрес пользователя: ', userIp)
  if( !hasIp ) {
    console.log('Пользователь зашел с неизвестного Ip-адреса: ', userIp)
    needUpdate = true
    ipAddressList.push( { ip: userIp } )
  }

  return {
    needUpdate,
    data: {
      deviceInfo: deviceList,
      ipAddressList
    }
  }

}