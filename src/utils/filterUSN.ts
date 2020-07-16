/**
 * Extracts the unique id at the start of usn's
 */
export default (usn: string) => {
  const filteredUSN = usn.replace(/^(uuid:[a-z0-9-]+).*$/gi, '$1');
  if (filteredUSN) {
    return filteredUSN;
  }
  return usn;
};