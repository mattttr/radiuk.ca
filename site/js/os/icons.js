// Original 16x16 pixel-art icons, drawn as text grids and rendered to crisp SVG.
// Each character is one pixel; "." is transparent. Icons can be layered:
// a base grid plus overlays ({ at: row, rows: [...] }) drawn on top.

const PALETTE = {
  K: '#000000', W: '#ffffff', L: '#dfdfdf', S: '#c0c0c0', G: '#808080', D: '#404040',
  B: '#000080', b: '#2a5bd7', c: '#48e0d8', T: '#008080',
  Y: '#ffe14d', y: '#a08a00', R: '#e0302a', r: '#8a1010',
  N: '#3cc84a', n: '#0f7a23', M: '#ff4fb8', O: '#f98a5f', o: '#b8532e',
  i: '#0a66c2', F: '#ffd34d', f: '#c9971a', P: '#fff0b0', z: '#0a192f',
};

// ---------------------------------------------------------------- bases

const COMPUTER = [
  '................',
  '.KKKKKKKKKKKKKK.',
  '.KWWWWWWWWWWWSK.',
  '.KWKKKKKKKKKKSK.',
  '.KWKTTTTTTTTKSK.',
  '.KWKTcTTTTTTKSK.',
  '.KWKTTTTTTTTKSK.',
  '.KWKTTTTTTTTKSK.',
  '.KWKKKKKKKKKKSK.',
  '.KWSSSSSSSSnSSK.',
  '.KGGGGGGGGGGGGK.',
  '.KKKKKKKKKKKKKK.',
  '.....KGGGGK.....',
  '...KKKKKKKKKKK..',
  '...KWSSSSSSSGK..',
  '...KKKKKKKKKKK..',
];

const FOLDER = [
  '................',
  '................',
  '..KKKKK.........',
  '.KPPPPPK........',
  '.KPFFFFPKKKKKKK.',
  '.KPFFFFFPPPPPPK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KPFFFFFFFFFFfK.',
  '.KffffffffffffK.',
  '.KKKKKKKKKKKKKK.',
];

const PAGE = [
  '...KKKKKKKK.....',
  '...KWWWWWWKK....',
  '...KWWWWWWKWK...',
  '...KWWWWWWKKKK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KWWWWWWWWWK..',
  '...KKKKKKKKKKK..',
  '................',
];

const APP = [
  '................',
  'KKKKKKKKKKKKKKKK',
  'KBBBBBBBBBBBSKSK',
  'KKKKKKKKKKKKKKKK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWK',
  'KKKKKKKKKKKKKKKK',
  '................',
];

const CIRCLE = (fill) => [
  '................',
  '.....KKKKKK.....',
  '...KKXXXXXXKK...',
  '..KXXXXXXXXXXK..',
  '.KXXXXXXXXXXXXK.',
  '.KXXXXXXXXXXXXK.',
  'KXXXXXXXXXXXXXXK',
  'KXXXXXXXXXXXXXXK',
  'KXXXXXXXXXXXXXXK',
  'KXXXXXXXXXXXXXXK',
  'KXXXXXXXXXXXXXXK',
  '.KXXXXXXXXXXXXK.',
  '.KXXXXXXXXXXXXK.',
  '..KXXXXXXXXXXK..',
  '...KKXXXXXXKK...',
  '.....KKKKKK.....',
].map((r) => r.replaceAll('X', fill));

// ------------------------------------------------------------- overlays

