/**
 * Encodes a identity object to a base64 so that users
 * don't think they have to add them as nested json
 */
export const encodeIdentity = (identity: { [key: string]: string }) =>
  Buffer.from(JSON.stringify(identity)).toString(`base64`)

/**
 * Decodes a identity embeded as base64 token
 * @see encodeIdentity
 */
export const decodeIdentity = (token: string) =>
  JSON.parse(Buffer.from(token, `base64`).toString())
