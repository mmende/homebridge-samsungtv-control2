import { Client } from 'ssdp-ts';
import UPNP from 'node-upnp';
import parseSN, { SamsungTVModel } from './parseSerialNumber';
import getMacAddress from './getMacAddress';

interface Headers {
  USN: string
  LOCATION: string
}
interface RemoteInfo {
  address: string
  family: 'IPv4' | 'IPv6'
  port: number,
  size: number
}

interface CheckedUpnpDevice {
  friendlyName: string
  manufacturer?: string
  modelName?: string
}

export interface SamsungTV {
  friendlyName: string
  modelName: string
  model: SamsungTVModel
  usn: string
  mac: string
  location: string
  address: string
}

const checkDeviceDetails = async (headers: Headers, rinfo: RemoteInfo) => {
  const upnp = new UPNP({ url: headers.LOCATION });
  const deviceDescription = await upnp.getDeviceDescription() as CheckedUpnpDevice;
  const { manufacturer, friendlyName, modelName } = deviceDescription;
  if (typeof manufacturer !== 'string' || manufacturer.indexOf('Samsung Electronics') < 0) {
    return null;
  }
  if (typeof modelName !== 'string' || !modelName.length) {
    return null;
  }
  const model = parseSN(modelName);
  if (!model) {
    return null;
  }
  let mac = '00:00:00:00:00:00';
  try {
    mac = await getMacAddress(rinfo.address);
  } catch (err) {
    console.warn(`Could not get mac address for "${friendlyName}". Please replace "${mac}" with the actual mac address in your config.`); // eslint-disable-line
  }

  const tv: SamsungTV = {
    friendlyName,
    modelName,
    model,
    usn: headers.USN,
    mac,
    location: headers.LOCATION,
    address: rinfo.address,
  };
  return tv;
};

export default async (): Promise<Array<SamsungTV>> => {
  const checkedDevices: Array<string> = [];
  const client = new Client({
    ssdpSig: 'USER-AGENT: Homebridge/42.0.0 UPnP/1.1 hbTV/8.21.0',
    ssdpIp: '239.255.255.250',
  });

  const deviceChecks: Array<Promise<SamsungTV | null>> = [];
  client.on('response', (headers: Headers, statusCode: number, rinfo: RemoteInfo) => {
    if (statusCode !== 200) {
      return;
    }
    if (checkedDevices.indexOf(headers.USN) > -1) {
      return;
    }
    checkedDevices.push(headers.USN);
    deviceChecks.push(checkDeviceDetails(headers, rinfo));
  });
  client.search('urn:schemas-upnp-org:service:RenderingControl:1');

  // Scan for scanDuration ms
  await new Promise(res => {
    setTimeout(() => {
      res();
    }, 5000);
  });

  const devices = await Promise.all(deviceChecks);
  return devices.filter(d => !!d) as Array<SamsungTV>;
};