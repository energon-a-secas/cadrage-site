// ── A6700 menu tree ──────────────────────────────────────────
// Tabs, groups and item names follow the camera's own menu (Movie mode),
// because the point of this view is that a finding can point at the row
// you would scroll to on the body itself.
//
// Each item declares:
//   label    the row title as Sony prints it
//   value    how the camera would show the current setting
//   controls the writable fields, each carrying the same `data-path` the
//            quick editor and the fix buttons write, so events.js needs
//            nothing new
//   sid      the interactions row that reports whether the camera is
//            actually reading this setting
//   rules    findings pinned to this row
//   note     a camera-faithful aside, where the menu itself is misleading
//
// Room, lens and post fields deliberately have no rows: they exist in no
// camera menu, and pretending otherwise is how notes drift from reality.

import { FORMATS, CHROMA_LABELS, fpsFor, modesAtFps } from './bodies.js';
import { LOG_MODES, PICTURE_PROFILES, GAMMAS, COLOR_MODE_LABELS } from './gammas.js';
import { SHUTTER_STEPS } from '../engine/calc.js';

const onOff = v => (v ? 'On' : 'Off');
const signed = v => (Number.isFinite(v) ? (v > 0 ? `+${v}` : String(v)) : 'n/a');

const FOCUS_MODES = [
  { value: 'af-s', label: 'AF-S' },
  { value: 'af-c', label: 'AF-C' },
  { value: 'dmf', label: 'DMF' },
  { value: 'mf', label: 'MF' },
];

const FOCUS_AREAS = [
  { value: 'wide', label: 'Wide' },
  { value: 'zone', label: 'Zone' },
  { value: 'center', label: 'Center Fix' },
  { value: 'flexible-spot', label: 'Flexible Spot' },
  { value: 'tracking', label: 'Tracking' },
];

const CREATIVE_LOOKS = ['off', 'ST', 'PT', 'VV', 'VV2', 'FL', 'IN', 'SH', 'BW', 'SE']
  .map(v => ({ value: v, label: v === 'off' ? 'Off' : v }));

const WB_MODES = [
  { value: 'auto', label: 'AWB' },
  { value: 'custom-k', label: 'C.Temp/Filter' },
  { value: 'custom-1', label: 'Custom 1' },
  { value: 'custom-2', label: 'Custom 2' },
  { value: 'custom-3', label: 'Custom 3' },
];

const AWB_PRIORITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'ambience', label: 'Ambience' },
  { value: 'white', label: 'White' },
];

const sel = (path, options, extra = {}) => ({ path, kind: 'select', options, ...extra });
const num = (path, min, max, step = 1, extra = {}) => ({ path, kind: 'number', min, max, step, ...extra });
const tgl = (path, extra = {}) => ({ path, kind: 'bool', ...extra });

function shutterOptions(c) {
  const steps = SHUTTER_STEPS.map(d => ({ value: d, label: `1/${d}` }));
  if (c.exposure.shutter.denom && !SHUTTER_STEPS.includes(c.exposure.shutter.denom)) {
    steps.push({ value: c.exposure.shutter.denom, label: `1/${c.exposure.shutter.denom} (not a standard step)` });
  }
  return [{ value: '', label: 'not recorded' }, ...steps];
}

