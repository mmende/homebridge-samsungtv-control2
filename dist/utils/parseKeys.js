"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_flatten_1 = __importDefault(require("lodash.flatten"));
const samsung_tv_control_1 = require("samsung-tv-control");
exports.default = (input, device, log) => {
    // Channels (only numeric)
    if (/^[0-9]+$/.test(input.keys)) {
        const keys = [];
        for (let i = 0; i < input.keys.length; ++i) {
            const num = input.keys[i];
            keys.push(samsung_tv_control_1.KEYS[`KEY_${num}`]);
        }
        keys.push(samsung_tv_control_1.KEYS.KEY_ENTER);
        return keys;
    }
    let keysArr = input.keys
        .split(`,`)
        .map((k) => k
        .trim() // remove whitespace characters
        .toUpperCase() // allow lowercase
        .replace(/^(KEY_)?/, `KEY_`))
        .map(
    // Allow repetitions like KEY_DOWN*3
    (k) => {
        const re = /^(.*)(\*([0-9]+))$/;
        const match = re.exec(k);
        if (match) {
            const rep = parseInt(match[3], 10);
            const arr = [];
            for (let i = 0; i < rep; ++i) {
                arr.push(match[1]);
            }
            return arr;
        }
        return k;
    });
    keysArr = lodash_flatten_1.default(keysArr);
    return keysArr.filter((k) => {
        if (!samsung_tv_control_1.KEYS[k]) {
            log.warn(`${device.name} - Ignoring invalid key "${k}" in customInput "${input.name}"`);
            return false;
        }
        return true;
    });
};
//# sourceMappingURL=parseKeys.js.map