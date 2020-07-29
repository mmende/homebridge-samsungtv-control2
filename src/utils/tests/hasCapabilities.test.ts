import hasCapability from '../hasCapability'
import { DeviceConfig } from '../../types/deviceConfig'

// eslint-disable-next-line
const d = (obj: any) => obj as DeviceConfig

test(`hasCapabilities`, () => {
  expect(hasCapability(d({ capabilities: [] }), `GetMute`)).toEqual(false)
  expect(hasCapability(d({ capabilities: [`SetMute`] }), `GetMute`)).toEqual(
    false,
  )
  expect(
    hasCapability(d({ capabilities: [`SetVolume`, `GetVolume`] }), `GetMute`),
  ).toEqual(false)

  expect(hasCapability(d({ capabilities: [`GetMute`] }), `GetMute`)).toEqual(
    true,
  )
  expect(
    hasCapability(d({ capabilities: [`GetMute`, `SetMute`] }), `GetMute`),
  ).toEqual(true)
  expect(
    hasCapability(d({ capabilities: [`GetMute`, `SetMute`] }), `SetMute`),
  ).toEqual(true)
  expect(
    hasCapability(d({ capabilities: [`GetMute`, `GetMute`] }), `GetMute`),
  ).toEqual(true)
})