const OV = {
  picture: { at: 1, rows: [
    '........KKKKKKK.',
    '........KbbbYbK.',
    '........KbbbbbK.',
    '........KbnbbbK.',
    '........KnnnbnK.',
    '........KnnnnnK.',
    '........KKKKKKK.',
  ] },
  sketch: { at: 1, rows: [
    '........KKKKKKK.',
    '........KBBBBBK.',
    '........KzzzczK.',
    '........KzzczzK.',
    '........KcczzMK.',
    '........KzzzMzK.',
    '........KKKKKKK.',
  ] },
  window: { at: 1, rows: [
    '........KKKKKKK.',
    '........KBBBBBK.',
    '........KWWWWWK.',
    '........KWWWWWK.',
    '........KWWWWWK.',
    '........KKKKKKK.',
  ] },
  paper: { at: 0, rows: [
    '.........KKKKK..',
    '.........KWWWKK.',
    '.........KWGWWK.',
    '.........KWWWWK.',
    '.........KWGGWK.',
    '.........KWWWWK.',
    '.........KKKKKK.',
  ] },
  txtLines: { at: 5, rows: [
    '.....GGGGGGG....',
    '................',
    '.....GGGGGG.....',
    '................',
    '.....GGGGGGG....',
    '................',
    '.....GGGG.......',
  ] },
  docLines: { at: 5, rows: [
    '.....bbbbbbb....',
    '................',
    '.....GGGGGGG....',
    '.....GGGGG......',
    '.....GGGGGGG....',
    '.....GGGGGG.....',
    '.....GGGGGGG....',
    '.....GGGG.......',
  ] },
  image: { at: 5, rows: [
    '.....KKKKKKK....',
    '.....KbbbYbK....',
    '.....KbnbbbK....',
    '.....KnnnbnK....',
    '.....KnnnnnK....',
    '.....KKKKKKK....',
  ] },
  screenOff: { at: 4, rows: [
    '....KKKKKKKK....',
    '....KDKKKKKK....',
    '....KKKKKKKK....',
    '....KKKKKKKK....',
  ] },
  screenRainbow: { at: 4, rows: [
    '....RRYYNNbb....',
    '....RRYYNNbb....',
    '....RRYYNNbb....',
    '....RRYYNNbb....',
  ] },
  runArrow: { at: 6, rows: [
    '........n.......',
    '........nn......',
    '...nnnnnnnn.....',
    '...nnnnnnnn.....',
    '........nn......',
    '........n.......',
  ] },
  shortcut: { at: 9, rows: [
    'KKKKKKK.........',
    'KWWKKKK.........',
    'KWWWKKK.........',
    'KWWKWKK.........',
    'KWKWWWK.........',
    'KKWWWWK.........',
    'KKKKKKK.........',
  ] },
  papersOut: { at: 0, rows: [
    '.....WW..WWW....',
    '....WLLW.WLLW...',
  ] },
};

// ----------------------------------------------------------------- icons

