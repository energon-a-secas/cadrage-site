// ── Interactions ─────────────────────────────────────────────
// A rule says "this is wrong". This says something quieter and just as
// useful: of everything written down, which settings the camera is
// actually reading. A note listing forty settings where nine are ignored
// looks like a spec and behaves like a guess.
//
// Each row is data: a label, the value as the camera would show it, and a
// `status` that reads the config rather than assuming an answer.

import { PICTURE_PROFILES, GAMMAS, COLOR_MODE_LABELS, logForcesPpOff, effectiveGamma } from '../data/gammas.js';
import { LENSES } from '../data/lenses.js';
import { CHROMA_LABELS, FORMATS } from '../data/bodies.js';

export const STATES = {
  active: { label: 'In effect', weight: 3 },
  off: { label: 'Off', weight: 2 },
  ignored: { label: 'Ignored', weight: 1 },
  unknown: { label: 'Undocumented', weight: 0 },
};

const dash = 'n/a';
const num = v => (Number.isFinite(v) ? (v > 0 ? `+${v}` : String(v)) : dash);

export const SETTINGS = [
  // ── Format ───────────────────────────────────────────────
  {
    id: 'format', label: 'Record Setting', area: 'format', basis: 'sony-spec',
    value: c => `${FORMATS[c.format.container]?.label || c.format.container} ${String(c.format.res).toUpperCase()} ${c.format.fps}p ${c.format.bitrate}M ${CHROMA_LABELS[c.format.chroma] || c.format.chroma}`,
    status: () => ({ state: 'active' }),
  },
  {
    id: 'embed-lut', label: 'Embed LUT File', area: 'format', basis: 'sony-spec',
    value: c => (c.colour.embedLut ? 'On' : 'Off'),
    status: c => {
      if (!c.colour.embedLut) return { state: 'off' };
      if (c.format.card === 'sd' || c.format.card === 'sdhc') {
        return { state: 'ignored', why: 'Sony locks this to Off on SD and SDHC cards.' };
      }
      if (!logForcesPpOff(c.colour.log)) {
        return { state: 'ignored', why: 'There is no Log footage to embed a LUT into.' };
      }
      return { state: 'active' };
    },
  },

  // ── Exposure ─────────────────────────────────────────────
  {
    id: 'iso', label: 'ISO', area: 'exposure', basis: 'sony-spec',
    value: c => (c.exposure.iso.mode === 'auto'
      ? `Auto ${c.exposure.iso.min ?? '?'}-${c.exposure.iso.max ?? '?'}`
      : `${c.exposure.iso.value ?? dash}`),
    status: c => (c.exposure.iso.mode === 'auto'
      ? { state: 'active', why: 'The camera picks a value per moment, so it is in effect but not fixed.' }
      : { state: 'active' }),
  },
  {
    id: 'shutter', label: 'Shutter speed', area: 'exposure', basis: 'sony-spec',
    value: c => (c.exposure.shutter.denom ? `1/${c.exposure.shutter.denom}` : 'Auto'),
    status: c => (c.exposure.shutter.mode === 'manual' && c.exposure.shutter.denom
      ? { state: 'active' }
      : { state: 'active', why: 'Recorded as a value but left on auto, so the camera is free to use another.' }),
  },
  {
    id: 'auto-slow-shutter', label: 'Auto Slow Shutter', area: 'exposure', basis: 'sony-spec',
    value: c => (c.exposure.autoSlowShutter ? 'On' : 'Off'),
    status: c => (c.exposure.autoSlowShutter
      ? { state: 'active', why: 'Can lengthen exposure in dim light, overriding the chosen shutter speed.' }
      : { state: 'off' }),
  },

  // ── Flicker ──────────────────────────────────────────────
  {
    id: 'var-shutter', label: 'Var. Shutter', area: 'flicker', basis: 'sony-spec',
    value: c => (c.flicker.varShutter ? 'On' : 'Off'),
    status: c => {
      const manual = c.exposure.shutter.mode === 'manual' && !!c.exposure.shutter.denom;
      if (!manual) return { state: 'ignored', why: 'Selectable only in S or M, with the shutter speed set by hand.' };
      return c.flicker.varShutter ? { state: 'active' } : { state: 'off' };
    },
  },
  {
    id: 'anti-flicker', label: 'Anti-flicker Shoot.', area: 'flicker', basis: 'sony-spec',
    value: c => (c.flicker.antiFlicker ? 'On' : 'Off'),
    status: c => (c.flicker.antiFlicker
      ? { state: 'ignored', why: 'A stills feature. Sony lists it as unavailable in movie shooting mode.' }
      : { state: 'off' }),
  },

  // ── Colour ───────────────────────────────────────────────
  {
    id: 'log', label: 'Log Shooting', area: 'colour', basis: 'sony-spec',
    value: c => (logForcesPpOff(c.colour.log) ? 'On (Flexible ISO)' : 'Off'),
    status: c => (logForcesPpOff(c.colour.log) ? { state: 'active' } : { state: 'off' }),
  },
  {
    id: 'picture-profile', label: 'Picture Profile', area: 'colour', basis: 'sony-spec',
    value: c => PICTURE_PROFILES[c.colour.pictureProfile]?.label || dash,
    status: c => {
      if (logForcesPpOff(c.colour.log)) {
        return { state: 'ignored', why: 'Log Shooting fixes Picture Profile to Off, and everything under it with it.' };
      }
      return c.colour.pictureProfile && c.colour.pictureProfile !== 'off'
        ? { state: 'active' }
        : { state: 'off' };
    },
  },
  {
    id: 'gamma', label: 'Gamma', area: 'colour', basis: 'sony-spec',
    value: c => {
      const eff = effectiveGamma(c.colour);
      return GAMMAS[eff.gamma]?.label || dash;
    },
    status: c => {
      const eff = effectiveGamma(c.colour);
      if (!eff.gamma) return { state: 'off' };
      if (eff.source === 'log') return { state: 'active', why: 'Set by the Log pipeline rather than a Picture Profile.' };
      if (eff.overridden) {
        return { state: 'active', why: `Overrides ${PICTURE_PROFILES[c.colour.pictureProfile]?.label}'s documented ${GAMMAS[eff.presetGamma]?.label}.` };
      }
      return { state: 'active' };
    },
  },
  {
    id: 'creative-look', label: 'Creative Look', area: 'colour', basis: 'unverified',
    value: c => (c.colour.creativeLook && c.colour.creativeLook !== 'off' ? String(c.colour.creativeLook).toUpperCase() : 'Off'),
    status: c => {
      if (!c.colour.creativeLook || c.colour.creativeLook === 'off') return { state: 'off' };
      const ppOn = !logForcesPpOff(c.colour.log) && c.colour.pictureProfile && c.colour.pictureProfile !== 'off';
      if (ppOn) {
        return { state: 'unknown', why: 'Sony does not document how Creative Look and an active Picture Profile combine on this body. Test it rather than trusting either answer.' };
      }
      return { state: 'active' };
    },
  },
  {
    id: 'lut', label: 'Select LUT', area: 'colour', basis: 'sony-spec',
    value: c => (c.colour.lut ? (GAMMAS[c.colour.lut]?.label || c.colour.lut) : dash),
    status: c => {
      if (!c.colour.lut) return { state: 'off' };
      return logForcesPpOff(c.colour.log)
        ? { state: 'active' }
        : { state: 'ignored', why: 'LUT selection belongs to the Log pipeline, which is off.' };
    },
  },
  {
    id: 'wb', label: 'White balance', area: 'colour', basis: 'sony-spec',
    value: c => {
      const wb = c.colour.wb;
      if (wb.mode === 'auto') return 'Auto';
      if (wb.mode === 'custom-k') return `${wb.kelvin ?? '?'}K`;
      if (String(wb.mode).startsWith('custom')) return `Custom ${String(wb.mode).replace('custom-', '')}`;
      return wb.preset || wb.mode || dash;
    },
    status: () => ({ state: 'active' }),
  },
  {
    id: 'wb-shift', label: 'WB shift G-M / A-B', area: 'colour', basis: 'sony-spec',
    value: c => `${num(c.colour.wb.gm)} / ${num(c.colour.wb.ab)}`,
    status: c => ((c.colour.wb.gm || c.colour.wb.ab) ? { state: 'active' } : { state: 'off' }),
  },
  {
    id: 'awb-priority', label: 'Priority Set in AWB', area: 'colour', basis: 'sony-spec',
    value: c => c.colour.wb.awbPriority || dash,
    status: c => {
      if (!c.colour.wb.awbPriority || c.colour.wb.awbPriority === 'standard') return { state: 'off' };
      return c.colour.wb.mode === 'auto'
        ? { state: 'active' }
        : { state: 'ignored', why: 'Only steers automatic white balance, and this setup measures it manually.' };
    },
  },
  {
    id: 'pp-saturation', label: 'PP Saturation', area: 'colour', basis: 'sony-spec',
    value: c => num(c.colour.pp?.saturation),
    status: c => ppParam(c, c.colour.pp?.saturation),
  },
  {
    id: 'pp-black-gamma', label: 'PP Black Gamma', area: 'colour', basis: 'sony-spec',
    value: c => {
      const bg = c.colour.pp?.blackGamma;
      if (!bg || !Number.isFinite(bg.level)) return dash;
      return `${bg.range || '?'} ${num(bg.level)}`;
    },
    status: c => {
      const bg = c.colour.pp?.blackGamma;
      const base = ppParam(c, bg?.level);
      if (base.state !== 'active') return base;
      const eff = effectiveGamma(c.colour);
      if (GAMMAS[eff.gamma]?.family === 'hlg') {
        return { state: 'ignored', why: 'Under an HLG gamma, Sony fixes Black Gamma at 0.' };
      }
      return base;
    },
  },
  {
    id: 'pp-color-mode', label: 'PP Color Mode', area: 'colour', basis: 'sony-spec',
    value: c => COLOR_MODE_LABELS[c.colour.pp?.colorMode] || dash,
    status: c => (c.colour.pp?.colorMode ? ppParam(c, 1) : { state: 'off' }),
  },
  {
    id: 'pp-detail', label: 'PP Detail Level', area: 'colour', basis: 'sony-spec',
    value: c => num(c.colour.pp?.detail?.level),
    status: c => ppParam(c, c.colour.pp?.detail?.level),
  },

  // ── Focus ────────────────────────────────────────────────
  {
    id: 'focus-mode', label: 'Focus Mode', area: 'focus', basis: 'sony-spec',
    value: c => String(c.focus.mode || dash).toUpperCase(),
    status: () => ({ state: 'active' }),
  },
  {
    id: 'focus-area', label: 'Focus Area', area: 'focus', basis: 'sony-spec',
    value: c => c.focus.area || dash,
    status: c => (c.focus.mode === 'mf'
      ? { state: 'ignored', why: 'Manual focus, so the camera never uses the area.' }
      : { state: 'active' }),
  },
  {
    id: 'af-transition', label: 'AF Transition Speed', area: 'focus', basis: 'sony-spec',
    value: c => (Number.isFinite(c.focus.transitionSpeed) ? String(c.focus.transitionSpeed) : dash),
    status: c => (c.focus.mode === 'af-c'
      ? { state: 'active' }
      : { state: 'ignored', why: 'Governs how continuous AF moves between subjects, which needs AF-C.' }),
  },
  {
    id: 'af-shift', label: 'AF Subj. Shift Sens.', area: 'focus', basis: 'sony-spec',
    value: c => (Number.isFinite(c.focus.shiftSensitivity) ? String(c.focus.shiftSensitivity) : dash),
    status: c => (c.focus.mode === 'af-c'
      ? { state: 'active' }
      : { state: 'ignored', why: 'Only applies while continuous AF is deciding whether to switch subject.' }),
  },
  {
    id: 'peaking', label: 'Peaking Display', area: 'focus', basis: 'industry-convention',
    value: c => (c.focus.peaking?.on ? `On (${c.focus.peaking.level || 'mid'})` : 'Off'),
    status: c => {
      if (!c.focus.peaking?.on) return { state: 'off' };
      return (c.focus.mode === 'mf' || c.focus.mode === 'dmf')
        ? { state: 'active' }
        : { state: 'ignored', why: 'A manual-focus aid. The camera is focusing itself.' };
    },
  },

  // ── Rig ──────────────────────────────────────────────────
  {
    id: 'steadyshot', label: 'SteadyShot', area: 'focus', basis: 'industry-convention',
    value: c => (c.stabilisation.steadyShot ? 'On' : 'Off'),
    status: c => {
      if (!c.stabilisation.steadyShot) return { state: 'off' };
      return c.stabilisation.tripod
        ? { state: 'ignored', why: 'Correcting movement a tripod already removed, at the cost of a slight crop.' }
        : { state: 'active' };
    },
  },
  {
    id: 'zebra', label: 'Zebra Display', area: 'exposure', basis: 'sony-spec',
    value: c => (c.monitoring.zebra?.on ? `On, level ${c.monitoring.zebra.level}` : 'Off'),
    status: c => (c.monitoring.zebra?.on ? { state: 'active' } : { state: 'off' }),
  },
];

