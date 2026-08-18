// ── Gamma curves and Picture Profiles ────────────────────────
// Source: helpguide.sony.net/ilc/2320/v1/en/ — Picture Profile,
// Log Shooting Setting, ISO. Every row states its basis, because the
// most repeated number in this space (dual base ISO) has no primary source.

export const GAMMAS = {
  movie: { label: 'Movie', family: 'standard', basis: 'sony-spec',
    blurb: 'Standard gamma for movie recording.' },
  still: { label: 'Still', family: 'standard', basis: 'sony-spec',
    blurb: 'Standard gamma for still images.' },
  'cine1': { label: 'Cine1', family: 'cine', basis: 'sony-spec',
    blurb: 'Softens contrast in dark parts and emphasises tonal changes in bright parts. Gentle, filmic image.' },
  'cine2': { label: 'Cine2', family: 'cine', basis: 'sony-spec',
    blurb: 'Close to Cine1 but optimised for editing with up to 100% video signal.' },
  'cine3': { label: 'Cine3', family: 'cine', basis: 'sony-spec',
    blurb: 'Strengthens contrast between light and dark more than Cine1, and strengthens black gradation.' },
  'cine4': { label: 'Cine4', family: 'cine', basis: 'sony-spec',
    blurb: 'Strengthens the contrast in dark parts more than Cine3.' },
  'itu709': { label: 'ITU709', family: 'broadcast', basis: 'sony-spec',
    blurb: 'ITU709 gamma.' },
  'itu709-800': { label: 'ITU709(800%)', family: 'broadcast', basis: 'sony-spec',
    blurb: 'For checking scenes on the assumption of shooting with S-Log2 or S-Log3.' },
  'slog2': { label: 'S-Log2', family: 'log', basis: 'sony-spec',
    blurb: 'Log curve. Assumes grading in post; needs correct exposure to be worth using.' },
  'slog3': { label: 'S-Log3', family: 'log', basis: 'sony-spec',
    blurb: 'Log curve with characteristics closer to film. Assumes grading in post.' },
  'hlg': { label: 'HLG', family: 'hlg', basis: 'sony-spec',
    blurb: 'Hybrid Log-Gamma. HDR standard.' },
  'hlg1': { label: 'HLG1', family: 'hlg', basis: 'sony-spec',
    blurb: 'HLG with noise reduction priority. Narrower dynamic range than HLG2/HLG3.' },
  'hlg2': { label: 'HLG2', family: 'hlg', basis: 'sony-spec',
    blurb: 'HLG balancing dynamic range and noise.' },
  'hlg3': { label: 'HLG3', family: 'hlg', basis: 'sony-spec',
    blurb: 'HLG with dynamic range priority. More noise than HLG1/HLG2.' },
};

/**
 * Sony's documented preset assignments. Note PP6 is Cine2, not Cine4 —
 * setting Cine4 inside PP6 is legal, but it is an override of the preset
 * rather than what PP6 means. Nothing is documented for PP7-PP11, and
 * neither Cine4 nor S-Log3 is assigned to any numbered preset.
 */
export const PICTURE_PROFILES = {
  off: { label: 'Off', gamma: null, basis: 'sony-spec',
    blurb: 'No Picture Profile. Creative Look applies instead.' },
  pp1: { label: 'PP1', gamma: 'movie', basis: 'sony-spec',
    blurb: 'Example setting using [Movie] gamma.' },
  pp2: { label: 'PP2', gamma: 'still', basis: 'sony-spec',
    blurb: 'Example setting using [Still] gamma.' },
  pp3: { label: 'PP3', gamma: 'itu709', basis: 'sony-spec',
    blurb: 'Example setting with natural colour tone using [ITU709] gamma.' },
  pp4: { label: 'PP4', gamma: 'itu709', basis: 'sony-spec',
    blurb: 'Example setting with a colour tone faithful to the ITU709 standard.' },
  pp5: { label: 'PP5', gamma: 'cine1', basis: 'sony-spec',
    blurb: 'Example setting using [Cine1] gamma.' },
  pp6: { label: 'PP6', gamma: 'cine2', basis: 'sony-spec',
    blurb: 'Example setting using [Cine2] gamma.' },
  pp7: { label: 'PP7', gamma: null, basis: 'unverified',
    blurb: 'Sony does not document a preset gamma for PP7 on this body.' },
  pp8: { label: 'PP8', gamma: null, basis: 'unverified',
    blurb: 'Sony does not document a preset gamma for PP8 on this body.' },
  pp9: { label: 'PP9', gamma: null, basis: 'unverified',
    blurb: 'Sony does not document a preset gamma for PP9 on this body.' },
  pp10: { label: 'PP10', gamma: 'hlg2', basis: 'sony-spec',
    blurb: 'Example setting for HDR recording using [HLG2] gamma.' },
  pp11: { label: 'PP11', gamma: null, basis: 'unverified',
    blurb: 'Sony does not document a preset gamma for PP11 on this body.' },
};

/** Log Shooting is not a boolean — these are the documented values. */
export const LOG_MODES = {
  off: { label: 'Off', basis: 'sony-spec', blurb: 'Log shooting disabled.' },
  'on-flexible-iso': {
    label: 'On (Flexible ISO)', basis: 'sony-spec',
    blurb: 'Log recording with ISO adjustable to suit the scene. Forces Picture Profile to Off.',
  },
};

