import parseSerialNumber from './utils/parseSerialNumber';

const cli = async (args) => {
  const [sn] = args;
  console.log(parseSerialNumber(sn)); // eslint-disable-line
};
cli(process.argv.slice(2));