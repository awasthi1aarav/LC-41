// LC-41 game data. Real numbers are simplified from NASA/JPL Voyager facts; see README for sources.
const W = 480, H = 270;
const K_DECAY = 0.0154;        // RTG output fall per year (fits ~470 W in 1977 -> ~220 W in 2026)
const W_PER_YEAR_NOW = 4;      // NASA: each Voyager loses about 4 W a year
const LAUNCH = 1977.68;        // 5 Sep 1977

const ROLES = {
  director: { name: 'FLIGHT DIRECTOR', short: 'FD', goal: 'Finish with at least $20M left in the budget.' },
  engineer: { name: 'SPACECRAFT ENGINEER', short: 'ENG', goal: 'Launch with 15%+ spare power, and keep Voyager alive until it reaches one light-day (2026).' },
  science:  { name: 'SCIENCE OFFICER', short: 'SCI', goal: 'Fly at least 7 of the 10 science instruments.' },
  capcom:   { name: 'CAPCOM / COMMS', short: 'COM', goal: 'Lose no more than 10% of the science data at the planets.' },
};
const ROLE_ORDER = ['director', 'engineer', 'science', 'capcom'];

const DIFF = {
  cadet:    { name: 'CADET', budget: 650, band: 0.8, hint: true },
  engineer: { name: 'ENGINEER', budget: 500, band: 0.4, hint: true },
  director: { name: 'FLIGHT DIRECTOR', budget: 440, band: 0.25, hint: false },
  sandbox:  { name: 'SANDBOX', budget: Infinity, band: 0.8, hint: true, sandbox: true },
};

const OBJECTIVES = {
  grand: { name: 'GRAND TOUR SCIENCE', desc: 'Get the best science at Jupiter and Saturn. Planet science counts x1.5.' },
  titan: { name: 'TITAN CLOSE-UP', desc: 'Study Saturn\'s hazy moon Titan up close. Titan science counts x2.' },
  far:   { name: 'GO THE DISTANCE', desc: 'Survive as long as possible into interstellar space. Interstellar science and lifetime count x1.5.' },
};

const BUSES = {
  std:   { name: 'Three-axis bus with scan platform', mass: 470, cost: 150, essential: 200,
           desc: 'Mariner-style, like the real Voyager. Holds pointing cameras steady. Needs ~200 W just to stay alive.' },
  light: { name: 'Spin-stabilised light bus', mass: 230, cost: 80, essential: 100, noPlatform: true,
           desc: 'Pioneer 10 style: light and cheap, but it spins, so no scan-platform instruments (cameras, IR, UV, polarimeter).' },
};

const LVS = {
  atlas: { name: 'Atlas-Centaur', max: 600, cost: 60, desc: 'Cheaper. Launched the lighter Pioneer 10 and 11.' },
  titan: { name: 'Titan IIIE-Centaur', max: 850, cost: 110, desc: 'The real Voyager rocket, from Launch Complex 41.' },
};

const WINDOWS = {
  y77: { name: 'Aug-Sep 1977', delay: 0, cost: 0, saturn: true, titan: true,
         desc: 'The Grand Tour alignment of the outer planets. It only comes about once every 175 years.' },
  y78: { name: '1978 (one year late)', delay: 1, cost: 40, saturn: true, titan: false,
         desc: 'Keeping the team waiting costs money, and the planets have moved: no Titan close pass.' },
  y79: { name: '1979 (two years late)', delay: 2, cost: 70, saturn: false, titan: false,
         desc: 'The alignment is gone. Jupiter only, and a slower escape from the solar system.' },
};

const RTG = { mass: 39, watts: 157, cost: 25 };
const HGAS = {
  big:   { name: '3.7 m high-gain dish', mass: 18, cost: 20, factor: 1.0, desc: 'The real one. Bigger dish = stronger, faster signal.' },
  small: { name: '2.0 m dish', mass: 8, cost: 10, factor: 0.29, desc: 'Lighter, but (2.0/3.7)^2 = only 29% of the signal area.' },
};
const TAPE = { mass: 8, cost: 10, power: 10 };
const HYD_TCM = 40, HYD_PER_YEAR = 1.0;   // kg used by early trajectory corrections, then per year for pointing
const LINE_HEATERS = 15;                  // part of 'essential': keeps hydrazine lines from freezing

