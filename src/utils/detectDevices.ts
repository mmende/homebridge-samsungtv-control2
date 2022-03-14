import { Client } from 'ssdp-ts'
import UPNP from 'node-upnp'
import parseSN, { SamsungTVModel } from './parseSerialNumber'
import getMacAddress from './getMacAddress'
import filterUSN from './filterUSN'
// import { Logger } from 'homebridge'
import chalk from 'chalk'
import { SamsungPlatformConfig, UPNPCapability } from '../types/deviceConfig'

interface Headers {
  USN: string
  LOCATION: string
}
interface RemoteInfo {
  address: string
  family: `IPv4` | `IPv6`
  port: number
  size: number
}

interface CheckedUpnpDevice {
  friendlyName: string
  manufacturer?: string
  modelName?: string
  services?: { [service: string]: Record<string, unknown> }
}

export interface SamsungTV {
  friendlyName: string
  modelName: string
  model: SamsungTVModel
  usn: string
  mac: string
  location: string
  address: string
  capabilities: Array<UPNPCapability>
}

const checkDeviceDetails = async (
  headers: Headers,
  rinfo: RemoteInfo,
  config?: SamsungPlatformConfig,
) => {
  const deviceCustomizations =
    config && Array.isArray(config.devices) ? config.devices : []
  const usn = filterUSN(headers.USN)
  let upnp: UPNP
  let deviceDescription: CheckedUpnpDevice
  try {
    upnp = new UPNP({ url: headers.LOCATION })
    deviceDescription = (await upnp.getDeviceDescription()) as CheckedUpnpDevice
  } catch (err) {
    console.log(
      chalk`{red Got error while trying to check device with usn: "{yellow ${usn}}}".`,
      err,
    )
    return null
  }
  const { /* manufacturer, */ friendlyName, services = {} } = deviceDescription
  let { modelName } = deviceDescription
  // if (
  //   typeof manufacturer !== `string` ||
  //   manufacturer.indexOf(`Samsung Electronics`) < 0
  // ) {
  //   return null
  // }
  if (typeof modelName !== `string` || !modelName.length || modelName === "Samsung DTV DMR") {
    // Check if the modelName was configured manually
    const configuredDevice = deviceCustomizations.find((d) => d.usn === usn)
    if (configuredDevice && configuredDevice.modelName) {
      modelName = configuredDevice.modelName
    } else {
      console.log(
        chalk`Found a device ({blue ${friendlyName}}) that doesn't expose a correct Samsung model name. ` +
          chalk`If this is a Samsung TV add this device to your config with usn: "{green ${usn}}" and the correct model name (e.g. UN40C5000)`,
      )
      return null
    }
  }
  const model = parseSN(modelName)
  if (!model) {
    console.log(
      chalk`Found unparsable model name ({red ${modelName}}) for device {blue ${friendlyName}}, usn: "{green ${usn}}". Skipping it.`,
    )
    return null
  }
  let mac = `00:00:00:00:00:00`
  try {
    mac = await getMacAddress(rinfo.address)
  } catch (err) {
    const configuredDevice = deviceCustomizations.find((d) => d.usn === usn)
    if (configuredDevice && configuredDevice.mac) {
      mac = configuredDevice.mac
    } else {
      console.log(
        chalk`Could not determine mac address for {blue ${friendlyName}} (${modelName}), usn: "{green ${usn}}". Skipping it. ` +
          chalk`Please add the mac address manually to your config if you want to use this TV.`,
      )
      return null
    }
  }

  let capabilities: Array<UPNPCapability> = []
  const rcServiceName = Object.keys(services).find(
    (s) => s.indexOf(`RenderingControl`) !== -1,
  )
  if (rcServiceName) {
    try {
      const serviceDescription: {
        [action: string]: Record<string, unknown>
      } = await upnp.getServiceDescription(rcServiceName)
      capabilities = Object.keys(serviceDescription.actions)
    } catch (err) {
      console.log(
        chalk.yellow`Could not check capabilities for {blue ${friendlyName}} (${modelName}), usn: "{green ${usn}}".`,
        err,
      )
    }
  }

  const tv: SamsungTV = {
    friendlyName,
    modelName,
    model,
    usn,
    mac,
    capabilities,
    location: headers.LOCATION,
    address: rinfo.address,
  }
  return tv
}

export default async (
  // log?: Logger,
  config?: SamsungPlatformConfig,
): Promise<Array<SamsungTV>> => {
  const checkedDevices: Array<string> = []
  const client = new Client({
    ssdpSig: `USER-AGENT: Homebridge/42.0.0 UPnP/1.1 hbTV/8.21.0`,
    ssdpIp: `239.255.255.250`,
  })

  const deviceChecks: Array<Promise<SamsungTV | null>> = []
  client.on(
    `response`,
    (headers: Headers, statusCode: number, rinfo: RemoteInfo) => {
      if (statusCode !== 200) {
        return
      }
      if (checkedDevices.indexOf(filterUSN(headers.USN)) > -1) {
        return
      }
      checkedDevices.push(filterUSN(headers.USN))
      deviceChecks.push(checkDeviceDetails(headers, rinfo, config))
    },
  )
  client.search(`urn:schemas-upnp-org:device:MediaRenderer:1`)
  client.search(`urn:schemas-upnp-org:service:RenderingControl:1`)

  // Scan for scanDuration ms
  await new Promise<void>((res) => {
    setTimeout(() => {
      res()
    }, 5000)
  })

  const devices = await Promise.all(deviceChecks)
  return devices.filter((d) => !!d) as Array<SamsungTV>
}