/** A Picture Profile parameter is only read when a profile is actually active. */
function ppParam(c, value) {
  if (!Number.isFinite(value) || value === 0) {
    return Number.isFinite(value) ? { state: 'off', why: 'At its neutral value.' } : { state: 'off' };
  }
  if (logForcesPpOff(c.colour.log)) {
    return { state: 'ignored', why: 'Log Shooting forces Picture Profile off, so every parameter under it is unread.' };
  }
  if (!c.colour.pictureProfile || c.colour.pictureProfile === 'off') {
    return { state: 'ignored', why: 'No Picture Profile is selected, so its parameters do nothing.' };
  }
  return { state: 'active' };
}

/**
 * Resolve every setting against a config.
 * @returns {{rows: Array, byState: Object, ignoredCount: number}}
 */
export function interactions(config) {
  const rows = SETTINGS.map(s => {
    let value = dash;
    let status = { state: 'unknown', why: 'Could not be resolved.' };
    try { value = s.value(config); } catch { /* keep the dash */ }
    try { status = s.status(config); } catch { /* keep unknown */ }
    return {
      id: s.id, label: s.label, area: s.area, basis: s.basis,
      value, state: status.state, why: status.why || '',
      stateLabel: STATES[status.state]?.label || status.state,
    };
  });

  const byState = {};
  for (const row of rows) (byState[row.state] ||= []).push(row);

  return {
    rows,
    byState,
    ignoredCount: (byState.ignored || []).length,
    unknownCount: (byState.unknown || []).length,
  };
}

/** Lens label for a config, or the raw id when it is not in the table. */
export function lensLabel(config) {
  return LENSES[config.lens?.id]?.label || config.lens?.id || 'unknown lens';
}
