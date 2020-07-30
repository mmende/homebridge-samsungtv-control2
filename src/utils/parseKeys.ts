import flatten from 'lodash.flatten'
import { KEYS } from 'samsung-tv-control'
import { Logger } from 'homebridge'
import { Input, DeviceConfig } from '../types/deviceConfig'

export default (input: Input, device: DeviceConfig, log: Logger) => {
  // Channels (only numeric)
  if (/^[0-9]+$/.test(input.keys)) {
    const keys: Array<KEYS> = []
    for (let i = 0; i < input.keys.length; ++i) {
      const num = input.keys[i]
      keys.push(KEYS[`KEY_${num}`])
    }
    keys.push(KEYS.KEY_ENTER)
    return keys
  }

  let keysArr = input.keys
    .split(`,`)
    .map(
      (k) =>
        k
          .trim() // remove whitespace characters
          .toUpperCase() // allow lowercase
          .replace(/^(KEY_)?/, `KEY_`), // Add KEY_ if not present
    )
    .map(
      // Allow repetitions like KEY_DOWN*3
      (k) => {
        const re = /^(.*)(\*([0-9]+))$/
        const match = re.exec(k)
        if (match) {
          const rep = parseInt(match[3], 10)
          const arr: Array<string> = []
          for (let i = 0; i < rep; ++i) {
            arr.push(match[1])
          }
          return arr
        }
        return k
      },
    )
  keysArr = flatten(keysArr)
  return (keysArr as Array<string>).filter((k) => {
    if (!KEYS[k]) {
      log.warn(
        `${device.name} - Ignoring invalid key "${k}" in customInput "${input.name}"`,
      )
      return false
    }
    return true
  }) as Array<KEYS>
}