export const COLOR_GAMUTS = {
  'sgamut3-cine': { label: 'S-Gamut3.Cine', basis: 'sony-spec',
    blurb: 'Easier to grade toward a digital-cinema gamut than S-Gamut3.' },
  'sgamut3': { label: 'S-Gamut3', basis: 'sony-spec',
    blurb: 'Wider gamut. More grading latitude, more work.' },
};

/** Picture Profile parameter ranges, as documented. Used to validate input. */
export const PP_RANGES = {
  blackLevel: { min: -15, max: 15, label: 'Black Level' },
  blackGammaLevel: { min: -7, max: 7, label: 'Black Gamma Level' },
  kneeMaxPoint: { min: 90, max: 100, label: 'Knee Max Point', unit: '%' },
  kneePoint: { min: 75, max: 105, label: 'Knee Point', unit: '%' },
  kneeSlope: { min: -5, max: 5, label: 'Knee Slope' },
  saturation: { min: -32, max: 32, label: 'Saturation' },
  colorPhase: { min: -7, max: 7, label: 'Color Phase' },
  colorDepth: { min: -7, max: 7, label: 'Color Depth' },
  detailLevel: { min: -7, max: 7, label: 'Detail Level' },
  detailVhBalance: { min: -2, max: 2, label: 'V/H Balance' },
  detailLimit: { min: 0, max: 7, label: 'Detail Limit' },
  crispening: { min: 0, max: 7, label: 'Crispening' },
  hiLightDetail: { min: 0, max: 4, label: 'Hi-Light Detail' },
};

export const PP_ENUMS = {
  blackGammaRange: ['wide', 'middle', 'narrow'],
  kneeMode: ['auto', 'manual'],
  kneeSensitivity: ['high', 'mid', 'low'],
  colorMode: ['movie', 'still', 'cinema', 'pro', 'itu709-matrix', 'black-white', 'sgamut3-cine', 'sgamut3', 'bt2020', '709'],
  detailMode: ['auto', 'manual'],
  detailBwBalance: ['type1', 'type2', 'type3', 'type4', 'type5'],
  colorDepthChannels: ['r', 'g', 'b', 'c', 'm', 'y'],
};

export const COLOR_MODE_LABELS = {
  movie: 'Movie', still: 'Still', cinema: 'Cinema', pro: 'Pro',
  'itu709-matrix': 'ITU709 Matrix', 'black-white': 'Black & White',
  'sgamut3-cine': 'S-Gamut3.Cine', sgamut3: 'S-Gamut3',
  bt2020: 'BT.2020', '709': '709',
};

/**
 * Constraints Sony states explicitly. Each is a fact the lint engine reads
 * rather than a heuristic it infers.
 */
export const GAMMA_CONSTRAINTS = [
  {
    id: 'hlg-black-gamma-fixed',
    applies: g => GAMMAS[g]?.family === 'hlg',
    detail: 'Under HLG gammas, Black Gamma is fixed at 0 and cannot be adjusted.',
    basis: 'sony-spec',
  },
  {
    id: 'hlg-color-mode-limited',
    applies: g => GAMMAS[g]?.family === 'hlg',
    detail: 'Under HLG gammas, Color Mode is limited to BT.2020 or 709.',
    basis: 'sony-spec',
  },
];

/**
 * Base ISO. Sony documents NO figure — the ISO page says only that "the
 * available range for ISO sensitivity varies depending on the setting for
 * [Gamma] under [Picture Profile]". The 800/2500 pair circulates on forums
 * and in a widely shared screenshot, but there is no primary source, so it
 * is labelled and any rule reading it ships disabled.
 */
export const BASE_ISO_CLAIMS = {
  slog3: {
    claimed: [800, 2500],
    basis: 'unverified',
    note: 'A dual base of 800 and 2500 is widely repeated for this body under S-Log3. Sony publishes no base ISO figure at all. Treat it as a starting point for your own tests, not a fact.',
  },
  cine4: {
    claimed: [250, 400],
    basis: 'unverified',
    note: 'A "start at 250-400" figure for Cine4 appears in community write-ups. Sony publishes nothing. Your own exposure tests outrank this.',
  },
};

/** Does this Log mode force Picture Profile to Off? Documented, not inferred. */
export function logForcesPpOff(logMode) {
  return logMode === 'on-flexible-iso';
}

/** The gamma actually in effect, and whether it overrides the preset. */
export function effectiveGamma(colour) {
  const preset = PICTURE_PROFILES[colour.pictureProfile];
  if (colour.log === 'on-flexible-iso') {
    return { gamma: 'slog3', source: 'log', overridden: false };
  }
  if (!preset || !preset.gamma) {
    return { gamma: colour.gamma || null, source: 'manual', overridden: false };
  }
  if (colour.gamma && colour.gamma !== preset.gamma) {
    return { gamma: colour.gamma, source: 'override', overridden: true, presetGamma: preset.gamma };
  }
  return { gamma: preset.gamma, source: 'preset', overridden: false };
}
