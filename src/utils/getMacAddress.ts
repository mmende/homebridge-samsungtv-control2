import macFromIp from 'macfromip';

export default (ip: string) => new Promise<string>((resolve, reject) => {
  macFromIp.getMac(ip, (err, data) => {
    if (err) {
      reject(err);
      return;
    }
    // fix the mac address so that every number consists of 2 bytes
    const mac = data.trim().split(':').map(n => n.length < 2 ? `0${n}` : `${n}`).join(':');
    resolve(mac);
  });
});