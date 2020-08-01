"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openHDMI4 = exports.openHDMI3 = exports.openHDMI2 = exports.openHDMI1 = exports.openHDMI = exports.openTV = exports.info = exports.playPause = exports.exit = exports.back = exports.select = exports.arrowRight = exports.arrowLeft = exports.arrowDown = exports.arrowUp = exports.fastForward = exports.rewind = exports.setBrightness = exports.getBrightness = exports.setMute = exports.getMute = exports.volumeDown = exports.volumeUp = exports.setVolume = exports.getVolume = exports.setActive = exports.getActive = exports.openApp = exports.sendKeys = exports.getPairing = void 0;
const node_upnp_remote_1 = __importDefault(require("node-upnp-remote"));
const node_upnp_1 = __importDefault(require("node-upnp"));
const samsung_tv_control_1 = require("samsung-tv-control");
const samsung_remote_pin_paired_1 = __importDefault(require("samsung-remote-pin-paired"));
const settings_1 = require("../settings");
const parseSerialNumber_1 = __importDefault(require("./parseSerialNumber"));
const wait_1 = __importDefault(require("./wait"));
const identity_1 = require("./identity");
const chalk_1 = __importDefault(require("chalk"));
const hasCapability_1 = __importDefault(require("./hasCapability"));
const getRemoteConfig = (config) => {
    const model = parseSerialNumber_1.default(config.modelName);
    const { year = 2013 } = model || {};
    const supportsLegacy = typeof year === `number` && year < 2014;
    const port = config.remoteControlPort || supportsLegacy ? 55000 : 8002;
    return {
        mac: config.mac,
        ip: config.lastKnownIp,
        name: settings_1.PLATFORM_NAME,
        port,
    };
};
/**
 * Checks if the token is supposed to be used with the H/J-Series library
 * and returns the
 */
