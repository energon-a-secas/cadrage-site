// ── Camera bodies ────────────────────────────────────────────
// Sensor geometry, ISO ranges, and the recording-format matrix.
// The A6700 format matrix is transcribed from Sony's Movie Settings
// page, so an invalid combination can be rejected instead of guessed.
// Source: helpguide.sony.net/ilc/2320/v1/en/ — Movie Settings, ISO.

/**
 * Record Setting rows, keyed by container then resolution.
 * `fps` lists the frame rates that offer that exact bitrate + chroma.
 * XAVC HS has no 8-bit modes at all; XAVC S 4K mixes 8- and 10-bit.
 */
export const FORMATS = {
  'xavc-hs': {
    label: 'XAVC HS',
    codec: 'HEVC / H.265',
    basis: 'sony-spec',
    note: 'Efficient but heavier to decode. Every HS mode is 10-bit.',
    modes: {
      '4k': [
        { fps: [60, 50], bitrate: 200, chroma: '422-10' },
        { fps: [60, 50], bitrate: 150, chroma: '420-10' },
        { fps: [60, 50], bitrate: 100, chroma: '422-10' },
        { fps: [60, 50], bitrate: 75, chroma: '420-10' },
        { fps: [60, 50], bitrate: 45, chroma: '420-10' },
        { fps: [24], bitrate: 100, chroma: '422-10' },
        { fps: [24], bitrate: 100, chroma: '420-10' },
        { fps: [24], bitrate: 50, chroma: '422-10' },
        { fps: [24], bitrate: 50, chroma: '420-10' },
        { fps: [24], bitrate: 30, chroma: '420-10' },
        { fps: [120, 100], bitrate: 280, chroma: '422-10' },
        { fps: [120, 100], bitrate: 200, chroma: '420-10' },
      ],
    },
  },
  'xavc-s': {
    label: 'XAVC S',
    codec: 'AVC / H.264',
    basis: 'sony-spec',
    note: 'Wider editor support. 4K offers both 8-bit and 10-bit rows.',
    modes: {
      '4k': [
        { fps: [60, 50], bitrate: 200, chroma: '422-10' },
        { fps: [60, 50], bitrate: 150, chroma: '420-8' },
        { fps: [30, 25], bitrate: 140, chroma: '422-10' },
        { fps: [30, 25], bitrate: 100, chroma: '420-8' },
        { fps: [30, 25], bitrate: 60, chroma: '420-8' },
        { fps: [24], bitrate: 100, chroma: '422-10' },
        { fps: [24], bitrate: 100, chroma: '420-8' },
        { fps: [24], bitrate: 60, chroma: '420-8' },
        { fps: [120, 100], bitrate: 280, chroma: '422-10' },
        { fps: [120, 100], bitrate: 200, chroma: '420-8' },
      ],
    },
  },
};

export const CHROMA_LABELS = {
  '422-10': '4:2:2 10bit',
  '420-10': '4:2:0 10bit',
  '420-8': '4:2:0 8bit',
};

/**
 * 24p exists only on NTSC. Sony footnotes this on both format tables,
 * which matters because a PAL-region body will not offer the row at all.
 */
export const NTSC_ONLY_FPS = [24, 60, 30, 120];

/** Displayed frame rates are rounded; these are what the camera records. */
export const ACTUAL_FPS = { 24: 23.98, 30: 29.97, 60: 59.94, 120: 119.88 };

export const BODIES = {
  a6700: {
    label: 'Sony A6700',
    mount: 'Sony E',
    sensor: { widthMm: 23.5, heightMm: 15.6, label: 'APS-C' },
    cropFactor: 1.53,
    iso: {
      movie: { min: 100, max: 32000, basis: 'sony-spec' },
      stills: { min: 50, max: 102400, basis: 'sony-spec' },
      note: 'Below ISO 100 Sony warns the recordable brightness range "may decrease". The available range also varies with the Gamma set under Picture Profile.',
      basis: 'sony-spec',
    },
    // Sony documents no base or dual-base ISO figure anywhere in the help
    // guide. The widely repeated 800/2500 pair has no primary source, so it
    // lives in gammas.js as `unverified` and its rule ships disabled.
    baseIso: null,
    formats: ['xavc-hs', 'xavc-s'],
    settingsExport: {
      humanReadable: false,
      note: 'Save/Load Settings writes an opaque binary file to the card, and there are three recall registers (M1-M3). Nothing readable comes off the camera, which is why notes are the interchange format here.',
      basis: 'sony-spec',
    },
  },
};

/** Rows available for a container + resolution. */
export function modesFor(container, res = '4k') {
  return FORMATS[container]?.modes[res] || [];
}

/** Does this exact container/res/fps/bitrate/chroma combination exist? */
export function isValidMode(container, res, fps, bitrate, chroma) {
  return modesFor(container, res).some(m =>
    m.fps.includes(fps) && m.bitrate === bitrate && m.chroma === chroma);
}

/** Every bitrate+chroma pairing offered at this frame rate. */
export function modesAtFps(container, res, fps) {
  return modesFor(container, res).filter(m => m.fps.includes(fps));
}

/** Frame rates this container offers at all, ascending. */
export function fpsFor(container, res = '4k') {
  const all = new Set();
  for (const m of modesFor(container, res)) for (const f of m.fps) all.add(f);
  return [...all].sort((a, b) => a - b);
}
