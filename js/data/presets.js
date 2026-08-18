// ── Shoot config presets ─────────────────────────────────────
// A config is one plain object and the single input to every engine
// module. `blank()` is the shape of record; presets deviate from it.

export const CONFIG_VERSION = 1;

/** The canonical shape. Every field the engine may read exists here. */
export function blank() {
  return {
    v: CONFIG_VERSION,
    id: 'untitled',
    label: 'Untitled setup',
    note: '',
    body: 'a6700',
    lens: { id: 'other', aperture: 2.8, focalMm: null },
    format: { container: 'xavc-hs', res: '4k', fps: 24, bitrate: 100, chroma: '422-10', card: 'sdxc' },
    exposure: {
      iso: { mode: 'manual', value: 800, min: null, max: null },
      shutter: { mode: 'manual', denom: 50 },
      ev: 0,
      meter: null,
      autoSlowShutter: false,
    },
    colour: {
      log: 'off',
      colorGamut: null,
      embedLut: false,
      pictureProfile: 'off',
      gamma: null,
      creativeLook: 'off',
      lut: null,
      wb: { mode: 'auto', kelvin: null, preset: null, gm: 0, ab: 0, awbPriority: 'standard' },
      pp: {},
    },
    focus: {
      mode: 'af-s',
      area: 'wide',
      transitionSpeed: 4,
      shiftSensitivity: 3,
      subjectRecognition: false,
      peaking: { on: false, level: 'mid', colour: 'white' },
    },
    stabilisation: { steadyShot: true, tripod: false },
    monitoring: { zebra: { on: false, level: 75 } },
    flicker: { varShutter: false, antiFlicker: false },
    room: {
      mainsHz: 50,
      lights: [],
      backdrop: 'none',
      subjectToBackdropCm: null,
      subjectDistanceCm: null,
    },
    post: {
      editor: 'none',
      scale: null,
      colourManaged: false,
      monitorNote: '',
      values: {},
      summable: false,
    },
  };
}

/** Deep-merge a partial config over the blank shape. Arrays replace. */
export function fromPartial(partial) {
  return merge(blank(), partial);
}

function merge(base, over) {
  if (over === null || over === undefined) return base;
  if (Array.isArray(over) || typeof over !== 'object') return over;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = (v && typeof v === 'object' && !Array.isArray(v) && base?.[k] && typeof base[k] === 'object')
      ? merge(base[k], v)
      : v;
  }
  return out;
}

