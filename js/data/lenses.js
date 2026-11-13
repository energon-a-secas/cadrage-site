// ── Lenses ───────────────────────────────────────────────────
// Focal length, aperture range, the closest focus and the magnification
// there, and the behaviours that change how a lens should be configured.
//
// Every figure is the maker's own, from the page named in `src`, read on
// LENS_READ: Sony's from www.sony.jp (sony.com does not allow automated
// reading), the others from each maker's product page. Where a maker's
// page does not give a figure, the field is null or a `note` says whose
// figure it is. `basis` is kept for Sony's own lenses only: the other
// makers' figures are just as primary, and `src` says whose they are.
// A minimum focus distance runs from the image sensor
// (Sony's help guide: "refer to the position of the horizontal line" of
// the image sensor position mark), not from the front of the lens.
//
// `mfdCm` and `maxMag` are the pair the framing arithmetic is hung from
// (engine/optics.js). `minMag` and `farCm` mark a lens that only works
// at high magnification. `own` marks the lenses on your shelf.

import { CANDIDATE_LENSES, SONY, sonyUrl } from './lens-candidates.js';

export { CLOSE_UPS, LENS_EXTRAS, LENS_SHOP_NOTE } from './close-ups.js';

/** The day the figures and prices below were read. */
export const LENS_READ = '2026-11-13';

/** The groups the lens select and the options panel list, in order. */
export const LENS_GROUPS = [
  { id: 'yours', label: 'Your lenses, and the kit zoom' },
  { id: 'macro', label: 'Macro lenses',
    lead: 'Each focuses from infinity down to its closest, so it also works as a normal lens of its focal length. At their closest, the short ones leave only a few centimetres in front of the lens for the light to get in; the 90 to 105 mm ones leave room.' },
  { id: 'detail', label: 'Macro only: details, never the whole model',
    lead: 'A lens that starts at life size and goes up from there.' },
  { id: 'fast', label: 'Fast primes near 55 mm: not close-up lenses',
    lead: 'What "1,2/55" means on a barrel: f/1.2 at 55 mm. These buy light and background blur, not reach. None focuses meaningfully closer than the Zeiss, and at f/8 on a tripod each draws the picture the Zeiss does. The Sirui Sniper 56mm f/1.2, the Kamlan 55mm f/1.2 and the Sirui Night Walker 55mm T1.2 are the same story by their retailers\' figures (0.6 m minimum focus); their makers\' pages could not be read, so they are not in the table.' },
];

