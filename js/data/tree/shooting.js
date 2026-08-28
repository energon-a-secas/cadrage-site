// ── Shooting tab, transcribed ──────────────────────────────────
// Structure and row labels transcribed from the ILCE-6700 help guide
// (helpguide.sony.net/ilc/2320/v1/en, list of MENU items, read
// 2026-08-28). Rows the setup object models carry `ref`, the id of the
// live row in data/menu.js; rows without one render read-only in the
// camera view. `children` are rows that live inside a parent row's own
// screen on the body. Tab colours are null on purpose: the guide's art
// is grayscale and states no colours, so presentation colour is the
// view's approximation, not data.

export const SHOOTING_TAB = {
  id: 'shooting', label: 'Shooting', colour: null,
  groups: [
    { id: 'image-quality-rec', num: 1, label: 'Image Quality/Rec', items: [
      {
        id: 'jpeg-heif-switch', label: 'JPEG/HEIF Switch', modes: 'still',
      },
      {
        id: 'still-file-format', label: 'File Format', modes: 'still',
        doc: 'File format for stills: RAW, JPEG, HEIF, or RAW plus one of them. The setup object models a video shoot, so this row is documentation only.',
        note: 'Printed with the still-image icon prefix; the guide\'s TOC renders it as "File Format (still image)". Distinct from the movie File Format later in this group.',
      },
      {
        id: 'raw-file-type', label: 'RAW File Type', modes: 'still',
      },
      {
        id: 'jpeg-quality', label: 'JPEG Quality', modes: 'still',
      },
      {
        id: 'heif-quality', label: 'HEIF Quality', modes: 'still',
      },
      {
        id: 'jpeg-image-size', label: 'JPEG Image Size', modes: 'still',
      },
      {
        id: 'heif-image-size', label: 'HEIF Image Size', modes: 'still',
      },
      {
        id: 'aspect-ratio', label: 'Aspect Ratio', modes: 'still',
      },
      {
        id: 'file-format', label: 'File Format', modes: 'both',
        ref: 'file-format',
        doc: 'The movie container. XAVC HS is HEVC and always 10-bit; XAVC S is AVC with wider editor support.',
        note: 'Printed with the movie icon prefix; TOC renders it as "File Format (movie)". Row is marked with the still/movie/S&Q icon, so it is displayed in every dial position.',
      },
      {
        id: 'movie-settings', label: 'Movie Settings', modes: 'both',
        doc: 'Opens the screen holding Rec Frame Rate and Record Setting, exactly as the body nests them.',
        note: 'Printed with the movie icon prefix; TOC renders it as "Movie Settings (movie)". Row marked still/movie/S&Q.',
        children: [
          {
            id: 'frame-rate', label: 'Rec Frame Rate', modes: 'movie',
            ref: 'frame-rate',
            doc: 'Frame rates on offer depend on the File Format, exactly as on the body.',
          },
          {
            id: 'record-setting', label: 'Record Setting', modes: 'movie',
            ref: 'record-setting',
            doc: 'Bitrate and chroma sampling inside the chosen frame rate.',
          },
        ],
      },
      {
        id: 's-q-settings', label: 'S&Q Settings', modes: 'movie',
        note: 'Printed with the S&Q icon prefix.',
      },
      {
        id: 'time-lapse-settings', label: 'Time-lapse Settings', modes: 'movie',
        note: 'Printed with the time-lapse icon prefix.',
      },
      {
        id: 'log', label: 'Log Shooting Setting', modes: 'movie',
        ref: 'log',
        doc: 'Log Shooting Setting. The screen inside holds the Log Shooting toggle: Off, or On (Flexible ISO), which fixes Picture Profile to Off. Sony says so; it is not a suggestion.',
      },
      {
        id: 'proxy-settings', label: 'Proxy Settings', modes: 'movie',
        note: 'Printed with the proxy icon prefix.',
      },
      {
        id: 'long-exposure-nr', label: 'Long Exposure NR', modes: 'still',
      },
      {
        id: 'high-iso-nr', label: 'High ISO NR', modes: 'still',
      },
      {
        id: 'hlg-still-image', label: 'HLG Still Image', modes: 'still',
      },
      {
        id: 'color-space', label: 'Color Space', modes: 'still',
      },
      {
        id: 'lens-compensation', label: 'Lens Compensation', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
    ] },
    { id: 'media', num: 2, label: 'Media', items: [
      {
        id: 'format-card', label: 'Format', modes: 'both',
        doc: 'Formats the card. Everything on it goes.',
      },
      {
        id: 'recover-image-db', label: 'Recover Image DB', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'display-media-info', label: 'Display Media Info.', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
    ] },
    { id: 'file', num: 3, label: 'File', items: [
      {
        id: 'file-folder-settings', label: 'File/Folder Settings', modes: 'still',
      },
      {
        id: 'select-rec-folder', label: 'Select REC Folder', modes: 'still',
      },
      {
        id: 'create-new-folder', label: 'Create New Folder', modes: 'still',
      },
      {
        id: 'copyright-info', label: 'Copyright Info', modes: 'still',
      },
      {
        id: 'write-serial-number', label: 'Write Serial Number', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'file-settings', label: 'File Settings', modes: 'movie',
      },
    ] },
    { id: 'shooting-mode', num: 4, label: 'Shooting Mode', items: [
      {
        id: 'shoot-mode', label: 'Shoot Mode', modes: 'movie',
        doc: 'The movie-side exposure mode: P, A, S or M. Which side of the triangle you hold and which the camera may move.',
        note: 'Printed with the S&Q and time-lapse icon prefixes.',
      },
      {
        id: 'auto-scene-selection', label: 'Auto/Scene Selection', modes: 'still',
      },
      {
        id: 'recall-camera-setting', label: 'Recall Camera Setting', modes: 'both',
        note: 'Printed with a memory-recall icon prefix.',
      },
      {
        id: 'camera-set-memory', label: 'Camera Set. Memory', modes: 'both',
        note: 'Printed with a memory-recall icon prefix.',
      },
      {
        id: 'reg-custom-shoot-set', label: 'Reg. Custom Shoot Set', modes: 'still',
      },
    ] },
    { id: 'drive-mode', num: 5, label: 'Drive Mode', items: [
      {
        id: 'drive-mode', label: 'Drive Mode', modes: 'still',
        doc: 'Single, continuous, self-timer, bracketing. Not modelled: the setup object records video shoots.',
      },
      {
        id: 'bracket-settings', label: 'Bracket Settings', modes: 'still',
      },
      {
        id: 'interval-shoot-func', label: 'Interval Shoot Func.', modes: 'still',
      },
    ] },
    { id: 'shutter-silent', num: 6, label: 'Shutter/Silent', items: [
      {
        id: 'silent-mode-settings', label: 'Silent Mode Settings', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'shutter-type', label: 'Shutter Type', modes: 'still',
        doc: 'Mechanical or electronic for stills. Electronic reads line by line: fast subjects skew and LED light can band.',
      },
      {
        id: 'e-front-curtain-shut', label: 'e-Front Curtain Shut.', modes: 'still',
      },
      {
        id: 'release-w-o-lens', label: 'Release w/o Lens', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'release-w-o-card', label: 'Release w/o Card', modes: 'still',
      },
      {
        id: 'anti-flicker-set', label: 'Anti-flicker Set.', modes: 'both',
        doc: 'Opens the screen holding Anti-flicker Shoot. and Var. Shutter, the body\'s two flicker tools, one per medium.',
        children: [
          {
            id: 'anti-flicker', label: 'Anti-flicker Shoot.', modes: 'still',
            ref: 'anti-flicker',
            doc: 'Times stills around the mains pulse. Sony lists it as unavailable in movie shooting mode.',
          },
          {
            id: 'var-shutter', label: 'Var. Shutter', modes: 'movie',
            ref: 'var-shutter',
            doc: 'Fine shutter steps for chasing a flicker frequency. Selectable only in S or M with the shutter set by hand.',
          },
        ],
      },
    ] },
    { id: 'audio-recording', num: 7, label: 'Audio Recording', items: [
      {
        id: 'audio-recording', label: 'Audio Recording', modes: 'movie',
      },
      {
        id: 'audio-rec-level', label: 'Audio Rec Level', modes: 'movie',
      },
      {
        id: 'audio-out-timing', label: 'Audio Out Timing', modes: 'movie',
      },
      {
        id: 'wind-noise-reduct', label: 'Wind Noise Reduct.', modes: 'movie',
      },
      {
        id: 'shoe-audio-set', label: 'Shoe Audio Set.', modes: 'movie',
        note: 'Printed with a multi-interface-shoe icon prefix.',
      },
    ] },
    { id: 'tc-ub', num: 8, label: 'TC/UB', items: [
      {
        id: 'time-code-preset', label: 'Time Code Preset', modes: 'movie',
      },
      {
        id: 'user-bit-preset', label: 'User Bit Preset', modes: 'movie',
      },
      {
        id: 'time-code-format', label: 'Time Code Format', modes: 'movie',
      },
      {
        id: 'time-code-run', label: 'Time Code Run', modes: 'movie',
      },
      {
        id: 'time-code-make', label: 'Time Code Make', modes: 'movie',
      },
      {
        id: 'user-bit-time-rec', label: 'User Bit Time Rec', modes: 'movie',
      },
    ] },
    { id: 'image-stabilization', num: 9, label: 'Image Stabilization', items: [
      {
        id: 'steadyshot-still', label: 'SteadyShot', modes: 'still',
        doc: 'In-body stabilisation for stills.',
        note: 'Printed with the still-image icon prefix; TOC renders it as "SteadyShot (still image)".',
      },
      {
        id: 'steadyshot', label: 'SteadyShot', modes: 'movie',
        ref: 'steadyshot',
        doc: 'In-body stabilisation for movies. Corrects hand shake; on a tripod it has none to correct.',
        note: 'Printed with the movie icon prefix; TOC renders it as "SteadyShot (movie)".',
      },
      {
        id: 'steadyshot-adjust', label: 'SteadyShot Adjust.', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'focal-length', label: 'Focal Length', modes: 'both',
        note: 'Printed with the still image/movie icon prefix plus a SteadyShot icon; the guide\'s TOC renders this entry as "SteadyShot focal length (still image/movie)".',
      },
    ] },
    { id: 'zoom', num: 10, label: 'Zoom', items: [
      {
        id: 'zoom', label: 'Zoom', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'zoom-range', label: 'Zoom Range', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'custom-key-z-speed', label: 'Custom Key Z. Speed', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'remote-zoom-speed', label: 'Remote Zoom Speed', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
    ] },
    { id: 'shooting-display', num: 11, label: 'Shooting Display', items: [
      {
        id: 'grid-line-display', label: 'Grid Line Display', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'grid-line-type', label: 'Grid Line Type', modes: 'both',
        note: 'Printed with the still image/movie icon prefix.',
      },
      {
        id: 'live-view-display-set', label: 'Live View Display Set.', modes: 'still',
      },
      {
        id: 'emphasized-rec-display', label: 'Emphasized REC Display', modes: 'movie',
      },
    ] },
    { id: 'marker-display', num: 12, label: 'Marker Display', items: [
      {
        id: 'marker-display', label: 'Marker Display', modes: 'movie',
      },
      {
        id: 'center-marker', label: 'Center Marker', modes: 'movie',
      },
      {
        id: 'aspect-marker', label: 'Aspect Marker', modes: 'movie',
      },
      {
        id: 'safety-zone', label: 'Safety Zone', modes: 'movie',
      },
      {
        id: 'guideframe', label: 'Guideframe', modes: 'movie',
      },
    ] },
    { id: 'shooting-option', num: 13, label: 'Shooting Option', items: [
      {
        id: 'self-timer', label: 'Self-timer', modes: 'movie',
        note: 'Printed with the movie icon prefix; TOC renders it as "Self-timer (movie)".',
      },
      {
        id: 'auto-framing-settings', label: 'Auto Framing Settings', modes: 'movie',
      },
    ] },
  ],
};
