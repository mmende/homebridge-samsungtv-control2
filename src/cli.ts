/* eslint-disable no-console */
import { Command } from 'commander'
import chalk from 'chalk'
import HJSamsungTv from 'samsung-remote'
import SamsungTv, { KEYS } from 'samsung-tv-control'
import readline from 'readline'
import parseSerialNumber from './utils/parseSerialNumber'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings'
import { encodeIdentity } from './utils/identity'
import detectDevices from './utils/detectDevices'

const modelInfo = (model) => {
  console.log(parseSerialNumber(model))
}

const discover = async () => {
  console.log(chalk.yellow(`Searching for devices...`))
  const devices = await detectDevices()
  if (!devices.length) {
    console.log(
      chalk.red(
        `😞 No Samsung TV found. Remember to turn on your Samsung TV's and check if they are connected to the same network before starting the discovery.`,
      ),
    )
  } else {
    console.log(`Found these devices:`)
    for (let i = 0; i < devices.length; ++i) {
      const device = devices[i]
      console.log(
        chalk`{blue ${device.friendlyName}} (${device.modelName}): usn "{green ${device.usn}}"`,
      )
    }
  }
}

const pinPair = async (ip: string, mac: string) => {
  const deviceConfig = {
    ip,
    appId: `721b6fce-4ee6-48ba-8045-955a539edadb`,
    userId: `654321`,
  }
  const tv = new HJSamsungTv(deviceConfig)
  try {
    await tv.init()
    await tv.requestPin()
  } catch (err) {
    console.log(
      `That didn't work unfortunatelly. Please try the second method:` +
        chalk`{green npx ${PLUGIN_NAME} pair1 ${ip} ${mac}}`,
    )
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question(`Please enter the pin you see on your tv\n`, async (pin) => {
    console.log(
      chalk`Ok... sending {yellow "${pin}"} to your tv to see if it works...`,
    )
    let identity
    try {
      identity = await tv.confirmPin(pin)
      await tv.connect()
    } catch (err) {
      console.log(
        chalk.red(
          `That didn't work unfortunatelly. Here are some other possible solutions:`,
        ),
      )
      console.log(
        chalk`\t1. Try again... {green npx ${PLUGIN_NAME} pair1 ${ip} ${mac}}`,
      )
      console.log(
        chalk`\t2. Try the other pairing method {green npx ${PLUGIN_NAME} pair2 ${ip} ${mac}}`,
      )
      rl.close()
      process.exit(1)
    }
    console.log(
      `Looks good so far. I'll send the MUTE key to your tv to see if it works...`,
    )
    await tv.sendKey(`KEY_MUTE`)
    rl.close()
    console.log(
      chalk`If it worked, add this to your config as token: {green ${encodeIdentity(
        identity,
      )}}`,
    )
    process.exit(0)
  })
}

const logTokenAlternatives = ({
  ip,
  mac,
  port,
  startMessage = chalk.red(
    `That didn't work unfortunatelly. Here are some other possible solutions:`,
  ),
}: {
  ip: string
  mac: string
  port: string
  startMessage?: string
}) => {
  console.log(startMessage)
  const ports = [`8001`, `8002`, `55000`]
  const altPorts = ports.filter((p) => p !== port)
  let solution = 1
  for (let i = 0; i < altPorts.length; ++i) {
    const altPort = altPorts[i]
    console.log(
      chalk`\t${solution}. Try another port {green npx ${PLUGIN_NAME} pair2 ${ip} ${mac} --port ${altPort}}`,
    )
    solution++
  }
  console.log(
    chalk`\t${solution}. Try the other pairing method {green npx ${PLUGIN_NAME} pair1 ${ip} ${mac}}`,
  )
}

const tokenPair = async (
  ip: string,
  mac: string,
  { port, legacy }: { port: string; legacy: boolean },
) => {
  const config = {
    ip,
    mac,
    name: PLATFORM_NAME,
    port: parseInt(port, 10),
  }
  const tv = new SamsungTv(config)
  if (port === `55000` || legacy) {
    if (port === `55000` && !legacy) {
      console.log(`55000 is the legacy port that doesn't require pairing.\n`)
    }
    console.log(
      `Sending the mute key to see if your device is controlable with the legacy protocol.`,
    )
    try {
      await tv.sendKeyPromise(KEYS.KEY_MUTE)
    } catch (err) {
      logTokenAlternatives({ ip, mac, port })
      process.exit(1)
    }
    console.log(
      `Did the tv switch it's mute state? If yes then your tv supports the legacy protocol. ` +
        chalk`Usually the plugin detects the appropriate port but you can also force the legacy port being used by setting {yellow remoteControlPort} to {yellow 55000}\n`,
    )
    logTokenAlternatives({
      ip,
      mac,
      port,
      startMessage: chalk.yellow(
        `If it didn't work, here are some other possible solutions:`,
      ),
    })
    process.exit(0)
  }
  console.log(
    `Ok... sending the pairing request to your tv. Please click allow when asked`,
  )
  let token: string | null = null
  try {
    token = await tv.getTokenPromise()
  } catch (err) {
    logTokenAlternatives({ ip, mac, port })
    process.exit(1)
  }
  if (!token) {
    logTokenAlternatives({
      ip,
      mac,
      port,
      startMessage: chalk.red(
        `Didn't receive a token unfortunatelly. Here are some other possible solutions:`,
      ),
    })
    process.exit(1)
  }
  console.log(
    `Looks good so far. Sending the MUTE key to your tv to see if it works...`,
  )
  try {
    await tv.sendKeyPromise(KEYS.KEY_MUTE)
  } catch (err) {
    logTokenAlternatives({ ip, mac, port })
    process.exit(1)
  }
  console.log(
    chalk`Did the tv switch it's mute state? If yes then add this to your config as token: {green ${token}}\n`,
  )
  logTokenAlternatives({
    ip,
    mac,
    port,
    startMessage: chalk.yellow(
      `If it didn't work, here are some other possible solutions:`,
    ),
  })
  process.exit(0)
}

const program = new Command()

program
  .command(`model <model>`)
  .description(`Shows infos about a specific model (e.g. UE40D6100)`)
  .action(modelInfo)

program
  .command(`discover`)
  .description(
    `Starts a manual device discovery. Note: Found devices will not be added to homebridge. This is just for testing purposes.`,
  )
  .action(discover)

program
  .command(`pair1 <ip> <mac>`)
  .description(
    `Starts the first pairing method. E.g. for TV's that require pin pairing.`,
  )
  .action(pinPair)

program
  .command(`pair2 <ip> <mac>`)
  .option(
    `-p, --port <port>`,
    `Remote control port for method 1. You might try 8001 as well here.`,
    `8002`,
  )
  .option(
    `-l, --legacy`,
    `If set, the script won't try to pair and just sends the mute key.`,
  )
  .action(tokenPair)

program.parse(process.argv)
