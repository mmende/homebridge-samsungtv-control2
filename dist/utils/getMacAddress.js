"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const macfromip_1 = __importDefault(require("macfromip"));
exports.default = (ip) => new Promise((resolve, reject) => {
    macfromip_1.default.getMac(ip, (err, data) => {
        if (err) {
            reject(err);
            return;
        }
        // fix the mac address so that every number consists of 2 bytes
        const mac = data.trim().split(':').map(n => n.length < 2 ? `0${n}` : `${n}`).join(':');
        resolve(mac);
    });
});
//# sourceMappingURL=getMacAddress.js.map