export const PRESETS = [
  {
    id: 'turntable-55',
    label: 'Turntable 55mm',
    note: 'Product on a motorised turntable against a green backdrop, 55mm prime, tripod. Picture Profile rather than Log, corrected further in CapCut.',
    lens: { id: 'zeiss-55-1.8', aperture: 1.8 },
    format: { container: 'xavc-hs', res: '4k', fps: 60, bitrate: 100, chroma: '422-10' },
    exposure: {
      iso: { mode: 'auto', value: null, min: 250, max: 800 },
      shutter: { mode: 'auto', denom: 120 },
      ev: 0,
      autoSlowShutter: false,
    },
    colour: {
      log: 'off',
      pictureProfile: 'pp6',
      gamma: 'cine4',
      creativeLook: 'off',
      lut: null,
      wb: { mode: 'custom-k', kelvin: 4800, gm: 4, ab: 0, awbPriority: 'white' },
      pp: {
        blackLevel: 2,
        blackGamma: { range: 'wide', level: 3 },
        knee: { mode: 'auto' },
        colorMode: 'pro',
        saturation: 4,
        colorPhase: 1,
        colorDepth: { r: 3, g: 0, b: 0, c: 0, m: 1, y: 1 },
        detail: {
          level: -1, mode: 'auto', vhBalance: 'auto',
          bwBalance: 'type3', limit: 7, crispening: 3, hiLightDetail: 0,
        },
      },
    },
    focus: {
      mode: 'af-c',
      area: 'zone',
      transitionSpeed: 2,
      shiftSensitivity: 2,
      subjectRecognition: false,
      peaking: { on: false },
    },
    stabilisation: { steadyShot: false, tripod: true },
    monitoring: { zebra: { on: true, level: 75 } },
    flicker: { varShutter: false, antiFlicker: false },
    room: {
      mainsHz: 50,
      lights: [
        { id: 'main', model: 'pl48', aim: 'backdrop', heightNote: 'behind the table', flickerFree: null },
        { id: 'left', model: 'pl48', aim: 'subject', heightNote: 'lower than right', flickerFree: null },
        { id: 'right', model: 'pl48', aim: 'subject', heightNote: 'higher than left', flickerFree: null },
      ],
      backdrop: 'green',
      subjectToBackdropCm: 5,
      subjectDistanceCm: 60,
    },
    post: {
      editor: 'capcut',
      scale: 'capcut-100',
      colourManaged: false,
      monitorNote: 'Display run at 40% brightness as a proxy for how it lands elsewhere.',
      values: {
        temp: 10, tint: 5, saturation: 15, exposure: 20,
        contrast: 5, light: -8, shadow: 0, white: 0, brightness: 5,
        sharpen: 15, clarity: 15,
      },
      summable: false,
    },
  },
  {
    id: 'handson-15',
    label: 'Hands-on 15mm',
    note: 'Hands in frame showing a product on a table. Wide prime, Log recording with a viewing LUT.',
    lens: { id: 'sony-15-1.4g', aperture: 1.4 },
    format: { container: 'xavc-hs', res: '4k', fps: 60, bitrate: 100, chroma: '422-10' },
    exposure: {
      iso: { mode: 'manual', value: 250, min: null, max: null },
      shutter: { mode: 'auto', denom: null },
      ev: 0,
    },
    colour: {
      log: 'on-flexible-iso',
      colorGamut: 'sgamut3-cine',
      embedLut: true,
      pictureProfile: 'pp6',
      gamma: null,
      creativeLook: 'off',
      lut: 'itu709-800',
      wb: { mode: 'custom-3', kelvin: null, gm: 0, ab: 0, awbPriority: 'white' },
      pp: {},
    },
    focus: {
      mode: 'af-c', area: 'wide', transitionSpeed: 2, shiftSensitivity: 2,
      subjectRecognition: false, peaking: { on: true, level: 'mid', colour: 'white' },
    },
    stabilisation: { steadyShot: true, tripod: true },
    monitoring: { zebra: { on: true, level: 75 } },
    flicker: { varShutter: false, antiFlicker: false },
    room: {
      mainsHz: 50,
      lights: [
        { id: 'main', model: 'pl48', aim: 'backdrop', flickerFree: null },
        { id: 'left', model: 'pl48', aim: 'subject', flickerFree: null },
        { id: 'right', model: 'pl48', aim: 'subject', flickerFree: null },
      ],
      backdrop: 'green',
      subjectToBackdropCm: 5,
      subjectDistanceCm: 40,
    },
    post: {
      editor: 'capcut', scale: 'capcut-100', colourManaged: false,
      values: { exposure: 15, black: -10, saturation: 10 },
      summable: false,
    },
  },
  {
    id: 'clean-start',
    label: 'Clean start',
    note: 'Deliberately unopinionated. Manual everything, no corrections anywhere, so findings come from what you change.',
    lens: { id: 'other', aperture: 2.8 },
    format: { container: 'xavc-s', res: '4k', fps: 24, bitrate: 100, chroma: '422-10' },
    exposure: {
      iso: { mode: 'manual', value: 800 },
      shutter: { mode: 'manual', denom: 50 },
    },
    colour: {
      log: 'off', pictureProfile: 'off', gamma: null, creativeLook: 'off',
      wb: { mode: 'custom-k', kelvin: 5600, gm: 0, ab: 0, awbPriority: 'standard' },
      pp: {},
    },
    focus: { mode: 'af-s', area: 'flexible-spot', subjectRecognition: false, peaking: { on: false } },
    stabilisation: { steadyShot: false, tripod: true },
    monitoring: { zebra: { on: true, level: 70 } },
    flicker: { varShutter: false, antiFlicker: false },
    room: { mainsHz: 50, lights: [], backdrop: 'none', subjectToBackdropCm: null },
    post: { editor: 'none', values: {}, summable: false },
  },
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map(p => [p.id, p]));

/** A preset expanded to a full config. */
export function loadPreset(id) {
  const preset = PRESET_BY_ID[id];
  if (!preset) return null;
  return fromPartial(preset);
}