export const LENSES = {
  'zeiss-55-1.8': {
    label: 'Sony Zeiss Sonnar T* FE 55mm f/1.8 ZA',
    short: 'Zeiss 55mm',
    code: 'SEL55F18Z',
    own: true,
    group: 'yours',
    kind: 'Standard prime, the turntable lens: 82.5 mm equivalent on this body',
    mount: 'Sony E (full-frame)',
    focalMm: 55,
    apertureMin: 1.8,
    apertureMax: 22,
    mfdCm: 50,
    maxMag: 0.14,
    af: true,
    zoom: false,
    stabilised: false,
    lengthMm: 70.5,
    weightG: 281,
    filterMm: 49,
    basis: 'sony-spec',
    src: SONY,
    url: sonyUrl('SEL55F18Z'),
    note: 'Internal focusing: the barrel does not grow. Not a macro lens in the lens-maker\'s sense, whatever job it does on the turntable: 0.14x is as close as it draws.',
    quirks: [
      { id: 'mfd-50', severity: 'note', basis: 'sony-spec',
        detail: 'Minimum focus distance is 50cm. Closer than that and it cannot focus at all, which sets how far back the subject has to sit.' },
    ],
  },
  'sony-15-1.4g': {
    label: 'Sony E 15mm f/1.4 G',
    short: 'Sony 15mm',
    code: 'SEL15F14G',
    own: true,
    group: 'yours',
    kind: 'Wide prime, the hands-on lens',
    mount: 'Sony E (APS-C)',
    focalMm: 15,
    apertureMin: 1.4,
    apertureMax: 16,
    mfdCm: 20,
    maxMag: 0.12,
    // Sony gives a second, closer pair for manual focus.
    mf: { mfdCm: 17, maxMag: 0.15 },
    af: true,
    zoom: false,
    stabilised: false,
    lengthMm: 69.5,
    weightG: 219,
    filterMm: 55,
    basis: 'sony-spec',
    src: SONY,
    url: sonyUrl('SEL15F14G'),
    note: 'These are the autofocus figures. In manual focus Sony gives 17 cm and 0.15x. A wide lens this close stretches whatever is nearest, so it gets close without being a close-up lens.',
    quirks: [
      { id: 'af-c-aperture-drift', severity: 'warn', basis: 'empirical-user',
        detail: 'With AF-C driving it, this lens has been observed changing aperture on its own, shifting exposure and colour mid-take. Locking exposure or dropping to AF-S removes the cause rather than limiting the symptom.' },
    ],
  },
  'sony-18-135': {
    label: 'Sony E 18-135mm f/3.5-5.6 OSS',
    short: 'Sony 18-135mm',
    code: 'SEL18135',
    group: 'yours',
    kind: 'Kit zoom: the cheapest close-up here if it is already in the drawer',
    mount: 'Sony E (APS-C)',
    focalMm: 18,
    focalMaxMm: 135,
    apertureMin: 3.5,
    apertureMax: 22,
    mfdCm: 45,
    maxMag: 0.29,
    af: true,
    zoom: true,
    stabilised: true,
    lengthMm: 88,
    weightG: 325,
    filterMm: 55,
    basis: 'sony-spec',
    src: SONY,
    url: sonyUrl('SEL18135'),
    note: 'Twice the Zeiss\'s magnification. Sony does not say at which focal length it reaches 0.29x; the long end is assumed here, where the widest aperture is f/5.6 and the smallest f/36.',
    prices: [
      { shop: 'tripodes', clp: 689991, stock: 'in stock', url: 'https://www.tripodes.cl/sony-e-18-135mm-f35-56-oss-lente-para-sony-e-sel18135' },
      { shop: 'rincon', clp: 689990, transfer: 655491, stock: 'ask for stock', out: true, url: 'https://rinconfotografico.cl/sony-e-18-135mm-f35-56-oss' },
    ],
    quirks: [
      { id: 'variable-aperture', severity: 'note', basis: 'sony-spec',
        detail: 'Aperture narrows from f/3.5 to f/5.6 as you zoom in, so exposure shifts with focal length unless you set it at the long end.' },
    ],
  },

  // ── The candidates: js/data/lens-candidates.js ─────────────
  ...CANDIDATE_LENSES,

  other: {
    label: 'Other / not listed',
    short: 'This lens',
    mount: 'unknown',
    focalMm: 50,
    apertureMin: 2.8,
    apertureMax: 16,
    mfdCm: null,
    zoom: false,
    stabilised: false,
    basis: 'unverified',
    quirks: [],
  },
};

export const LENS_IDS = Object.keys(LENSES);

/**
 * Lenses a setup, the depth of field calculator and the lighting
 * simulator can use: everything that focuses at a distance. A macro-only
 * lens has no depth of field "from 90 cm" to work out.
 */
export const DISTANCE_LENS_IDS = LENS_IDS.filter(id => id !== 'other' && !(LENSES[id].minMag > 0));

/** Full-frame equivalent focal length on the given body crop factor. */
export function equivalentFocal(lensId, cropFactor = 1.53) {
  const lens = LENSES[lensId];
  if (!lens) return null;
  // A full-frame lens on an APS-C body still gets cropped: the crop is the
  // sensor's, not the lens's, so this applies to both mounts.
  return Math.round(lens.focalMm * cropFactor);
}
