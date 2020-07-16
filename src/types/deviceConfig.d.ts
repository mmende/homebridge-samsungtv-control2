import { PLATFORM_NAME } from '../settings';

export interface DeviceConfig {
  name: string
  modelName: string
  mac: string
  lastKnownLocation: string
  lastKnownIp: string
  ignore?: boolean
  remoteControlPort?: number
  delay: number
  usn: string
  token?: string
}

export interface SamsungPlatformConfig {
  platform: typeof PLATFORM_NAME
  devices: { [usn: string]: DeviceConfig }
}