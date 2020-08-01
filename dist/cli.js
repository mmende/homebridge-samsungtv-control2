"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const samsung_remote_pin_paired_1 = __importDefault(require("samsung-remote-pin-paired"));
const samsung_tv_control_1 = __importStar(require("samsung-tv-control"));
const readline_1 = __importDefault(require("readline"));
const parseSerialNumber_1 = __importDefault(require("./utils/parseSerialNumber"));
const settings_1 = require("./settings");
const identity_1 = require("./utils/identity");
const detectDevices_1 = __importDefault(require("./utils/detectDevices"));
const modelInfo = (model) => {
    console.log(parseSerialNumber_1.default(model));
};
const discover = async () => {
    console.log(chalk_1.default.yellow(`Searching for devices...`));
    const devices = await detectDevices_1.default();
    if (!devices.length) {
        console.log(chalk_1.default.red(`😞 No Samsung TV found. Remember to turn on your Samsung TV's and check if they are connected to the same network before starting the discovery.`));
    }
    else {
        console.log(`Found these devices:`);
        for (let i = 0; i < devices.length; ++i) {
            const device = devices[i];
            console.log(chalk_1.default `{blue ${device.friendlyName}} (${device.modelName}): usn "{green ${device.usn}}"`);
        }
    }
};
const logPinAlternatives = ({ ip, mac, startMessage = chalk_1.default.red(`That didn't work unfortunatelly. Here are some other possible solutions:`), }) => {
    console.log(startMessage);
    console.log(chalk_1.default `\t1. Try pairing method 2 {green npx ${settings_1.PLUGIN_NAME} pair2 ${ip} ${mac}}`);
    console.log(chalk_1.default `\t2. Try the legacy protocol {green npx ${settings_1.PLUGIN_NAME} legacy ${ip} ${mac}}`);
};
const pinPair = async (ip, mac) => {
    const deviceConfig = {
        ip,
        appId: `721b6fce-4ee6-48ba-8045-955a539edadb`,
        userId: `654321`,
    };
    const tv = new samsung_remote_pin_paired_1.default(deviceConfig);
    try {
        await tv.init();
        await tv.requestPin();
    }
    catch (err) {
        logPinAlternatives({ ip, mac });
        process.exit(1);
    }
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question(`Please enter the pin you see on your tv\n`, async (pin) => {
        console.log(chalk_1.default `Ok... sending {yellow "${pin}"} to your tv to see if it works...`);
        let identity;
        try {
            identity = await tv.confirmPin(pin);
            await tv.connect();
        }
        catch (err) {
            logPinAlternatives({ ip, mac });
            rl.close();
            process.exit(1);
        }
        console.log(`Looks good so far. I'll send the MUTE key to your tv to see if it works...`);
        await tv.sendKey(`KEY_MUTE`);
        rl.close();
        console.log(chalk_1.default `If it worked, add this to your config as token: {green ${identity_1.encodeIdentity(identity)}}`);
        logPinAlternatives({
            ip,
            mac,
            startMessage: chalk_1.default.yellow(`If it didn't work, here are some other possible solutions:`),
        });
        process.exit(0);
    });
};
const logTokenAlternatives = ({ ip, mac, port, startMessage = chalk_1.default.red(`That didn't work unfortunatelly. Here are some other possible solutions:`), }) => {
    console.log(startMessage);
    const ports = [`8001`, `8002`, `55000`];
    const altPorts = ports.filter((p) => p !== port);
    let solution = 1;
    for (let i = 0; i < altPorts.length; ++i) {
        const altPort = altPorts[i];
        console.log(chalk_1.default `\t${solution}. Try another port {green npx ${settings_1.PLUGIN_NAME} pair2 ${ip} ${mac} --port ${altPort}}`);
        solution++;
    }
    console.log(chalk_1.default `\t${solution}. Try the other pairing method {green npx ${settings_1.PLUGIN_NAME} pair1 ${ip} ${mac}}`);
    solution++;
    console.log(chalk_1.default `\t${solution}. Try the legacy protocol {green npx ${settings_1.PLUGIN_NAME} legacy ${ip} ${mac}}`);
};
const tokenPair = async (ip, mac, { port }) => {
    const config = {
        ip,
        mac,
        name: settings_1.PLATFORM_NAME,
        port: parseInt(port, 10),
    };
    const tv = new samsung_tv_control_1.default(config);
    if (port === `55000`) {
        console.log(chalk_1.default.yellow `Port 55000 is usually the port for the legacy protocol without pairing and most likely won't work with pair2. Trying anyway.`);
    }
    console.log(`Ok... sending the pairing request to your tv. Please click allow when asked`);
    let token = null;
    try {
        token = await tv.getTokenPromise();
    }
    catch (err) {
        logTokenAlternatives({ ip, mac, port });
        process.exit(1);
    }
    if (!token) {
        logTokenAlternatives({
            ip,
            mac,
            port,
            startMessage: chalk_1.default.red(`Didn't receive a token unfortunatelly. Here are some other possible solutions:`),
        });
        process.exit(1);
    }
    console.log(`Looks good so far. Sending the MUTE key to your tv to see if it works...`);
    try {
        await tv.sendKeyPromise(samsung_tv_control_1.KEYS.KEY_MUTE);
    }
    catch (err) {
        logTokenAlternatives({ ip, mac, port });
        process.exit(1);
    }
    console.log(chalk_1.default `Did the tv switch it's mute state? If yes then add this to your config as token: {green ${token}}\n`);
    logTokenAlternatives({
        ip,
        mac,
        port,
        startMessage: chalk_1.default.yellow(`If it didn't work, here are some other possible solutions:`),
    });
    process.exit(0);
};
const logLegacyAlternatives = ({ ip, mac, startMessage = chalk_1.default.red(`That didn't work unfortunatelly. Here are some other possible solutions:`), }) => {
    console.log(startMessage);
    console.log(chalk_1.default `\t1. Try pairing method 1 {green npx ${settings_1.PLUGIN_NAME} pair1 ${ip} ${mac}}`);
    console.log(chalk_1.default `\t2. Try pairing method 2 {green npx ${settings_1.PLUGIN_NAME} pair2 ${ip} ${mac}}`);
};
const legacy = async (ip, mac, { port }) => {
    const config = {
        ip,
        mac,
        name: settings_1.PLATFORM_NAME,
        port: parseInt(port, 10),
    };
    const tv = new samsung_tv_control_1.default(config);
    if (port === `8001` || port === `8002`) {
        console.log(chalk_1.default.yellow `Port ${port} will most likely not work with the legacy protocol. You should try pair1 or pair2 instead. Trying anyway.`);
    }
    console.log(`Sending the mute key to see if your device is controlable with the legacy protocol over port ${port}.`);
    try {
        await tv.sendKeyPromise(samsung_tv_control_1.KEYS.KEY_MUTE);
    }
    catch (err) {
        logLegacyAlternatives({ ip, mac });
        process.exit(1);
    }
    console.log(`Did the tv switch it's mute state? If yes then your tv supports the legacy protocol. ` +
        chalk_1.default `Usually the plugin detects the appropriate port but you can also force this port by setting {yellow remoteControlPort} to {yellow ${port}}\n`);
    logLegacyAlternatives({
        ip,
        mac,
        startMessage: chalk_1.default.yellow(`If it didn't work, here are some other possible solutions:`),
    });
    process.exit(0);
};
const program = new commander_1.Command();
program
    .command(`model <model>`)
    .description(`Shows infos about a specific model (e.g. UE40D6100)`)
    .action(modelInfo);
program
    .command(`discover`)
    .description(`Starts a manual device discovery. Note: Found devices will not be added to homebridge. This is just for testing purposes.`)
    .action(discover);
program
    .command(`pair1 <ip> <mac>`)
    .description(`Starts the first pairing method. E.g. for TV's that require pin pairing.`)
    .action(pinPair);
program
    .command(`pair2 <ip> <mac>`)
    .option(`-p, --port <port>`, `Remote control port for method 1. You might try 8001 as well here.`, `8002`)
    .action(tokenPair);
program
    .command(`legacy <ip> <mac>`)
    .description(`Tests if the legacy protocol can be used`)
    .option(`-p, --port <port>`, `Remote control port.`, `55000`)
    .action(legacy);
program.parse(process.argv);
//# sourceMappingURL=cli.js.map