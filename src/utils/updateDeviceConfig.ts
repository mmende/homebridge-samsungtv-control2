import fs from 'fs';
import { SamsungPlatformConfig, DeviceConfig } from '../types/deviceConfig';
import { PLATFORM_NAME } from '../settings';

const { readFile, copyFile, writeFile } = fs.promises;

export default async (configPath: string, devices: { [usn: string]: DeviceConfig }, backup = false) => {
  const configFile = readFile(configPath, { encoding: 'utf8' });
  const config = JSON.parse((await configFile).toString());
  const platforms: Array<{ platform: string } | SamsungPlatformConfig> = Array.isArray(config.platforms) ? config.platforms : [];
  const platformIdx = platforms.findIndex(p => p.platform === PLATFORM_NAME);
  if (platformIdx !== -1) {
    const platform = platforms[platformIdx] as SamsungPlatformConfig;
    platform.devices = devices;
  } else {
    platforms.push({
      platform: PLATFORM_NAME,
      devices,
    });
  }
  config.platforms = platforms;

  // Create a backup file in case anything goes wrong
  if (backup) {
    const configBackupPath = `${configPath}.${(new Date()).getTime()}`;
    await copyFile(configPath, configBackupPath);
  }
  await writeFile(configPath, JSON.stringify(config, null, 2), { encoding: 'utf8' });
};