import { API, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic, DynamicPlatformPlugin } from 'homebridge';
export declare class SamsungTVHomebridgePlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly tvAccessories: Array<PlatformAccessory>;
    private devices;
    constructor(log: Logger, config: PlatformConfig, api: API);
    configureAccessory(): void;
    private discoverDevices;
    /**
     * Invokes pairing for all discovered devices.
     */
    private checkDevicePairing;
    /**
     * Adds the user modifications to each of devices
     */
    private applyConfig;
    private getDevice;
    private registerTV;
}
//# sourceMappingURL=platform.d.ts.map