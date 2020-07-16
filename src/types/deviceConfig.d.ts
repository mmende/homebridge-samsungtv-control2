import { PLATFORM_NAME } from '../settings';

export interface DeviceConfig {
  name: string
  modelName: string
  mac: string
  lastKnownLocation: string
  lastKnownIp: string
  usn: string
  delay: number
  ignore?: boolean
  remoteControlPort?: number
  token?: string
  customInputs?: {
    [label: string]: string
  }
  disableUpnpSetters?: boolean
}

export interface SamsungPlatformConfig {
  platform: typeof PLATFORM_NAME
  devices: Array<DeviceConfig>
}