"use strict";
const settings_1 = require("./settings");
const platform_1 = require("./platform");
module.exports = (api) => {
    api.registerPlatform(settings_1.PLATFORM_NAME, platform_1.SamsungTVHomebridgePlatform);
};
//# sourceMappingURL=index.js.map