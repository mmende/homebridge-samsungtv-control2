interface DeviceConfig {
  name: string
  modelName: string
  mac: string
  lastKnownLocation: string
  lastKnownIp: string
  ignore?: boolean
  remoteControlPort?: number
  delay: number
  usn: string
}