import { DeviceConfig, UPNPCapability } from '../types/deviceConfig'

export default (device: DeviceConfig, capability: UPNPCapability) =>
  device.capabilities.indexOf(capability) > -1
