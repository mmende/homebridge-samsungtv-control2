/**
 * Encodes a identity object to a base64 so that users
 * don't think they have to add them as nested json
 */
export declare const encodeIdentity: (identity: {
    [key: string]: string;
}) => string;
/**
 * Decodes a identity embeded as base64 token
 * @see encodeIdentity
 */
export declare const decodeIdentity: (token: string) => any;
//# sourceMappingURL=identity.d.ts.map