// ── Main tab, transcribed ────────────────────────────────────
// The status screen: value tiles, not rows. Sony's guide verifies the
// tile lists (one page for stills, two for movies) and that selecting
// a tile opens the matching menu item's setting screen. This is the
// only place Shutter Speed and Aperture appear in the menu at all:
// they are dials first, tiles second, rows nowhere.
// Source: helpguide.sony.net/ilc/2320/v1/en, Main menu page, read
// 2026-08-28. A `link` tile opens the item it names; a tile with its
// own id is a real item that exists nowhere else in the tree.

const link = (page, target, label, modes) => ({ id: `${page}-${target}`, label, modes, link: target });

export const MAIN_TAB = {
  id: 'main', label: 'Main', colour: null, main: true,
  note: 'A grid of current values. Selecting one opens the owning menu item, which is how the dial-set values are reachable from the menu.',
  groups: [
    {
      id: 'main-still', num: 1, label: 'Main', modes: 'still',
      items: [
        {
          id: 'shutter-speed', label: 'Shutter Speed', modes: 'both', ref: 'shutter-speed',
          doc: 'A dial on the body, not a menu row. The Main tile is the one place the menu shows it, and in Program mode it merges with the Aperture tile.',
        },
        {
          id: 'aperture', label: 'Aperture', modes: 'both', ref: 'aperture',
          doc: 'The other dial-set value. Depth of field reads it, which is why the review cares.',
        },
        link('ms', 'exposure-comp', 'Exposure Comp.', 'still'),
        link('ms', 'iso', 'ISO', 'still'),
        link('ms', 'format-card', 'Format', 'still'),
        link('ms', 'still-file-format', 'File Format', 'still'),
        link('ms', 'raw-file-type', 'RAW File Type', 'still'),
        link('ms', 'jpeg-quality', 'JPEG Quality/HEIF Quality', 'still'),
        link('ms', 'jpeg-image-size', 'JPEG Image Size/HEIF Image Size', 'still'),
        link('ms', 'aspect-ratio', 'Aspect Ratio', 'still'),
        {
          id: 'still-shoot-mode', label: 'Shoot Mode', modes: 'still',
          doc: 'On the stills side the exposure mode is the physical dial; the tile mirrors it.',
        },
        link('ms', 'drive-mode', 'Drive Mode', 'still'),
        link('ms', 'flash-mode', 'Flash Mode', 'still'),
        link('ms', 'flash-comp', 'Flash Comp.', 'still'),
        link('ms', 'wireless-flash', 'Wireless Flash', 'still'),
        link('ms', 'white-balance', 'White Balance', 'still'),
        link('ms', 'focus-mode', 'Focus Mode', 'still'),
        link('ms', 'focus-area', 'Focus Area', 'still'),
        {
          id: 'battery', label: 'Remaining battery level', modes: 'both',
          doc: 'A readout, not a setting.',
        },
      ],
    },
    {
      id: 'main-movie-1', num: 1, label: 'Main 1', modes: 'movie',
      items: [
        link('m1', 'frame-rate', 'Rec Frame Rate', 'movie'),
        link('m1', 'shutter-speed', 'Shutter Speed', 'movie'),
        link('m1', 'aperture', 'Aperture', 'movie'),
        link('m1', 'iso', 'ISO', 'movie'),
        link('m1', 'white-balance', 'White Balance', 'movie'),
        link('m1', 'picture-profile', 'Picture Profile', 'movie'),
        link('m1', 'file-format', 'File Format', 'movie'),
        link('m1', 'record-setting', 'Record Setting', 'movie'),
        link('m1', 'gamma-display-assist', 'Gamma Display Assist', 'movie'),
        link('m1', 'gamma-disp-assist-typ', 'Gamma Disp. Assist Typ.', 'movie'),
        link('m1', 'proxy-settings', 'Proxy Recording', 'movie'),
        link('m1', 'wind-noise-reduct', 'Wind Noise Reduct.', 'movie'),
        link('m1', 'audio-rec-level', 'Audio Rec Level', 'movie'),
      ],
    },
    {
      id: 'main-movie-2', num: 2, label: 'Main 2', modes: 'movie',
      items: [
        link('m2', 'log', 'Log Shooting Setting', 'movie'),
        link('m2', 'format-card', 'Format', 'movie'),
        link('m2', 'file-settings', 'File Settings', 'movie'),
        link('m2', 'shoot-mode', 'Shoot Mode', 'movie'),
        link('m2', 'steadyshot', 'SteadyShot', 'movie'),
        link('m2', 'focus-mode', 'Focus Mode', 'movie'),
        link('m2', 'focus-area', 'Focus Area', 'movie'),
        link('m2', 'subject-recognition', 'Subject Recog in AF', 'movie'),
        link('m2', 'recognition-target', 'Recognition Target', 'movie'),
        link('m2', 'battery', 'Remaining battery level', 'movie'),
      ],
    },
  ],
};
