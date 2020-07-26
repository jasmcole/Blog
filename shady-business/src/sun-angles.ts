const gamma = (day_of_year: number, hour_of_day: number) =>
  ((2 * Math.PI) / 365) * (day_of_year - 1 + (hour_of_day - 12) / 24);

const eqtimeMin = (g: number) =>
  229.18 *
  (0.000075 +
    0.001868 * Math.cos(g) -
    0.032077 * Math.sin(g) -
    0.014615 * Math.cos(2 * g) -
    0.040849 * Math.sin(2 * g));

const declRad = (g: number) =>
  0.006918 -
  0.399912 * Math.cos(g) +
  0.070257 * Math.sin(g) -
  0.006758 * Math.cos(2 * g) +
  0.000907 * Math.sin(2 * g) -
  0.002697 * Math.cos(3 * g) +
  0.00148 * Math.sin(3 * g);

const timeOffsetMin = (eqtimeMin: number, longDeg: number) =>
  eqtimeMin + 4 * longDeg;

const tstMin = (
  hour_of_day: number,
  min_of_hour: number,
  sec_of_min: number,
  time_offset_min: number
) => hour_of_day * 60 + min_of_hour + sec_of_min / 60 + time_offset_min;

const haDeg = (tst_min: number) => tst_min / 4 - 180;

const zenithRad = (lat_deg: number, decl_rad: number, ha_deg: number) => {
  const lat_rad = (lat_deg * Math.PI) / 180;
  const cos_phi =
    Math.sin((lat_deg * Math.PI) / 180) * Math.sin(decl_rad) +
    Math.cos(lat_rad) * Math.cos(decl_rad) * Math.cos((ha_deg * Math.PI) / 180);
  return [Math.acos(cos_phi), cos_phi];
};

const azimuth_rad = (lat_deg: number, zenith_rad: number, decl_rad: number) => {
  const lat_rad = (lat_deg * Math.PI) / 180;
  const cos_theta =
    (Math.sin(lat_rad) * Math.cos(zenith_rad) - Math.sin(decl_rad)) /
    (Math.cos(lat_rad) * Math.sin(zenith_rad));
  return [Math.acos(cos_theta), cos_theta];
};

export const zenith_azimuth_deg = (
  day_of_year: number,
  hour_of_day: number,
  min_of_hour: number,
  sec_of_min: number,
  lat_deg: number,
  long_deg: number
) => {
  const g = gamma(day_of_year, hour_of_day);
  const eqtm = eqtimeMin(g);
  const declr = declRad(g);
  const to = timeOffsetMin(eqtm, long_deg);
  const tstm = tstMin(hour_of_day, min_of_hour, sec_of_min, to);
  const had = haDeg(tstm);
  const [zr, cos_zr] = zenithRad(lat_deg, declr, had);
  const [ar, cos_ar] = azimuth_rad(lat_deg, zr, declr);

  // 90 - z so that it represents angle above horizon
  // 180 - a so that it represents angle from north
  const fromHorizon = 90 - (zr * 180) / Math.PI;
  let fromNorth = 180 - (ar * 180) / Math.PI;
  // Hack - only works in northern hemisphere (?)
  if (hour_of_day > 12) {
    fromNorth = 180 + 180 - fromNorth;
  }
  return { fromHorizon, fromNorth };
};
