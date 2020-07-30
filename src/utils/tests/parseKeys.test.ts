import parseKeys from '../parseKeys'
import { Logger } from 'homebridge'
import { DeviceConfig } from '../../types/deviceConfig'

describe(`parseKeys`, () => {
  it(`parses key sequences`, () => {
    // eslint-disable-next-line
    const log = ({ warn: jest.fn() } as any) as Logger
    // eslint-disable-next-line
    const device = { name: 'Test Device' } as DeviceConfig

    expect(
      parseKeys(
        { name: `Key 1`, keys: `tools,down*3,enter,up*2,enter` },
        device,
        log,
      ),
    ).toEqual([
      `KEY_TOOLS`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      `KEY_ENTER`,
      `KEY_UP`,
      `KEY_UP`,
      `KEY_ENTER`,
    ])
    expect(log.warn).not.toHaveBeenCalled()

    expect(parseKeys({ name: `Key 2`, keys: `hdmi1` }, device, log)).toEqual([
      `KEY_HDMI1`,
    ])
    expect(log.warn).not.toHaveBeenCalled()

    expect(
      parseKeys(
        { name: `Key 3`, keys: `KEY_TOOLS,down*3, ENTER,up*2 ,enter ` },
        device,
        log,
      ),
    ).toEqual([
      `KEY_TOOLS`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      `KEY_ENTER`,
      `KEY_UP`,
      `KEY_UP`,
      `KEY_ENTER`,
    ])
    expect(log.warn).not.toHaveBeenCalled()
  })

  it(`parses channels correctly`, () => {
    // eslint-disable-next-line
    const log = ({ warn: jest.fn() } as any) as Logger
    // eslint-disable-next-line
    const device = { name: 'Test Device' } as DeviceConfig

    expect(parseKeys({ name: `Key 4`, keys: `42` }, device, log)).toEqual([
      `KEY_4`,
      `KEY_2`,
      `KEY_ENTER`,
    ])
    expect(log.warn).not.toHaveBeenCalled()

    expect(parseKeys({ name: `Key 5`, keys: `042` }, device, log)).toEqual([
      `KEY_0`,
      `KEY_4`,
      `KEY_2`,
      `KEY_ENTER`,
    ])
    expect(log.warn).not.toHaveBeenCalled()
  })

  it(`skips and warns when seing invalid keys`, () => {
    // eslint-disable-next-line
    const log = ({ warn: jest.fn() } as any) as Logger
    // eslint-disable-next-line
    const device = { name: 'Test Device' } as DeviceConfig

    expect(
      parseKeys(
        { name: `Key 6`, keys: `tools,down*3,something,up*2,enter` },
        device,
        log,
      ),
    ).toEqual([
      `KEY_TOOLS`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      // 'KEY_SOMETHING', // should not exist
      `KEY_UP`,
      `KEY_UP`,
      `KEY_ENTER`,
    ])
    expect(log.warn).toHaveBeenCalledTimes(1)
  })

  it(`skips and warns when seing invalid keys multiple times`, () => {
    // eslint-disable-next-line
    const log = ({ warn: jest.fn() } as any) as Logger
    // eslint-disable-next-line
    const device = { name: 'Test Device' } as DeviceConfig

    expect(
      parseKeys(
        { name: `Key 7`, keys: `tools,down*3,something*3,up*2,enter` },
        device,
        log,
      ),
    ).toEqual([
      `KEY_TOOLS`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      `KEY_DOWN`,
      // 'KEY_SOMETHING', // should not exist
      `KEY_UP`,
      `KEY_UP`,
      `KEY_ENTER`,
    ])
    expect(log.warn).toHaveBeenCalledTimes(3)
  })
})