const ICONS = {
  computer: [COMPUTER],
  'computer-off': [COMPUTER, OV.screenOff],
  display: [COMPUTER, OV.screenRainbow],
  folder: [FOLDER],
  pictures: [FOLDER, OV.picture],
  projects: [FOLDER, OV.sketch],
  programs: [FOLDER, OV.window],
  documents: [FOLDER, OV.paper],
  page: [PAGE],
  notepad: [PAGE, OV.txtLines],
  doc: [PAGE, OV.docLines],
  image: [PAGE, OV.image],
  app: [APP],
  run: [APP, OV.runArrow],
  shortcut: [OV.shortcut],

  sketch: [[
    '................',
    'KKKKKKKKKKKKKKKK',
    'KBBBBBBBBBBBSKSK',
    'KKKKKKKKKKKKKKKK',
    'KzzzzzzzzzzzzzzK',
    'KzzzzzzzzzccczzK',
    'KzzzzzzzzczzzczK',
    'KzzzzzzzczzzzzzK',
    'KzzcczzzczzzzzzK',
    'KzczzczczzzzzzzK',
    'KczzzzczzzzMMzzK',
    'KzzzzzzzzzMzzMzK',
    'KzzzzzzzzzzMMzzK',
    'KzzzzzzzzzzzzzzK',
    'KKKKKKKKKKKKKKKK',
    '................',
  ]],

  mail: [[
    '................',
    '................',
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KKWWWWWWWWWWKK.',
    '.KWKWWWWWWWWKWK.',
    '.KWWKWWWWWWKWWK.',
    '.KWWWKWWWWKWWWK.',
    '.KWWWWKWWKWWWWK.',
    '.KWWWWWKKWWWWWK.',
    '.KWWWWWWWWWWWWK.',
    '.KWWWWWWWWWWWWK.',
    '.KLLLLLLLLLLLLK.',
    '.KKKKKKKKKKKKKK.',
    '................',
    '................',
  ]],

  terminal: [[
    '................',
    'KKKKKKKKKKKKKKKK',
    'KBBBBBBBBBBBBBBK',
    'KBBBBBBBBBBBBBBK',
    'KSSSSSSSSSSSSSSK',
    'KSKKKKKKKKKKKKSK',
    'KSKWKKKKKKKKKKSK',
    'KSKKWKKKKKKKKKSK',
    'KSKKKWKKKKKKKKSK',
    'KSKKWKKKKKKKKKSK',
    'KSKWKKWWWWKKKKSK',
    'KSKKKKKKKKKKKKSK',
    'KSSSSSSSSSSSSSSK',
    'KKKKKKKKKKKKKKKK',
    '................',
    '................',
  ]],

  mine: [[
    '................',
    '.......K........',
    '.......K........',
    '...K.KKKKK.K....',
    '....KKKKKKK.....',
    '...KKWWKKKKK....',
    '...KKWWKKKKK....',
    '.KKKKKKKKKKKKK..',
    '...KKKKKKKKK....',
    '...KKKKKKKKK....',
    '....KKKKKKK.....',
    '...K.KKKKK.K....',
    '.......K........',
    '.......K........',
    '................',
    '................',
  ]],

  pablo: [[
    'KKKKKKKKKKKKKKKK',
    'KOOOOOOOOOOOOOOK',
    'KOKKKOKKOKKKKOOK',
    'KOOOOOOOOOOOOOOK',
    'KOKKKOKKOKKKKOOK',
    'KOOOGGGGGGGOOOOK',
    'KOOOGLGGLGGOOOOK',
    'KOOOGGGGGGGOOOOK',
    'KOOOGGGGGGGOOOOK',
    'KOKKKOKKOKKKKOOK',
    'KOOOOOOOOOOOOOOK',
    'KOKKOOOODDDDOOOK',
    'KOOOOOOODDDDOOOK',
    'KOKKOOOODDDDOOOK',
    'KOOOOOOOOOOOOOOK',
    'KKKKKKKKKKKKKKKK',
  ]],

  recycle: [[
    '................',
    '................',
    '..KKKKKKKKKKKK..',
    '..KWLLLLLLLLGK..',
    '..KKKKKKKKKKKK..',
    '...KWGWGWGWGK...',
    '...KGWnnnWGWK...',
    '...KWGnWnGWGK...',
    '...KGWnnnWGWK...',
    '...KWGWGWGWGK...',
    '....KWGWGWGK....',
    '....KGWGWGWK....',
    '....KWGWGWGK....',
    '....KKKKKKKK....',
    '................',
    '................',
  ]],

  globe: [[
    '................',
    '.....KKKKKK.....',
    '....KbbnnbbK....',
    '...KbnnnnbbbK...',
    '..KbbnnnnnbbbK..',
    '..KbbbnnnbbnnK..',
    '..KbbbbnbbnnnK..',
    '..KbbbbbbnnnbK..',
    '..KbnnbbbbnnbK..',
    '..KbnnnbbbbbbK..',
    '...KbnnbbbbbK...',
    '....KbbbbbbK....',
    '.....KKKKKK.....',
    '................',
    '................',
    '................',
  ]],

  github: [[
    '.....KKKKKK.....',
    '...KKKKKKKKKK...',
    '..KKWKKKKKKWKK..',
    '.KKKWWKKKKWWKKK.',
    '.KKKWWWWWWWWKKK.',
    'KKKWWWWWWWWWWKKK',
    'KKKWWWWWWWWWWKKK',
    'KKKWWWWWWWWWWKKK',
    'KKKKWWWWWWWWKKKK',
    'KKKKKWWWWWWKKKKK',
    '.KWKKKWWWWKKKKK.',
    '.KKWWKWWWWKKKKK.',
    '..KKKKWWWWKKKK..',
    '...KKKWWWWKKK...',
    '.....KWWWWK.....',
    '................',
  ]],

  linkedin: [[
    '................',
    '..iiiiiiiiiiii..',
    '.iiiiiiiiiiiiii.',
    '.iiWWiiiiiiiiii.',
    '.iiWWiiiiiiiiii.',
    '.iiiiiiiiiiiiii.',
    '.iiWWiiWWiWWWii.',
    '.iiWWiiWWWWWWWi.',
    '.iiWWiiWWWiiWWi.',
    '.iiWWiiWWiiiWWi.',
    '.iiWWiiWWiiiWWi.',
    '.iiWWiiWWiiiWWi.',
    '.iiWWiiWWiiiWWi.',
    '.iiiiiiiiiiiiii.',
    '..iiiiiiiiiiii..',
    '................',
  ]],

  help: [[
    '................',
    '...KKKKKKKKKK...',
    '..KbbbbbbbbbbK..',
    '..KbbbYYYYbbbK..',
    '..KbbYYbbYYbbK..',
    '..KbbbbbbYYbbK..',
    '..KbbbbbYYbbbK..',
    '..KbbbbYYbbbbK..',
    '..KbbbbYYbbbbK..',
    '..KbbbbbbbbbbK..',
    '..KbbbbYYbbbbK..',
    '..KbbbbYYbbbbK..',
    '..KbbbbbbbbbbK..',
    '..KWWWWWWWWWWK..',
    '..KKKKKKKKKKKK..',
    '................',
  ]],

  floppy: [[
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KBBSSSSSSSSBBK.',
    '.KBBSSSSKKSSBBK.',
    '.KBBSSSSKKSSBBK.',
    '.KBBSSSSSSSSBBK.',
    '.KBBBBBBBBBBBBK.',
    '.KBBBBBBBBBBBBK.',
    '.KBWWWWWWWWWWBK.',
    '.KBWGGGGGGGGWBK.',
    '.KBWWWWWWWWWWBK.',
    '.KBWGGGGGGWWWBK.',
    '.KBWWWWWWWWWWBK.',
    '.KBWWWWWWWWWWBK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ]],

  paw: [[
    '................',
    '....RR....NN....',
    '...RRRR..NNNN...',
    '...RRRR..NNNN...',
    '....RR....NN....',
    '.bb..........YY.',
    'bbbb........YYYY',
    'bbbb........YYYY',
    '.bb...DDDD...YY.',
    '....DDDDDDDD....',
    '...DDDDDDDDDD...',
    '..DDDDDDDDDDDD..',
    '..DDDDDDDDDDDD..',
    '..DDDDDDDDDDDD..',
    '...DDDD..DDDD...',
    '................',
  ]],

  speaker: [[
    '................',
    '................',
    '......KK........',
    '.....KSK...K....',
    '....KSSK....K...',
    'KKKKSSSK.K...K..',
    'KSSSSSSK..K..K..',
    'KSSSSSSK..K..K..',
    'KSSSSSSK..K..K..',
    'KSSSSSSK..K..K..',
    'KKKKSSSK.K...K..',
    '....KSSK....K...',
    '.....KSK...K....',
    '......KK........',
    '................',
    '................',
  ]],

  'speaker-off': [[
    '................',
    '................',
    '......KK........',
    '.....KSK........',
    '....KSSK........',
    'KKKKSSSK.R...R..',
    'KSSSSSSK..R.R...',
    'KSSSSSSK...R....',
    'KSSSSSSK..R.R...',
    'KSSSSSSK.R...R..',
    'KKKKSSSK........',
    '....KSSK........',
    '.....KSK........',
    '......KK........',
    '................',
    '................',
  ]],

  error: [[
    '................',
    '.....KKKKKK.....',
    '...KKRRRRRRKK...',
    '..KRRRRRRRRRRK..',
    '.KRRRRRRRRRRRRK.',
    '.KRRWWRRRRWWRRK.',
    'KRRRRWWRRWWRRRRK',
    'KRRRRRWWWWRRRRRK',
    'KRRRRRRWWRRRRRRK',
    'KRRRRRWWWWRRRRRK',
    'KRRRRWWRRWWRRRRK',
    '.KRRWWRRRRWWRRK.',
    '.KRRRRRRRRRRRRK.',
    '..KRRRRRRRRRRK..',
    '...KKRRRRRRKK...',
    '.....KKKKKK.....',
  ]],

  info: [CIRCLE('b'), { at: 4, rows: [
    '.......WW.......',
    '.......WW.......',
    '................',
    '......WWW.......',
    '.......WW.......',
    '.......WW.......',
    '.......WW.......',
    '......WWWW......',
  ] }],

  question: [CIRCLE('W'), { at: 4, rows: [
    '......bbbb......',
    '.....bb..bb.....',
    '.........bb.....',
    '........bb......',
    '.......bb.......',
    '.......bb.......',
    '................',
    '.......bb.......',
    '.......bb.......',
  ] }],

  flag: [[
    '................',
    '................',
    '......RRK.......',
    '....RRRRK.......',
    '..RRRRRRK.......',
    '....RRRRK.......',
    '......RRK.......',
    '........K.......',
    '........K.......',
    '......KKKKK.....',
    '....KKKKKKKKK...',
    '....KKKKKKKKK...',
    '................',
    '................',
    '................',
    '................',
  ]],

  warning: [[
    '................',
    '.......KK.......',
    '......KYYK......',
    '......KYYK......',
    '.....KYYYYK.....',
    '.....KYKKYK.....',
    '....KYYKKYYK....',
    '....KYYKKYYK....',
    '...KYYYKKYYYK...',
    '...KYYYKKYYYK...',
    '..KYYYYYYYYYYK..',
    '..KYYYYKKYYYYK..',
    '.KYYYYYKKYYYYYK.',
    '.KYYYYYYYYYYYYK.',
    'KKKKKKKKKKKKKKKK',
    '................',
  ]],
};

// ------------------------------------------------------------- rendering

const cache = new Map();

function layerToRects(layer) {
  const { at = 0, rows } = Array.isArray(layer) ? { rows: layer } : layer;
  let out = '';
  rows.forEach((row, i) => {
    const y = at + i;
    for (let x = 0; x < row.length;) {
      const color = PALETTE[row[x]];
      if (!color) { x++; continue; }
      let n = 1;
      while (row[x + n] === row[x]) n++;
      out += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${color}"/>`;
      x += n;
    }
  });
  return out;
}

function body(name) {
  const key = ICONS[name] ? name : 'app';
  if (!cache.has(key)) cache.set(key, ICONS[key].map(layerToRects).join(''));
  return cache.get(key);
}

export const hasIcon = (name) => name in ICONS;

/** SVG markup for an icon at the given pixel size (multiples of 16 look sharpest). */
export function icon(name, size = 32, cls = '') {
  return `<svg class="px-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${body(name)}</svg>`;
}

/** Data URL for an icon, used for CSS masks (selection tint) and the favicon. */
export function iconUrl(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${body(name)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
