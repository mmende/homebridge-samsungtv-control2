import {
  API,
  APIEvent,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
  DynamicPlatformPlugin,
} from 'homebridge';
import { PLUGIN_NAME/*, PLATFORM_NAME*/ } from './settings';
import detectDevices from './utils/detectDevices';
import * as remote from './utils/remote';
import { DeviceConfig, SamsungPlatformConfig } from './types/deviceConfig';
// import updateDeviceConfig from './utils/updateDeviceConfig';
import { KEYS } from 'samsung-tv-control';
import flatten from 'lodash.flatten';

export class SamsungTVHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap
    .Characteristic;

  // this is used to track restored cached accessories
  // public readonly accessories: PlatformAccessory[] = [];
  public readonly tvAccessories: Array<PlatformAccessory> = [];
  private devices: Array<DeviceConfig> = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    // Add devices
    api.on(APIEvent.DID_FINISH_LAUNCHING, async () => {
      await this.discoverDevices();
      await this.pairDevices();

      // Register all TV's
      for (const device of this.devices) {
        this.registerTV(device.usn);
      }

      // Regularly discover upnp devices and update ip's, locations for registered devices
      setInterval(async () => {
        await this.discoverDevices();
      }, 1000 * 60 * 5 /* 5min */);

      /**
       * @TODO
       * Add subscriptions to update getters
      */
    });
  }

  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(): void {
    this.log.debug('Configuring accessory');
  }

  private async discoverDevices() {
    const devices: Array<DeviceConfig> = [];
    const samsungTVs = await detectDevices();
    for (const tv of samsungTVs) {
      const { usn, friendlyName: name, modelName, location: lastKnownLocation, address: lastKnownIp, mac } = tv;
      const device: DeviceConfig = {
        name,
        modelName,
        lastKnownLocation,
        lastKnownIp,
        mac,
        usn,
        delay: 500,
      };
      // Check if the tv was in the devices list before
      // if so, only replace the relevant parts
      // const existingDevice = devices[usn];
      // const existingDevice = existingDevices.find(d => d.usn === usn);
      // if (existingDevice) {
      //   devices.push({
      //     ...existingDevice,
      //     modelName: device.modelName,
      //     lastKnownLocation: device.lastKnownLocation,
      //     lastKnownIp: device.lastKnownIp,
      //     token: device.token,
      //   });
      // } else {
      this.log.info(`Discovered TV "${device.name}" with usn "${device.usn}"`);
      devices.push(device);
      // }
      // devices[usn] = device;
    }

    // Add all existing devices that where not discovered
    /**
     * @todo
     * store devices in users ?
     */
    // for (const existingDevice of existingDevices) {
    //   const { usn } = existingDevice;
    //   const device = devices.find(d => d.usn === usn);
    //   if (!device) {
    //     devices.push(existingDevice);
    //   }
    // }

    // Get additional options from config
    const configDevices = (this.config as SamsungPlatformConfig).devices || [];
    for (const configDevice of configDevices) {
      // Search for the device in the persistent devices and overwrite the values
      const { usn } = configDevice;
      const deviceIdx = devices.findIndex(d => d.usn === usn);
      if (deviceIdx === -1) {
        continue;
      }
      const device = devices[deviceIdx];
      this.log.debug(`Found overwrites for "${device.name}" in config`);
      devices[deviceIdx] = {
        ...device,
        ...configDevice,
      };
    }
    // Store modified devices in persistent storage
    // this.platformAccessory.context.devices = devices;
    this.devices = devices;
    // return devices;
  }

  private async pairDevices() {
    for (const device of this.devices) {
      // Try pairing if not done already
      if (!device.ignore) {
        try {
          const token = await remote.pair(device, this.log);
          if (token) {
            device.token = token;
          }
        } catch (err) {
          this.log.warn(
            'Did not receive pairing token. Either you did not click "Allow" in time or your TV might not be supported.' +
            'You might just want to restart homebridge and retry.',
          );
        }
      }
    }
  }

  private getDevice(usn) {
    const device = this.devices.find(d => d.usn === usn);
    return device as DeviceConfig;
  }

  private registerTV(usn: string) {
    const device = this.getDevice(usn);
    if (!device || device.ignore) {
      return;
    }

    // generate a UUID
    const uuid = this.api.hap.uuid.generate(device.usn);

    // create the accessory
    const tvAccessory = new this.api.platformAccessory(device.name, uuid);
    tvAccessory.context = device;

    this.tvAccessories.push(tvAccessory);

    // get the name
    const tvName = device.name;

    // set the accessory category
    tvAccessory.category = this.api.hap.Categories.TELEVISION;

    // add the tv service
    const tvService = tvAccessory.addService(this.Service.Television);
    // set the tv name, manufacturer etc.
    tvService.setCharacteristic(this.Characteristic.ConfiguredName, tvName);

    const accessoryService = tvAccessory.getService(this.Service.AccessoryInformation) || new this.Service.AccessoryInformation();
    accessoryService
      .setCharacteristic(this.Characteristic.Model, device.modelName)
      .setCharacteristic(this.Characteristic.Manufacturer, 'Samsung Electronics')
      .setCharacteristic(this.Characteristic.Name, device.name)
      .setCharacteristic(this.Characteristic.SerialNumber, device.usn);

    // set sleep discovery characteristic
    tvService.setCharacteristic(
      this.Characteristic.SleepDiscoveryMode,
      this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
    );

    // handle on / off events using the Active characteristic
    tvService
      .getCharacteristic(this.Characteristic.Active)
      .on('get', async (callback) => {
        this.log.debug(`${tvName} - GET Active`);
        try {
          const isActive = await remote.getActive(this.getDevice(usn));
          callback(null, isActive);
        } catch (err) {
          callback(err);
        }
      })
      .on('set', async (newValue, callback) => {
        this.log.debug(`${tvName} - SET Active => setNewValue: ${newValue}`);
        try {
          await remote.setActive(this.getDevice(usn), newValue);
          tvService.updateCharacteristic(
            this.Characteristic.Active,
            newValue ? this.Characteristic.Active.ACTIVE : this.Characteristic.Active.INACTIVE,
          );
          callback(null);
        } catch (err) {
          callback(err);
        }
      });

    tvService
      .getCharacteristic(this.Characteristic.Brightness)
      .on('get', async (callback) => {
        this.log.debug(`${tvName} - GET Brightness`);
        try {
          const brightness = await remote.getBrightness(this.getDevice(usn));
          callback(null, brightness);
        } catch (err) {
          callback(err);
        }
      })
      .on('set', async (newValue, callback) => {
        this.log.debug(`${tvName} - SET Brightness => setNewValue: ${newValue}`);
        try {
          await remote.setBrightness(this.getDevice(usn), newValue);
          tvService.updateCharacteristic(this.Characteristic.Brightness, newValue);
          callback(null);
        } catch (err) {
          callback(err);
        }
      });

    // handle remote control input
    tvService
      .getCharacteristic(this.Characteristic.RemoteKey)
      .on('set', async (newValue, callback) => {
        try {
          switch (newValue) {
            case this.Characteristic.RemoteKey.REWIND: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: REWIND`);
              await remote.rewind(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.FAST_FORWARD: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: FAST_FORWARD`);
              await remote.fastForward(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.NEXT_TRACK: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: NEXT_TRACK`);
              break;
            }
            case this.Characteristic.RemoteKey.PREVIOUS_TRACK: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: PREVIOUS_TRACK`);
              break;
            }
            case this.Characteristic.RemoteKey.ARROW_UP: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: ARROW_UP`);
              await remote.arrowUp(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.ARROW_DOWN: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: ARROW_DOWN`);
              await remote.arrowDown(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.ARROW_LEFT: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: ARROW_LEFT`);
              await remote.arrowLeft(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.ARROW_RIGHT: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: ARROW_RIGHT`);
              await remote.arrowRight(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.SELECT: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: SELECT`);
              await remote.select(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.BACK: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: BACK`);
              await remote.back(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.EXIT: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: EXIT`);
              await remote.exit(this.getDevice(usn));
              break;
            }
            case this.Characteristic.RemoteKey.PLAY_PAUSE: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: PLAY_PAUSE`);
              break;
            }
            case this.Characteristic.RemoteKey.INFORMATION: {
              this.log.debug(`${tvName} - SET Remote Key Pressed: INFORMATION`);
              await remote.info(this.getDevice(usn));
              break;
            }
          }
        } catch (err) {
          callback(err);
          return;
        }
        callback(null);
      });

    /**
     * Create a speaker service to allow volume control
     */
    const speakerService = tvAccessory.addService(
      this.Service.TelevisionSpeaker,
    );

    speakerService
      .setCharacteristic(
        this.Characteristic.Active,
        this.Characteristic.Active.ACTIVE,
      )
      .setCharacteristic(
        this.Characteristic.VolumeControlType,
        this.Characteristic.VolumeControlType.ABSOLUTE,
      );

    // handle volume control
    speakerService
      .getCharacteristic(this.Characteristic.Volume)
      .on('get', async callback => {
        this.log.debug(`${tvName} - GET Volume`);
        try {
          const volume = await remote.getVolume(this.getDevice(usn));
          callback(null, volume);
        } catch (err) {
          callback(err);
        }
      })
      .on('set', async (newValue, callback) => {
        this.log.debug(`${tvName} - SET Volume => setNewValue: ${newValue}`);
        try {
          await remote.setVolume(this.getDevice(usn), newValue);
          speakerService.getCharacteristic(this.Characteristic.Mute).updateValue(false);
          callback(null);
        } catch (err) {
          callback(err);
        }
      });

    speakerService
      .getCharacteristic(this.Characteristic.Mute)
      .on('get', async callback => {
        this.log.debug(`${tvName} - GET Mute`);
        try {
          const muted = await remote.getMute(this.getDevice(usn));
          callback(null, muted);
        } catch (err) {
          callback(err);
        }
      })
      .on('set', async (value, callback) => {
        this.log.debug(`${tvName} - SET Mute: ${value}`);
        try {
          await remote.setMute(this.getDevice(usn), value);
          callback(null);
        } catch (err) {
          callback(err);
        }
      });

    const inputSources = [
      { id: 'tv', label: 'TV', type: this.Characteristic.InputSourceType.TUNER, fn: remote.openTV },
      { id: 'hdmi', label: 'HDMI', type: this.Characteristic.InputSourceType.HDMI, fn: remote.openHDMI },
      { id: 'hdmi1', label: 'HDMI1', type: this.Characteristic.InputSourceType.HDMI, fn: remote.openHDMI1, disabled: true },
      { id: 'hdmi2', label: 'HDMI2', type: this.Characteristic.InputSourceType.HDMI, fn: remote.openHDMI2, disabled: true },
      { id: 'hdmi3', label: 'HDMI3', type: this.Characteristic.InputSourceType.HDMI, fn: remote.openHDMI3, disabled: true },
      { id: 'hdmi4', label: 'HDMI4', type: this.Characteristic.InputSourceType.HDMI, fn: remote.openHDMI4, disabled: true },
      { id: 'appleTv', label: 'AppleTV', type: this.Characteristic.InputSourceType.APPLICATION, fn: remote.openAppleTV, disabled: true },
      { id: 'netflix', label: 'Netflix', type: this.Characteristic.InputSourceType.APPLICATION, fn: remote.openNetflix, disabled: true },
      {
        id: 'primeVideo', label: 'Prime Video', type: this.Characteristic.InputSourceType.APPLICATION, fn: remote.openPrimeVideo,
        disabled: true,
      },
      { id: 'spotify', label: 'Spotify', type: this.Characteristic.InputSourceType.APPLICATION, fn: remote.openSpotify, disabled: true },
      { id: 'youTube', label: 'YoutTube', type: this.Characteristic.InputSourceType.APPLICATION, fn: remote.openYouTube },
    ];
    const sources = [...inputSources];
    const { inputs = [] } = device;
    for (const cInput of inputs) {
      let keys: Array<KEYS> = [];
      if (/^[0-9]+$/.test(cInput.keys)) {
        for (let i = 0; i < cInput.keys.length; ++i) {
          const num = cInput.keys[i];
          keys.push(KEYS[`KEY_${num}`]);
        }
        keys.push(KEYS.KEY_ENTER);
      } else {
        let keysArr = cInput.keys.split(',')
          .map(k => k.trim() // remove whitespace characters
            .toUpperCase() // allow lowercase
            .replace(/^(KEY_)?/, 'KEY_'), // Add KEY_ if not present
          ).map(
            // Allow repetitions like KEY_DOWN*3
            k => {
              const re = /^(.*)(\*([0-9]+))$/;
              const match = re.exec(k);
              if (match) {
                const rep = parseInt(match[3], 10);
                const arr: Array<string> = [];
                for (let i = 0; i < rep; ++i) {
                  arr.push(match[1]);
                }
                return arr;
              }
              return k;
            },
          );
        keysArr = flatten(keysArr);

        keys = (keysArr as Array<string>).filter(k => {
          if (!KEYS[k]) {
            this.log.warn(`${tvName} - Ignoring invalid key "${k}" in customInput "${cInput}"`);
            return false;
          }
          return true;
        }) as Array<KEYS>;
      }
      sources.push({
        id: cInput.name,
        label: cInput.name,
        type: this.Characteristic.InputSourceType.OTHER,
        fn: async (config: DeviceConfig) => {
          await remote.sendKeys(config, keys as KEYS[]);
        },
      });
    }

    tvService.setCharacteristic(this.Characteristic.ActiveIdentifier, 0);
    // handle input source changes
    tvService
      .getCharacteristic(this.Characteristic.ActiveIdentifier)
      .on('set', async (newValue, callback) => {
        // the value will be the value you set for the Identifier Characteristic
        // on the Input Source service that was selected - see input sources below.
        const inputSource = sources[newValue];
        this.log.debug(`${tvName} - SET Active Identifier => setNewValue: ${newValue} (${inputSource.label})`);
        try {
          await inputSource.fn(this.getDevice(usn));
          tvService.updateCharacteristic(this.Characteristic.ActiveIdentifier, newValue);
        } catch (err) {
          callback(err);
          return;
        }
        callback(null);
      });

    for (let i = 0; i < sources.length; ++i) {
      const { id, label, type, disabled } = sources[i];
      if (!disabled) {
        const inputService = tvAccessory.addService(this.Service.InputSource, id, label);
        inputService
          .setCharacteristic(this.Characteristic.Identifier, i)
          .setCharacteristic(this.Characteristic.ConfiguredName, label)
          .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
          .setCharacteristic(this.Characteristic.InputSourceType, type);
        tvService.addLinkedService(inputService);
      }
    }

    /**
     * Publish as external accessory
     * Only one TV can exist per bridge, to bypass this limitation, you should
     * publish your TV as an external accessory.
     */
    this.api.publishExternalAccessories(PLUGIN_NAME, [tvAccessory]);
  }
}