const getIdentity = (config) => {
    const { token } = config;
    if (!token) {
        return null;
    }
    try {
        const identity = identity_1.decodeIdentity(token);
        if (identity.sessionId && identity.aesKey) {
            return identity;
        }
    }
    catch (err) {
        // eslint-disable
    }
    return null;
};
exports.getPairing = async (config, log) => {
    const { token, modelName } = config;
    if (token) {
        return token;
    }
    const model = parseSerialNumber_1.default(modelName);
    const { year = 2013 } = model || {};
    const supportsLegacy = typeof year === `number` && year < 2014;
    if (supportsLegacy) {
        log.debug(`${config.name} - This TV probably won't need to be paired since it is from ${year} and should support the legacy protocol.` +
            chalk_1.default `If you can't control it you still can try pairing it however with {blue npx ${settings_1.PLUGIN_NAME} pair2 ${config.lastKnownIp} ${config.mac}}`);
        return null;
    }
    const { yearKey } = model || {};
    if (yearKey === `J` || yearKey === `H`) {
        log.info(`${config.name} - This TV seems to be a ${yearKey}-Series.` +
            chalk_1.default `Please run {blue npx ${settings_1.PLUGIN_NAME} pair1 ${config.lastKnownIp} ${config.mac}} to get a pairing token.`);
    }
    else {
        log.info(chalk_1.default `${config.name} - Please run {blue npx ${settings_1.PLUGIN_NAME} pair2 ${config.lastKnownIp} ${config.mac}} or` +
            chalk_1.default `{blue npx ${settings_1.PLUGIN_NAME} pair1 ${config.lastKnownIp} ${config.mac}} to get a pairing token.`);
    }
    return null;
};
const sendKey = async (config, key) => {
    // Use H/J-Series lib when the token is an identity
    const identity = getIdentity(config);
    if (identity) {
        const tv = new samsung_remote_pin_paired_1.default({
            ip: config.lastKnownIp,
            appId: `721b6fce-4ee6-48ba-8045-955a539edadb`,
            userId: `654321`,
        });
        await tv.init(identity);
        const connection = await tv.connect();
        await tv.sendKey(key);
        await connection.close();
        return;
    }
    // Otherwise use samsung-tv-control
    const cfg = getRemoteConfig(config);
    const control = new samsung_tv_control_1.Samsung(cfg);
    await control.sendKeyPromise(key);
    control.closeConnection();
};
exports.sendKeys = async (config, keys) => {
    // Use H/J-Series lib when the token is an identity
    const identity = getIdentity(config);
    if (identity) {
        const tv = new samsung_remote_pin_paired_1.default({
            ip: config.lastKnownIp,
            appId: `721b6fce-4ee6-48ba-8045-955a539edadb`,
            userId: `654321`,
        });
        await tv.init(identity);
        const connection = await tv.connect();
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            await tv.sendKey(key);
            await wait_1.default(config.delay);
        }
        await connection.close();
        return;
    }
    // Otherwise use samsung-tv-control
    const cfg = getRemoteConfig(config);
    const control = new samsung_tv_control_1.Samsung(cfg);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        await control.sendKeyPromise(key);
        await wait_1.default(config.delay);
    }
    control.closeConnection();
};
exports.openApp = async (config, app) => {
    const identity = getIdentity(config);
    if (identity) {
        // Not supported yet
        return;
    }
    const cfg = getRemoteConfig(config);
    const control = new samsung_tv_control_1.Samsung(cfg);
    await control.openAppPromise(app);
    control.closeConnection();
};
const turnOn = async (config) => {
    const cfg = getRemoteConfig(config);
    const control = new samsung_tv_control_1.Samsung(cfg);
    await control.turnOn();
    control.closeConnection();
};
// export const getDeviceInfo = async (config: DeviceConfig) => {
//   const { lastKnownLocation: url } = config
//   const upnp = new UPNP({ url })
//   const info = await upnp.getDeviceDescription()
//   return info
// }
exports.getActive = async (config) => {
    const cfg = getRemoteConfig(config);
    const control = new samsung_tv_control_1.Samsung(cfg);
    let available = false;
    try {
        available = await control.isAvailablePing();
        control.closeConnection();
    }
    catch (err) {
        // eslint-disable-line
    }
    return available;
};
exports.setActive = async (config, active) => {
    const isActive = await exports.getActive(config);
    if (active === isActive) {
        return;
    }
    if (active) {
        await turnOn(config);
    }
    else {
        const identity = getIdentity(config);
        const key = identity ? samsung_tv_control_1.KEYS.KEY_POWER : samsung_tv_control_1.KEYS.KEY_POWEROFF;
        sendKey(config, key);
    }
};
exports.getVolume = async (config) => {
    const { lastKnownLocation: url } = config;
    const remote = new node_upnp_remote_1.default({ url });
    const volume = await remote.getVolume();
    return volume;
};
exports.setVolume = async (config, volume) => {
    const { lastKnownLocation: url, disableUpnpSetters } = config;
    if (!disableUpnpSetters && hasCapability_1.default(config, `SetVolume`)) {
        const remote = new node_upnp_remote_1.default({ url });
        await remote.setVolume(volume);
        return;
    }
    const currentVolume = await exports.getVolume(config);
    const volumeOffset = volume - currentVolume;
    if (volumeOffset === 0) {
        return;
    }
    const keys = [];
    let key = samsung_tv_control_1.KEYS.KEY_VOLUP;
    if (volumeOffset < 0) {
        key = samsung_tv_control_1.KEYS.KEY_VOLDOWN;
    }
    for (let i = 0; i < Math.abs(volumeOffset); ++i) {
        keys.push(key);
    }
    await exports.sendKeys(config, keys);
};
exports.volumeUp = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_VOLUP);
};
exports.volumeDown = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_VOLDOWN);
};
exports.getMute = async (config) => {
    const { lastKnownLocation: url } = config;
    const remote = new node_upnp_remote_1.default({ url });
    return remote.getMute();
};
exports.setMute = async (config, mute) => {
    const { lastKnownLocation: url, disableUpnpSetters } = config;
    if (!disableUpnpSetters && hasCapability_1.default(config, `SetMute`)) {
        const remote = new node_upnp_remote_1.default({ url });
        await remote.setMute(mute);
        return;
    }
    if (hasCapability_1.default(config, `GetMute`)) {
        // Only toggle mute state when the desired state differs
        // from the current state
        const isMuted = await exports.getMute(config);
        if ((isMuted && mute) || (!isMuted && !mute)) {
            return;
        }
    }
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_MUTE);
};
exports.getBrightness = async (config) => {
    const { lastKnownLocation: url } = config;
    const upnp = new node_upnp_1.default({ url });
    const { CurrentBrightness: brightness } = await upnp.call(`RenderingControl`, `GetBrightness`, { InstanceID: 0 });
    return brightness;
};
exports.setBrightness = async (config, brightness) => {
    const { lastKnownLocation: url, disableUpnpSetters } = config;
    if (!disableUpnpSetters) {
        const upnp = new node_upnp_1.default({ url });
        await upnp.call(`urn:upnp-org:serviceId:RenderingControl`, `SetBrightness`, { InstanceID: 0, DesiredBrightness: brightness });
    }
    // Brightness cannot be set otherwise...
};
exports.rewind = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_REWIND);
};
exports.fastForward = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_FF);
};
exports.arrowUp = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_UP);
};
exports.arrowDown = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_DOWN);
};
exports.arrowLeft = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_LEFT);
};
exports.arrowRight = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_RIGHT);
};
exports.select = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_ENTER);
};
exports.back = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_RETURN);
};
exports.exit = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_HOME);
};
exports.playPause = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_PLAY); // PAUSE?
};
exports.info = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_INFO);
};
exports.openTV = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_TV);
};
exports.openHDMI = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_HDMI);
};
exports.openHDMI1 = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_HDMI1);
};
exports.openHDMI2 = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_HDMI2);
};
exports.openHDMI3 = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_HDMI3);
};
exports.openHDMI4 = async (config) => {
    await sendKey(config, samsung_tv_control_1.KEYS.KEY_HDMI4);
};
//# sourceMappingURL=remote.js.map