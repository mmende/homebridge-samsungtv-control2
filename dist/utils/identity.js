"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeIdentity = exports.encodeIdentity = void 0;
/**
 * Encodes a identity object to a base64 so that users
 * don't think they have to add them as nested json
 */
exports.encodeIdentity = (identity) => Buffer.from(JSON.stringify(identity)).toString(`base64`);
/**
 * Decodes a identity embeded as base64 token
 * @see encodeIdentity
 */
exports.decodeIdentity = (token) => JSON.parse(Buffer.from(token, `base64`).toString());
//# sourceMappingURL=identity.js.map