// p = planet science value, i = interstellar science value. Mass kg, power W, cost $M (simplified)
const INST = [
  { id: 'ISS',  name: 'Imaging cameras',          mass: 38,  power: 21,  cost: 20, p: 30, i: 0,  platform: true },
  { id: 'IRIS', name: 'Infrared spectrometer',    mass: 20,  power: 14,  cost: 12, p: 14, i: 0,  platform: true },
  { id: 'UVS',  name: 'Ultraviolet spectrometer', mass: 4.5, power: 3.5, cost: 6,  p: 8,  i: 4,  platform: true },
  { id: 'PPS',  name: 'Photopolarimeter',         mass: 2.6, power: 2.4, cost: 5,  p: 6,  i: 0,  platform: true },
  { id: 'PRA',  name: 'Planetary radio astronomy',mass: 7.7, power: 7,   cost: 6,  p: 8,  i: 2 },
  { id: 'PWS',  name: 'Plasma wave',              mass: 1.4, power: 1.6, cost: 4,  p: 5,  i: 10 },
  { id: 'PLS',  name: 'Plasma',                   mass: 9.9, power: 8,   cost: 7,  p: 6,  i: 8 },
  { id: 'LECP', name: 'Low-energy charged particles', mass: 7.5, power: 3.8, cost: 7, p: 6, i: 9 },
  { id: 'CRS',  name: 'Cosmic rays',              mass: 7.5, power: 5.4, cost: 7,  p: 4,  i: 9 },
  { id: 'MAG',  name: 'Magnetometer',             mass: 5.6, power: 2.2, cost: 6,  p: 6,  i: 10 },
];
const INSTBY = Object.fromEntries(INST.map(i => [i.id, i]));
const HEATERS = 30; // optional instrument heaters

const REAL_DESIGN = { obj: 'grand', bus: 'std', lv: 'titan', win: 'y77', rtg: 3, hyd: 104, hga: 'big', tape: true,
  inst: Object.fromEntries(INST.map(i => [i.id, true])) };

const LEARN = {
  director: 'A launch vehicle can only lift so much mass to escape speed. Launch late and you miss the planetary alignment that lets gravity assists fling Voyager from planet to planet.',
  engineer: 'An RTG turns heat from decaying plutonium into electricity. It never runs out suddenly, it fades: Voyager loses about 4 W a year. Hydrazine fuel keeps the antenna pointed at Earth, and its lines must stay warm.',
  science:  'Every instrument costs mass, power and money. Cameras and spectrometers shine at planets; fields-and-particles instruments keep working in interstellar space for decades.',
  capcom:   'Science is worthless if it never reaches Earth. A bigger dish sends more data; a tape recorder stores data you can\'t send in real time during a fast flyby.',
};

const HISTORY = [
  ['5 Sep 1977', 'Voyager 1 launches on a Titan IIIE-Centaur from Launch Complex 41, Cape Canaveral.'],
  ['5 Mar 1979', 'Closest approach to Jupiter. Its images reveal active volcanoes on Io.'],
  ['12 Nov 1980', 'Saturn flyby. The team picks a close pass of Titan, which bends Voyager 1 out of the plane of the planets.'],
  ['14 Feb 1990', 'From about 6 billion km, Voyager 1 photographs the "Pale Blue Dot". Soon after, its cameras are switched off for good.'],
  ['17 Feb 1998', 'Voyager 1 passes Pioneer 10 and becomes the most distant human-made object.'],
  ['Dec 2004', 'Crosses the termination shock, where the solar wind suddenly slows.'],
  ['25 Aug 2012', 'Crosses the heliopause into interstellar space.'],
  ['Nov 2023', 'A failed memory chip garbles its data. Engineers move the code around it and recover the spacecraft in 2024.'],
  ['17 Apr 2026', 'After an unexpected power drop in February, NASA switches off the Low-Energy Charged Particles instrument. Only the magnetometer and plasma wave instrument remain on.'],
  ['18 Nov 2026', 'Voyager 1 reaches one light-day from Earth: a signal takes 24 hours each way.'],
];
