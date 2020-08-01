"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Extracts the unique id at the start of usn's
 */
exports.default = (usn) => {
    const filteredUSN = usn.replace(/^(uuid:[a-z0-9-]+).*$/gi, `$1`);
    if (filteredUSN) {
        return filteredUSN;
    }
    return usn;
};
//# sourceMappingURL=filterUSN.js.map