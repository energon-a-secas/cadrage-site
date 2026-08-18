// ── Lenses ───────────────────────────────────────────────────
// Focal length, aperture range, minimum focus distance, and the
// behaviours that change how a lens should be configured.

export const LENSES = {
  'zeiss-55-1.8': {
    label: 'Zeiss T* FE 55mm f/1.8',
    mount: 'Sony E (full-frame)',
    focalMm: 55,
    apertureMin: 1.8,
    apertureMax: 22,
    mfdCm: 50,
    zoom: false,
    stabilised: false,
    basis: 'sony-spec',
    quirks: [
      { id: 'mfd-50', severity: 'note', basis: 'sony-spec',
        detail: 'Minimum focus distance is 50cm. Closer than that and it cannot focus at all, which sets how far back the subject has to sit.' },
    ],
  },
  'sony-15-1.4g': {
    label: 'Sony E 15mm f/1.4 G',
    mount: 'Sony E (APS-C)',
    focalMm: 15,
    apertureMin: 1.4,
    apertureMax: 16,
    mfdCm: 20,
    zoom: false,
    stabilised: false,
    basis: 'sony-spec',
    quirks: [
      { id: 'af-c-aperture-drift', severity: 'warn', basis: 'empirical-user',
        detail: 'With AF-C driving it, this lens has been observed changing aperture on its own, shifting exposure and colour mid-take. Locking exposure or dropping to AF-S removes the cause rather than limiting the symptom.' },
    ],
  },
  'sony-18-135': {
    label: 'Sony E 18-135mm f/3.5-5.6 OSS',
    mount: 'Sony E (APS-C)',
    focalMm: 18,
    focalMaxMm: 135,
    apertureMin: 3.5,
    apertureMax: 22,
    mfdCm: 45,
    zoom: true,
    stabilised: true,
    basis: 'sony-spec',
    quirks: [
      { id: 'variable-aperture', severity: 'note', basis: 'sony-spec',
        detail: 'Aperture narrows from f/3.5 to f/5.6 as you zoom in, so exposure shifts with focal length unless you set it at the long end.' },
    ],
  },
  other: {
    label: 'Other / not listed',
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

/** Full-frame equivalent focal length on the given body crop factor. */
export function equivalentFocal(lensId, cropFactor = 1.53) {
  const lens = LENSES[lensId];
  if (!lens) return null;
  // A full-frame lens on an APS-C body still gets cropped — the crop is the
  // sensor's, not the lens's, so this applies to both mounts.
  return Math.round(lens.focalMm * cropFactor);
}
