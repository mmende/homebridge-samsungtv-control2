import Remote from 'node-upnp-remote';
import UPNP from 'node-upnp';
import { Samsung, KEYS, APPS } from 'samsung-tv-control';
import { PLATFORM_NAME } from '../settings';
import parseSerialNumber from './parseSerialNumber';
import { Logger } from 'homebridge';
import { DeviceConfig } from '../types/deviceConfig';

const getRemoteConfig = (config: DeviceConfig) => {
  const model = parseSerialNumber(config.modelName);
  const { year = 2013 } = model || {};
  const supportsLegacy = typeof year === 'number' && year < 2014;
  const port = config.remoteControlPort || supportsLegacy ? 55000 : 8002;
  return {
    mac: config.mac,
    ip: config.lastKnownIp,
    name: PLATFORM_NAME,
    port,
  };
};

export const pair = async (config: DeviceConfig, log: Logger) => {
  const { token, modelName } = config;
  const model = parseSerialNumber(modelName);
  const { year = 2013 } = model || {};
  const supportsLegacy = typeof year === 'number' && year < 2014;
  if (supportsLegacy) {
    log.debug(`${config.name} - Skipping pairing since this TV is from ${year} and should support the legacy protocol without pairing.`);
    return null;
  }
  const { yearKey } = model || {};
  if (yearKey === 'J' || yearKey === 'H') {
    log.debug(`${config.name} - This TV seems to be a ${yearKey}-Series which probably won't work with this plugin.`);
  }
  if (token) {
    return token;
  }
  const cfg = getRemoteConfig(config);
  const control = new Samsung(cfg);
  await control.getTokenPromise();
  return token;
};

const isAvailable = async (config: DeviceConfig) => {
  const cfg = getRemoteConfig(config);
  const control = new Samsung(cfg);
  const available = await control.isAvailablePing();
  control.closeConnection();
  return available;
};

const sendKey = async (config: DeviceConfig, key: KEYS) => {
  const cfg = getRemoteConfig(config);
  const control = new Samsung(cfg);
  await control.sendKeyPromise(key);
  control.closeConnection();
};

export const sendKeys = async (config: DeviceConfig, keys: Array<KEYS>) => {
  const cfg = getRemoteConfig(config);
  const control = new Samsung(cfg);
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i];
    await control.sendKeyPromise(key);
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, config.delay);
    });
  }
  control.closeConnection();
};

const openApp = async (config: DeviceConfig, app: APPS) => {
  const cfg = getRemoteConfig(config);
  const control = new Samsung(cfg);
  await control.openAppPromise(app);
  control.closeConnection();
};

const turnOn = async (config: DeviceConfig) => {
  const cfg = getRemoteConfig(config);
  const control = new Samsung(cfg);
  await control.turnOn();
  control.closeConnection();
};

export const getDeviceInfo = async (config: DeviceConfig) => {
  const { lastKnownLocation: url } = config;
  const upnp = new UPNP({ url });
  const info = await upnp.getDeviceDescription();
  return info;
};

export const getActive = async (config: DeviceConfig) => {
  return await isAvailable(config);
};

export const setActive = async (config: DeviceConfig, active: boolean) => {
  const isActive = await isAvailable(config);
  if (active === isActive) {
    return;
  }
  if (active) {
    await turnOn(config);
  } else {
    sendKey(config, KEYS.KEY_POWEROFF);
  }
};

export const getVolume = async (config: DeviceConfig) => {
  const { lastKnownLocation: url } = config;
  const remote = new Remote({ url });
  const volume = await remote.getVolume();
  return volume;
};

export const setVolume = async (config: DeviceConfig, volume: number) => {
  const { lastKnownLocation: url, disableUpnpSetters } = config;
  if (!disableUpnpSetters) {
    const remote = new Remote({ url });
    await remote.setVolume(volume);
    return;
  }
  const currentVolume = await getVolume(config);
  const volumeOffset = volume - currentVolume;
  if (volumeOffset === 0) {
    return;
  }
  const keys: Array<KEYS> = [];
  let key: KEYS = KEYS.KEY_VOLUP;
  if (volumeOffset < 0) {
    key = KEYS.KEY_VOLDOWN;
  }
  for (let i = 0; i < Math.abs(volumeOffset); ++i) {
    keys.push(key);
  }
  await sendKeys(config, keys);
};

export const volumeUp = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_VOLUP);
};

export const volumeDown = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_VOLDOWN);
};

export const getMute = async (config: DeviceConfig) => {
  const { lastKnownLocation: url } = config;
  const remote = new Remote({ url });
  return remote.getMute();
};

export const setMute = async (config: DeviceConfig, mute: boolean) => {
  const { lastKnownLocation: url, disableUpnpSetters } = config;
  if (!disableUpnpSetters) {
    const remote = new Remote({ url });
    await remote.setMute(mute);
    return;
  }
  const isMuted = await getMute(config);
  // Only toggle mute state when the desired state differs
  // from the current state
  if ((isMuted && mute) || (!isMuted && !mute)) {
    return;
  }
  await sendKey(config, KEYS.KEY_MUTE);
};

export const getBrightness = async (config: DeviceConfig) => {
  const { lastKnownLocation: url } = config;
  const upnp = new UPNP({ url });
  const { CurrentBrightness: brightness } = await upnp.call('RenderingControl', 'GetBrightness', { InstanceID: 0 });
  return brightness;
};

export const setBrightness = async (config: DeviceConfig, brightness: number) => {
  const { lastKnownLocation: url, disableUpnpSetters } = config;
  if (!disableUpnpSetters) {
    const upnp = new UPNP({ url });
    await upnp.call('urn:upnp-org:serviceId:RenderingControl', 'SetBrightness', { InstanceID: 0, DesiredBrightness: brightness });
  }
  // Brightness cannot be set otherwise...
};

export const rewind = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_REWIND);
};

export const fastForward = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_FF);
};

export const arrowUp = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_UP);
};

export const arrowDown = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_DOWN);
};

export const arrowLeft = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_LEFT);
};

export const arrowRight = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_RIGHT);
};

export const select = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_ENTER);
};

export const back = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_RETURN);
};

export const exit = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_HOME);
};

export const playPause = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_PLAY); // PAUSE?
};

export const info = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_INFO);
};


export const openTV = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_TV);
};

export const openHDMI = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_HDMI);
};

export const openHDMI1 = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_HDMI1);
};

export const openHDMI2 = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_HDMI2);
};

export const openHDMI3 = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_HDMI3);
};

export const openHDMI4 = async (config: DeviceConfig) => {
  await sendKey(config, KEYS.KEY_HDMI4);
};

export const openAppleTV = async (config: DeviceConfig) => {
  await openApp(config, APPS['Apple TV']);
};

export const openNetflix = async (config: DeviceConfig) => {
  await openApp(config, APPS.Netflix);
};

export const openPrimeVideo = async (config: DeviceConfig) => {
  await openApp(config, APPS['Prime Video']);
};

export const openSpotify = async (config: DeviceConfig) => {
  await openApp(config, APPS.Spotify);
};

export const openYouTube = async (config: DeviceConfig) => {
  await openApp(config, APPS.YouTube);
};