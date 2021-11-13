import { Schema, model } from 'mongoose'

export interface DeviceModel {
  deviceInfo: Array<UserDeviceInfoModel>,
  ipAddressList: Array<DeviceInfoIpAddressModel>,
}

export interface DeviceInfoIpAddressModel {
  ip: string,
}

export interface UserDeviceInfoModel {
  userAgent: string | null,
  browser: BrowserProps | null,
  engine: EngineProps | null,
  os: OperationSystemProps | null,
  device: DeviceInfoProps | null,
  cpu: DeviceProcessorProps | null,
}

export interface BrowserProps {
  name: string | null | undefined,
  version: string | null | undefined,
  major: string | null | undefined
}

export interface EngineProps {
  name: string | null | undefined,
  version: string | null | undefined
}

export interface OperationSystemProps {
  name: string | null | undefined,
  version: string | null | undefined
}

export interface DeviceInfoProps {
  vendor: string | null | undefined,
  model: string | null | undefined,
  type: string | null | undefined
}

export interface DeviceProcessorProps {
  architecture: string | null | undefined
}

const DeviceSchema = new Schema<DeviceModel>( {
  deviceInfo: [{
    type: {
      userAgent: { type: String || null, },
      browser: {
        type: {
          name: { type: String || null || undefined },
          version: { type: String || null || undefined },
          major: { type: String || null || undefined }
        } || null
      },
      engine: {
        type: {
          name: { type: String || null || undefined },
          version: { type: String || null || undefined }
        } || null
      },
      os: {
        type: {
          name: { type: String || null || undefined },
          version: { type: String || null || undefined }
        } || null
      },
      device: {
        type: {
          vendor: { type: String || null || undefined },
          model: { type: String || null || undefined },
          type: { type: String || null || undefined }
        } || null
      },
      cpu: {
        type: {
          architecture: { type: String || null || undefined }
        }
      }
    }
  }],
  ipAddressList: [{
    type: {
      ip: { type: String || null }
    }
  }]
} )

export const Device = model<DeviceModel>( 'Device', DeviceSchema )