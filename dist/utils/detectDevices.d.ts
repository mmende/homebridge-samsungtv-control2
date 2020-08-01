import { SamsungTVModel } from './parseSerialNumber';
import { Logger } from 'homebridge';
import { SamsungPlatformConfig, UPNPCapability } from '../types/deviceConfig';
export interface SamsungTV {
    friendlyName: string;
    modelName: string;
    model: SamsungTVModel;
    usn: string;
    mac: string;
    location: string;
    address: string;
    capabilities: Array<UPNPCapability>;
}
declare const _default: (log?: Logger | undefined, config?: SamsungPlatformConfig | undefined) => Promise<Array<SamsungTV>>;
export default _default;
//# sourceMappingURL=detectDevices.d.ts.map