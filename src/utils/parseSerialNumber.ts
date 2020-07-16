const techs = {
  U: 'LED',
  G: 'QLED (2018/2019)',
  Q: 'QLED (2017)',
  P: 'Plasma',
  L: 'LCD',
  K: 'OLED',
} as const;
const markets = {
  N: 'Northamerica',
  E: 'Europe',
  Q: 'Germany', // only for technology G
  A: 'Asia',
} as const;
const years = {
  Q: [2017, 2018, 2019],
  RU: 2019,
  NU: 2018,
  N: 2018,
  MU: 2017,
  M: 2017,
  KS: 2016,
  KU: 2016,
  K: 2016,
  JS: 2015,
  JU: 2015,
  J: 2015,
  HU: 2014,
  H: 2014,
  F: 2013,
  E: 2012,
  ES: 2012,
  EH: 2012,
  D: 2011,
  C: 2010,
  B: 2009,
  A: 2008,
} as const;

export interface SamsungTVModel {
  technology: typeof techs[keyof typeof techs];
  technologyKey: keyof typeof techs;
  market: typeof markets[keyof typeof markets];
  marketKey: keyof typeof markets;
  year: typeof years[keyof typeof years];
  yearKey: keyof typeof years;
  size: number
}

/**
 * Parses Samsung TV Serial numbers into more specific infos
 * @see https://www.samsung.com/de/support/tv-audio-video/was-bedeutet-der-modellcode-meines-fernsehers/
 * @param sn SerialNumber
 */
export default (sn: string): SamsungTVModel | null => {
  const techKeys = Object.keys(techs);
  const marketKeys = Object.keys(markets);
  const yearKeys = Object.keys(years);
  const pattern = `^(${techKeys.join('|')})(${marketKeys.join('|')})([0-9]+)(${yearKeys.join('|')})`;
  const re = new RegExp(pattern, 'gi');

  const matches = re.exec(sn);
  if (!matches) {
    return null;
  }
  const tech = matches[1];
  const market = matches[2];
  const size = matches[3];
  const year = matches[4];
  return {
    technology: techs[tech],
    technologyKey: tech as keyof typeof techs,
    market: markets[market],
    marketKey: market as keyof typeof markets,
    size: parseInt(size, 10),
    year: years[year],
    yearKey: year as keyof typeof years,
  };
};

