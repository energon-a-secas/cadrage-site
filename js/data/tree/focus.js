// ── Focus tab, transcribed ──────────────────────────────────
// Structure and row labels transcribed from the ILCE-6700 help guide
// (helpguide.sony.net/ilc/2320/v1/en, list of MENU items, read
// 2026-08-28). Rows the setup object models carry `ref`, the id of the
// live row in data/menu.js; rows without one render read-only in the
// camera view. `children` are rows that live inside a parent row's own
// screen on the body. Tab colours are null on purpose: the guide's art
// is grayscale and states no colours, so presentation colour is the
// view's approximation, not data.

export const FOCUS_TAB = {
  id: 'focus', label: 'Focus', colour: null,
  groups: [
    { id: 'af-mf', num: 1, label: 'AF/MF', items: [
      {
        id: 'focus-mode', label: 'Focus Mode', modes: 'both',
        ref: 'focus-mode',
        doc: 'When the camera may move focus: AF-S, AF-C, DMF, MF.',
      },
      {
        id: 'priority-set-in-af-s', label: 'Priority Set in AF-S', modes: 'still',
      },
      {
        id: 'priority-set-in-af-c', label: 'Priority Set in AF-C', modes: 'still',
      },
      {
        id: 'af-tracking-sensitivity', label: 'AF Tracking Sensitivity', modes: 'still',
      },
      {
        id: 'af-illuminator', label: 'AF Illuminator', modes: 'still',
      },
      {
        id: 'aperture-drive-in-af', label: 'Aperture Drive in AF', modes: 'still',
      },
      {
        id: 'af-w-shutter', label: 'AF w/ Shutter', modes: 'still',
      },
      {
        id: 'full-time-dmf', label: 'Full Time DMF', modes: 'still',
      },
      {
        id: 'pre-af', label: 'Pre-AF', modes: 'still',
      },
      {
        id: 'af-transition', label: 'AF Transition Speed', modes: 'movie',
        ref: 'af-transition',
        doc: '1 to 7. How fast a refocus travels once decided.',
      },
      {
        id: 'af-shift', label: 'AF Subj. Shift Sensitivity', modes: 'movie',
        ref: 'af-shift',
        doc: '1 to 5. How stubbornly focus stays on the current subject.',
      },
      {
        id: 'af-assist', label: 'AF Assist', modes: 'movie',
      },
    ] },
    { id: 'focus-area', num: 2, label: 'Focus Area', items: [
      {
        id: 'focus-area', label: 'Focus Area', modes: 'both',
        ref: 'focus-area',
        doc: 'Where it may look: Wide, Zone, Center Fix, a spot, Tracking.',
      },
      {
        id: 'focus-area-limit', label: 'Focus Area Limit', modes: 'both',
      },
      {
        id: 'switch-v-h-af-area', label: 'Switch V/H AF Area', modes: 'still',
      },
      {
        id: 'focus-area-color', label: 'Focus Area Color', modes: 'both',
      },
      {
        id: 'af-area-registration', label: 'AF Area Registration', modes: 'still',
      },
      {
        id: 'del-regist-af-area', label: 'Del. Regist. AF Area', modes: 'still',
      },
      {
        id: 'af-area-auto-clear', label: 'AF Area Auto Clear', modes: 'still',
      },
      {
        id: 'area-disp-dur-tracking', label: 'Area Disp. dur Tracking', modes: 'still',
      },
      {
        id: 'af-c-area-display', label: 'AF-C Area Display', modes: 'still',
      },
      {
        id: 'phase-detect-area', label: 'Phase Detect. Area', modes: 'still',
      },
      {
        id: 'circ-of-focus-point', label: 'Circ. of Focus Point', modes: 'both',
      },
      {
        id: 'af-frame-move-amt', label: 'AF Frame Move Amt', modes: 'both',
      },
    ] },
    { id: 'subject-recognition', num: 3, label: 'Subject Recognition', items: [
      {
        id: 'subject-recognition', label: 'Subject Recog in AF', modes: 'both',
        ref: 'subject-recognition',
        doc: 'Hands focus to a recognised subject inside the area. Target class matters: no people, no recognition.',
      },
      {
        id: 'recognition-target', label: 'Recognition Target', modes: 'both',
        doc: 'The class the classifier looks for: people, animals, birds, insects, vehicles.',
      },
      {
        id: 'recog-trgt-select-set', label: 'Recog Trgt Select Set', modes: 'both',
      },
      {
        id: 'right-left-eye-select', label: 'Right/Left Eye Select', modes: 'both',
      },
      {
        id: 'sbj-recog-frm-disp', label: 'Sbj Recog Frm Disp.', modes: 'still',
        note: 'Listed twice: a still-image row and a movie row, each with its own mode-prefix icon in the label',
      },
      {
        id: 'sbj-recog-frm-disp-movie', label: 'Sbj Recog Frm Disp.', modes: 'movie',
        note: 'Movie/S&Q row of the same item name',
      },
      {
        id: 'face-memory', label: 'Face Memory', modes: 'both',
      },
      {
        id: 'regist-face-priority', label: 'Regist. Face Priority', modes: 'both',
      },
    ] },
    { id: 'focus-assistant', num: 4, label: 'Focus Assistant', items: [
      {
        id: 'focus-map', label: 'Focus Map', modes: 'movie',
      },
      {
        id: 'auto-magnifier-in-mf', label: 'Auto Magnifier in MF', modes: 'still',
      },
      {
        id: 'focus-magnifier', label: 'Focus Magnifier', modes: 'both',
        doc: 'Punches into the live view at pixel level. The only aid that shows sharpness rather than a proxy.',
      },
      {
        id: 'focus-magnif-time', label: 'Focus Magnif. Time', modes: 'both',
      },
      {
        id: 'initial-focus-mag', label: 'Initial Focus Mag.', modes: 'still',
        note: 'Listed twice: a still-image row and a movie row, each with its own mode-prefix icon in the label',
      },
      {
        id: 'af-in-focus-mag', label: 'AF in Focus Mag.', modes: 'still',
      },
      {
        id: 'initial-focus-mag-movie', label: 'Initial Focus Mag.', modes: 'movie',
        note: 'Movie/S&Q row of the same item name',
      },
    ] },
    { id: 'peaking-display', num: 5, label: 'Peaking Display', items: [
      {
        id: 'peaking-display', label: 'Peaking Display', modes: 'both',
        doc: 'Outlines high-contrast edges. A manual-focus aid; autofocus does not read it.',
      },
      {
        id: 'peaking-level', label: 'Peaking Level', modes: 'both',
        doc: 'Sensitivity of the outline.',
      },
      {
        id: 'peaking-color', label: 'Peaking Color', modes: 'both',
        doc: 'Legibility only: pick what the scene is not.',
      },
    ] },
  ],
};
