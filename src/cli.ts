import { Command } from 'commander';
import chalk from 'chalk';
import SamsungTv from 'samsung-remote';
import readline from 'readline';
import parseSerialNumber from './utils/parseSerialNumber';

const modelInfo = (model) => {
  console.log(parseSerialNumber(model)); // eslint-disable-line
};

const pair = async (ip) => {
  const deviceConfig = {
    ip,
    appId: '721b6fce-4ee6-48ba-8045-955a539edadb',
    userId: '654321',
  };
  const tv = new SamsungTv(deviceConfig);
  await tv.init();
  await tv.requestPin();
 
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Please enter the pin you see on your tv\n', async (pin) => {
    console.log(chalk`Ok... sending {yellow "${pin}"} to your tv to see if it works...`); // eslint-disable-line
    let identity;
    try {
      identity = await tv.confirmPin(pin);
      await tv.connect();
    } catch (err) {
      console.log(`That didn't work`, err) // eslint-disable-line
      rl.close();
      return;
    }
    console.log(`Looks good so far. I'll send the MUTE key to your tv to see if it works...`); // eslint-disable-line
    await tv.sendKey('KEY_MUTE');
    rl.close();
    console.log(chalk`If it worked, add this to your config under "Pairing token / identity": {green ${JSON.stringify(identity)}}`); // eslint-disable-line
    process.exit(0);
  });
};

const program = new Command();

program.command('model <model>')
  .description('Shows infos about a specific model (e.g. UE40D6100)')
  .action(modelInfo);

program.command('pair <ip>')
  .description('Starts the pairing process')
  .action(pair);

program.parse(process.argv);