/* eslint-disable no-console */
import { Command } from 'commander'
import chalk from 'chalk'
import HJSamsungTv from 'samsung-remote'
import SamsungTv, { KEYS } from 'samsung-tv-control'
import readline from 'readline'
import parseSerialNumber from './utils/parseSerialNumber'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings'
import { encodeIdentity } from './utils/identity'

const modelInfo = (model) => {
  console.log(parseSerialNumber(model)) // eslint-disable-line
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

const tokenPair = async (
  ip: string,
  mac: string,
  { port }: { port: string },
) => {
  const config = {
    ip,
    mac,
    name: PLATFORM_NAME,
    port: parseInt(port, 10),
  }
  const altPort = port === `8002` ? `8001` : `8002`
  const tv = new SamsungTv(config)
  console.log(
    `Ok... sending the pairing request to your tv. Please click allow when asked`,
  )
  let token: string | null = null
  try {
    token = await tv.getTokenPromise()
  } catch (err) {
    console.log(
      chalk.red(
        `That didn't work unfortunatelly. Here are some other possible solutions:`,
      ),
    )
    console.log(
      chalk`\t1. Try another port {green npx ${PLUGIN_NAME} pair2 ${ip} ${mac} --port ${altPort}}`,
    )
    console.log(
      chalk`\t2. Try the other pairing method {green npx ${PLUGIN_NAME} pair1 ${ip} ${mac}}`,
    )
    process.exit(1)
  }
  if (!token) {
    console.log(
      chalk.red(
        `Didn't receive a token unfortunatelly. Here are some other possible solutions:`,
      ),
    )
    console.log(
      chalk`\t1. Try another port {green npx ${PLUGIN_NAME} pair2 ${ip} ${mac} --port ${altPort}}`,
    )
    console.log(
      chalk`\t2. Try the other pairing method {green npx ${PLUGIN_NAME} pair1 ${ip} ${mac}}`,
    )
    process.exit(1)
  }
  console.log(
    `Looks good so far. I'll send the MUTE key to your tv to see if it works...`,
  )
  await tv.sendKeyPromise(KEYS.KEY_MUTE)
  console.log(
    chalk`If it worked, add this to your config as token: {green ${token}}`,
  )
  process.exit(0)
}

const program = new Command()

program
  .command(`model <model>`)
  .description(`Shows infos about a specific model (e.g. UE40D6100)`)
  .action(modelInfo)

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
  .action(tokenPair)

program.parse(process.argv)
