declare const techs: {
    readonly U: "LED";
    readonly G: "QLED (2018/2019)";
    readonly Q: "QLED (2017)";
    readonly P: "Plasma";
    readonly L: "LCD";
    readonly K: "OLED";
};
declare const markets: {
    readonly N: "Northamerica";
    readonly E: "Europe";
    readonly Q: "Germany";
    readonly A: "Asia";
};
declare const years: {
    readonly Q: readonly [2017, 2018, 2019];
    readonly RU: 2019;
    readonly NU: 2018;
    readonly N: 2018;
    readonly MU: 2017;
    readonly M: 2017;
    readonly KS: 2016;
    readonly KU: 2016;
    readonly K: 2016;
    readonly JS: 2015;
    readonly JU: 2015;
    readonly J: 2015;
    readonly HU: 2014;
    readonly H: 2014;
    readonly F: 2013;
    readonly E: 2012;
    readonly ES: 2012;
    readonly EH: 2012;
    readonly D: 2011;
    readonly C: 2010;
    readonly B: 2009;
    readonly A: 2008;
};
export interface SamsungTVModel {
    technology: typeof techs[keyof typeof techs];
    technologyKey: keyof typeof techs;
    market: typeof markets[keyof typeof markets];
    marketKey: keyof typeof markets;
    year: typeof years[keyof typeof years];
    yearKey: keyof typeof years;
    size: number;
    rest: string;
}
declare const _default: (sn: string) => SamsungTVModel | null;
/**
 * Parses Samsung TV Serial numbers into more specific infos
 * @see https://www.samsung.com/de/support/tv-audio-video/was-bedeutet-der-modellcode-meines-fernsehers/
 * @param sn SerialNumber
 */
export default _default;
//# sourceMappingURL=parseSerialNumber.d.ts.map