export const MENU = [
  {
    id: 'shooting', label: 'Shooting',
    groups: [
      {
        id: 'iq-rec', label: 'Image Quality/Rec',
        items: [
          {
            id: 'file-format', label: 'File Format',
            value: c => FORMATS[c.format.container]?.label || c.format.container,
            controls: [sel('format.container', Object.entries(FORMATS).map(([id, f]) => ({ value: id, label: `${f.label} (${f.codec})` })))],
            sid: 'format',
            rules: ['format/invalid-combination'],
          },
          {
            id: 'frame-rate', label: 'Frame Rate',
            value: c => `${c.format.fps}p`,
            controls: [{ ...sel('format.fps', []), options: c => fpsFor(c.format.container, c.format.res).map(f => ({ value: f, label: `${f}p` })) }],
            sid: 'format',
            rules: ['format/invalid-combination'],
            note: 'The rates on offer depend on the File Format above, exactly as on the body.',
          },
          {
            id: 'record-setting', label: 'Record Setting',
            value: c => `${c.format.bitrate}M ${CHROMA_LABELS[c.format.chroma] || c.format.chroma}`,
            controls: [
              {
                ...sel('format.bitrate', []),
                options: c => [...new Set(modesAtFps(c.format.container, c.format.res, c.format.fps).map(m => m.bitrate))]
                  .map(b => ({ value: b, label: `${b}M` })),
              },
              {
                ...sel('format.chroma', []),
                options: c => [...new Set(modesAtFps(c.format.container, c.format.res, c.format.fps).map(m => m.chroma))]
                  .map(ch => ({ value: ch, label: CHROMA_LABELS[ch] || ch })),
              },
            ],
            sid: 'format',
            rules: ['format/invalid-combination'],
            note: 'XAVC HS has no 8-bit rows at all, and no 4K 30p. An impossible combination is named as one rather than silently kept.',
          },
        ],
      },
      {
        id: 'stabilisation', label: 'Image Stabilization',
        items: [
          {
            id: 'steadyshot', label: 'SteadyShot',
            value: c => onOff(c.stabilisation.steadyShot),
            controls: [tgl('stabilisation.steadyShot')],
            sid: 'steadyshot',
            rules: ['inert/steadyshot-on-tripod'],
          },
        ],
      },
      {
        id: 'shutter-silent', label: 'Shutter/Silent',
        items: [
          {
            id: 'anti-flicker', label: 'Anti-flicker Set.',
            value: c => onOff(c.flicker.antiFlicker),
            controls: [tgl('flicker.antiFlicker')],
            sid: 'anti-flicker',
            rules: ['flicker/anti-flicker-is-stills-only'],
            note: 'Sony lists this as unavailable in movie shooting mode. It is a stills feature wearing a movie-adjacent name.',
          },
        ],
      },
    ],
  },
  {
    id: 'exposure-color', label: 'Exposure/Color',
    groups: [
      {
        id: 'exposure', label: 'Exposure',
        items: [
          {
            id: 'shutter-speed', label: 'Shutter Speed',
            value: c => (c.exposure.shutter.mode === 'manual' && c.exposure.shutter.denom ? `1/${c.exposure.shutter.denom}` : 'Auto'),
            controls: [
              sel('exposure.shutter.mode', [
                { value: 'manual', label: 'Manual (S or M)' },
                { value: 'auto', label: 'Auto' },
              ]),
              { ...sel('exposure.shutter.denom', []), options: shutterOptions },
            ],
            sid: 'shutter',
            rules: ['flicker/shutter-vs-mains', 'flicker/shutter-not-selectable', 'flicker/var-shutter-needs-manual-shutter'],
            note: 'A dial on the body, not a menu page. It lives here because every flicker answer reads it.',
          },
          {
            id: 'aperture', label: 'Aperture',
            value: c => (Number.isFinite(c.lens.aperture) ? `f/${c.lens.aperture}` : 'n/a'),
            controls: [num('lens.aperture', 1.0, 22, 0.1)],
            rules: ['focus/dof-narrower-than-subject'],
            note: 'A ring or dial on the body. It lives here because depth of field reads it, and the Main screen shows it as a tile.',
          },
          {
            id: 'iso', label: 'ISO',
            value: c => (c.exposure.iso.mode === 'auto'
              ? `Auto ${c.exposure.iso.min ?? '?'}-${c.exposure.iso.max ?? '?'}`
              : String(c.exposure.iso.value ?? 'n/a')),
            controls: [
              sel('exposure.iso.mode', [
                { value: 'manual', label: 'Manual' },
                { value: 'auto', label: 'Auto' },
              ]),
              num('exposure.iso.value', 100, 32000, 50),
            ],
            sid: 'iso',
            rules: ['exposure/iso-auto-range-drift', 'exposure/dual-gain-dead-zone'],
          },
          {
            id: 'iso-range', label: 'ISO Range Limit',
            value: c => (Number.isFinite(c.exposure.iso.min) && Number.isFinite(c.exposure.iso.max)
              ? `${c.exposure.iso.min} to ${c.exposure.iso.max}` : 'not set'),
            controls: [
              num('exposure.iso.min', 100, 32000, 50),
              num('exposure.iso.max', 100, 32000, 50),
            ],
            sid: 'iso',
            rules: ['exposure/iso-auto-range-drift'],
          },
          {
            id: 'exposure-comp', label: 'Exposure Comp.',
            value: c => (Number.isFinite(c.exposure.ev) && c.exposure.ev !== 0 ? `${c.exposure.ev > 0 ? '+' : ''}${c.exposure.ev} EV` : '0 EV'),
            controls: [num('exposure.ev', -5, 5, 0.1)],
            rules: [],
            note: 'Moves the automatic modes\' target. In full manual it does nothing unless ISO is on Auto.',
          },
          {
            id: 'var-shutter', label: 'Var. Shutter',
            value: c => onOff(c.flicker.varShutter),
            controls: [tgl('flicker.varShutter')],
            sid: 'var-shutter',
            rules: ['flicker/var-shutter-off-with-flicker-risk', 'flicker/var-shutter-needs-manual-shutter'],
            note: 'The only anti-flicker feature Sony documents for movies. Selectable only in S or M with the shutter set by hand.',
          },
          {
            id: 'auto-slow-shut', label: 'Auto Slow Shut.',
            value: c => onOff(c.exposure.autoSlowShutter),
            controls: [tgl('exposure.autoSlowShutter')],
            sid: 'auto-slow-shutter',
            rules: ['exposure/auto-slow-shutter-on'],
          },
        ],
      },
      {
        id: 'zebra', label: 'Zebra Display',
        items: [
          {
            id: 'zebra-display', label: 'Zebra Display',
            value: c => onOff(c.monitoring.zebra?.on),
            controls: [tgl('monitoring.zebra.on')],
            sid: 'zebra',
            rules: [],
          },
          {
            id: 'zebra-level', label: 'Zebra Level',
            value: c => String(c.monitoring.zebra?.level ?? 'n/a'),
            controls: [num('monitoring.zebra.level', 60, 109)],
            sid: 'zebra',
            rules: [],
          },
        ],
      },
      {
        id: 'color-tone', label: 'Color/Tone',
        items: [
          {
            id: 'log', label: 'Log Shooting',
            value: c => LOG_MODES[c.colour.log]?.label || c.colour.log,
            controls: [sel('colour.log', Object.entries(LOG_MODES).map(([id, m]) => ({ value: id, label: m.label })))],
            sid: 'log',
            rules: ['colour/log-excludes-picture-profile', 'colour/log-breaks-custom-wb'],
            note: 'On (Flexible ISO) fixes Picture Profile to Off. Sony says so; it is not a suggestion.',
          },
          {
            id: 'picture-profile', label: 'Picture Profile',
            value: c => PICTURE_PROFILES[c.colour.pictureProfile]?.label || 'Off',
            controls: [sel('colour.pictureProfile', Object.entries(PICTURE_PROFILES).map(([id, p]) => ({ value: id, label: p.label })))],
            sid: 'picture-profile',
            rules: ['colour/log-excludes-picture-profile', 'colour/pp-gamma-override'],
          },
          {
            id: 'select-lut', label: 'Select LUT',
            value: c => (c.colour.lut ? (GAMMAS[c.colour.lut]?.label || c.colour.lut) : 'none'),
            controls: [sel('colour.lut', [
              { value: '', label: 'none' },
              { value: 'itu709', label: 'ITU709' },
              { value: 'itu709-800', label: 'ITU709(800%)' },
              { value: 'slog3', label: 'S-Log3' },
              { value: 'user1', label: 'User LUT 1' },
            ])],
            sid: 'lut',
            rules: ['inert/lut-without-log'],
          },
          {
            id: 'wb', label: 'White Balance',
            value: c => {
              const wb = c.colour.wb;
              if (wb.mode === 'auto') return 'AWB';
              if (wb.mode === 'custom-k') return `${wb.kelvin ?? '?'}K`;
              return WB_MODES.find(m => m.value === wb.mode)?.label || wb.mode;
            },
            controls: [sel('colour.wb.mode', WB_MODES)],
            sid: 'wb',
            rules: ['colour/wb-compensates-for-backdrop', 'colour/log-breaks-custom-wb'],
          },
          {
            id: 'color-temp', label: 'Color Temp/Filter',
            value: c => `${c.colour.wb.kelvin ?? '?'}K, G-M ${signed(c.colour.wb.gm)}, A-B ${signed(c.colour.wb.ab)}`,
            controls: [
              num('colour.wb.kelvin', 2500, 9900, 100),
              num('colour.wb.gm', -7, 7),
              num('colour.wb.ab', -7, 7),
            ],
            sid: 'wb-shift',
            rules: ['colour/wb-compensates-for-backdrop'],
            note: 'A magenta shift here corrects the subject for a backdrop problem. The camera cannot tell the difference; the finding can.',
          },
          {
            id: 'awb-priority', label: 'Priority Set in AWB',
            value: c => AWB_PRIORITIES.find(p => p.value === c.colour.wb.awbPriority)?.label || c.colour.wb.awbPriority,
            controls: [sel('colour.wb.awbPriority', AWB_PRIORITIES)],
            sid: 'awb-priority',
            rules: ['inert/awb-priority-with-manual-wb'],
          },
          {
            id: 'creative-look', label: 'Creative Look',
            value: c => (c.colour.creativeLook && c.colour.creativeLook !== 'off' ? c.colour.creativeLook : 'Off'),
            controls: [sel('colour.creativeLook', CREATIVE_LOOKS)],
            sid: 'creative-look',
            rules: [],
            note: 'Sony does not document how this combines with an active Picture Profile on this body. If both are on, the interaction table says so plainly.',
          },
        ],
      },
      {
        id: 'pp-params', label: 'Picture Profile params',
        items: [
          {
            id: 'pp-gamma', label: 'Gamma',
            value: c => (c.colour.gamma ? GAMMAS[c.colour.gamma]?.label : 'as the profile sets it'),
            controls: [sel('colour.gamma', [
              { value: '', label: 'as the profile sets it' },
              ...Object.entries(GAMMAS).map(([id, g]) => ({ value: id, label: g.label })),
            ])],
            sid: 'gamma',
            rules: ['colour/pp-gamma-override'],
            note: 'PP6 is Cine2. Setting Cine4 inside it is legal, but it is an override of the preset rather than what PP6 means.',
          },
          {
            id: 'pp-black-gamma', label: 'Black Gamma',
            value: c => {
              const bg = c.colour.pp?.blackGamma;
              return bg && Number.isFinite(bg.level) ? `${bg.range || '?'} ${signed(bg.level)}` : 'n/a';
            },
            controls: [num('colour.pp.blackGamma.level', -7, 7)],
            sid: 'pp-black-gamma',
            rules: [],
          },
          {
            id: 'pp-saturation', label: 'Saturation',
            value: c => signed(c.colour.pp?.saturation),
            controls: [num('colour.pp.saturation', -32, 32)],
            sid: 'pp-saturation',
            rules: ['colour/stacked-correction'],
          },
          {
            id: 'pp-color-mode', label: 'Color Mode',
            value: c => COLOR_MODE_LABELS[c.colour.pp?.colorMode] || 'n/a',
            controls: [sel('colour.pp.colorMode', Object.entries(COLOR_MODE_LABELS).map(([id, label]) => ({ value: id, label })))],
            sid: 'pp-color-mode',
            rules: [],
          },
          {
            id: 'pp-detail', label: 'Detail Level',
            value: c => signed(c.colour.pp?.detail?.level),
            controls: [num('colour.pp.detail.level', -7, 7)],
            sid: 'pp-detail',
            rules: [],
          },
        ],
      },
    ],
  },
  {
    id: 'focus', label: 'Focus',
    groups: [
      {
        id: 'af-mf', label: 'AF/MF',
        items: [
          {
            id: 'focus-mode', label: 'Focus Mode',
            value: c => String(c.focus.mode || '').toUpperCase(),
            controls: [sel('focus.mode', FOCUS_MODES)],
            sid: 'focus-mode',
            rules: ['focus/af-c-on-tripod'],
          },
          {
            id: 'focus-area', label: 'Focus Area',
            value: c => FOCUS_AREAS.find(a => a.value === c.focus.area)?.label || c.focus.area,
            controls: [sel('focus.area', FOCUS_AREAS)],
            sid: 'focus-area',
            rules: [],
          },
          {
            id: 'subject-recognition', label: 'Subject Recog in AF',
            value: c => onOff(c.focus.subjectRecognition),
            controls: [tgl('focus.subjectRecognition')],
            rules: [],
          },
          {
            id: 'af-transition', label: 'AF Transition Speed',
            value: c => (Number.isFinite(c.focus.transitionSpeed) ? `${c.focus.transitionSpeed} of 7` : 'n/a'),
            controls: [num('focus.transitionSpeed', 1, 7)],
            sid: 'af-transition',
            rules: [],
          },
          {
            id: 'af-shift', label: 'AF Subj. Shift Sens.',
            value: c => (Number.isFinite(c.focus.shiftSensitivity) ? `${c.focus.shiftSensitivity} of 5` : 'n/a'),
            controls: [num('focus.shiftSensitivity', 1, 5)],
            sid: 'af-shift',
            rules: [],
          },
        ],
      },
      {
        id: 'peaking', label: 'Peaking',
        items: [
          {
            id: 'peaking-display', label: 'Peaking Display',
            value: c => onOff(c.focus.peaking?.on),
            controls: [tgl('focus.peaking.on')],
            sid: 'peaking',
            rules: ['inert/peaking-during-record'],
          },
          {
            id: 'peaking-level', label: 'Peaking Level',
            value: c => c.focus.peaking?.level || 'mid',
            controls: [sel('focus.peaking.level', [
              { value: 'low', label: 'Low' },
              { value: 'mid', label: 'Mid' },
              { value: 'high', label: 'High' },
            ])],
            sid: 'peaking',
            rules: [],
          },
          {
            id: 'peaking-color', label: 'Peaking Color',
            value: c => c.focus.peaking?.colour || 'white',
            controls: [sel('focus.peaking.colour', ['white', 'red', 'yellow', 'blue'].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })))],
            sid: 'peaking',
            rules: [],
          },
        ],
      },
    ],
  },
];

/** Every item, flat, for lookups by rule id. */
export const MENU_ITEMS = MENU.flatMap(t => t.groups.flatMap(g => g.items));

/** Menu items a finding pins to, by rule id. */
export function itemsForRule(ruleId) {
  return MENU_ITEMS.filter(item => item.rules.includes(ruleId));
}
