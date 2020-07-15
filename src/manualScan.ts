import deviceDetection from './utils/detectDevices';

const scan = async () => {
  const devices = await deviceDetection();
  console.log('Found devices', devices); // eslint-disable-line
};
scan();
