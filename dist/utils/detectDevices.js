"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ssdp_ts_1 = require("ssdp-ts");
const node_upnp_1 = __importDefault(require("node-upnp"));
const parseSerialNumber_1 = __importDefault(require("./parseSerialNumber"));
const getMacAddress_1 = __importDefault(require("./getMacAddress"));
const filterUSN_1 = __importDefault(require("./filterUSN"));
const chalk_1 = __importDefault(require("chalk"));
const checkDeviceDetails = async (headers, rinfo, log, config) => {
    // eslint-disable-next-line
    const logFn = log ? log.debug : console.log;
    const deviceCustomizations = config && Array.isArray(config.devices) ? config.devices : [];
    const usn = filterUSN_1.default(headers.USN);
    let upnp;
    let deviceDescription;
    try {
        upnp = new node_upnp_1.default({ url: headers.LOCATION });
        deviceDescription = (await upnp.getDeviceDescription());
    }
    catch (err) {
        logFn(chalk_1.default `{red Got error while trying to check device with usn: "{yellow ${usn}}}".`, err);
        return null;
    }
    const { manufacturer, friendlyName, services = {} } = deviceDescription;
    let { modelName } = deviceDescription;
    if (typeof manufacturer !== `string` ||
        manufacturer.indexOf(`Samsung Electronics`) < 0) {
        return null;
    }
    if (typeof modelName !== `string` || !modelName.length) {
        // Check if the modelName was configured manually
        const configuredDevice = deviceCustomizations.find((d) => d.usn === usn);
        if (configuredDevice && configuredDevice.modelName) {
            modelName = configuredDevice.modelName;
        }
        else {
            logFn(chalk_1.default `Found a Samsung device ({blue ${friendlyName}}) that doesn't expose a correct model name. ` +
                chalk_1.default `If this is a Samsung TV add this device to your config with usn: "{green ${usn}}" and the correct model name (e.g. UN40C5000)`);
            return null;
        }
    }
    const model = parseSerialNumber_1.default(modelName);
    if (!model) {
        logFn(chalk_1.default `Found unparsable model name ({red ${modelName}}) for device {blue ${friendlyName}}, usn: "{green ${usn}}". Skipping it.`);
        return null;
    }
    let mac = `00:00:00:00:00:00`;
    try {
        mac = await getMacAddress_1.default(rinfo.address);
    }
    catch (err) {
        const configuredDevice = deviceCustomizations.find((d) => d.usn === usn);
        if (configuredDevice && configuredDevice.mac) {
            mac = configuredDevice.mac;
        }
        else {
            logFn(chalk_1.default `Could not determine mac address for {blue ${friendlyName}} (${modelName}), usn: "{green ${usn}}". Skipping it. ` +
                chalk_1.default `Please add the mac address manually to your config if you want to use this TV.`);
            return null;
        }
    }
    let capabilities = [];
    const rcServiceName = Object.keys(services).find((s) => s.indexOf(`RenderingControl`) !== -1);
    if (rcServiceName) {
        try {
            const serviceDescription = await upnp.getServiceDescription(rcServiceName);
            capabilities = Object.keys(serviceDescription.actions);
        }
        catch (err) {
            logFn(chalk_1.default.yellow `Could not check capabilities for {blue ${friendlyName}} (${modelName}), usn: "{green ${usn}}".`, err);
        }
    }
    const tv = {
        friendlyName,
        modelName,
        model,
        usn,
        mac,
        capabilities,
        location: headers.LOCATION,
        address: rinfo.address,
    };
    return tv;
};
exports.default = async (log, config) => {
    const checkedDevices = [];
    const client = new ssdp_ts_1.Client({
        ssdpSig: `USER-AGENT: Homebridge/42.0.0 UPnP/1.1 hbTV/8.21.0`,
        ssdpIp: `239.255.255.250`,
    });
    const deviceChecks = [];
    client.on(`response`, (headers, statusCode, rinfo) => {
        if (statusCode !== 200) {
            return;
        }
        if (checkedDevices.indexOf(filterUSN_1.default(headers.USN)) > -1) {
            return;
        }
        checkedDevices.push(filterUSN_1.default(headers.USN));
        deviceChecks.push(checkDeviceDetails(headers, rinfo, log, config));
    });
    client.search(`urn:schemas-upnp-org:device:MediaRenderer:1`);
    client.search(`urn:schemas-upnp-org:service:RenderingControl:1`);
    // Scan for scanDuration ms
    await new Promise((res) => {
        setTimeout(() => {
            res();
        }, 5000);
    });
    const devices = await Promise.all(deviceChecks);
    return devices.filter((d) => !!d);
};
//# sourceMappingURL=detectDevices.js.map