// ── Exposure/Color tab, transcribed ──────────────────────────────────
// Structure and row labels transcribed from the ILCE-6700 help guide
// (helpguide.sony.net/ilc/2320/v1/en, list of MENU items, read
// 2026-08-28). Rows the setup object models carry `ref`, the id of the
// live row in data/menu.js; rows without one render read-only in the
// camera view. `children` are rows that live inside a parent row's own
// screen on the body. Tab colours are null on purpose: the guide's art
// is grayscale and states no colours, so presentation colour is the
// view's approximation, not data.

export const EXPOSURE_TAB = {
  id: 'exposure-color', label: 'Exposure/Color', colour: null,
  groups: [
    { id: 'exposure', num: 1, label: 'Exposure', items: [
      {
        id: 'bulb-timer-settings', label: 'BULB Timer Settings', modes: 'still',
      },
      {
        id: 'auto-slow-shut', label: 'Auto Slow Shutter', modes: 'movie',
        ref: 'auto-slow-shut',
        doc: 'Lets the camera lengthen the shutter in dim light, overriding the chosen speed.',
      },
      {
        id: 'iso', label: 'ISO', modes: 'both',
        ref: 'iso',
        doc: 'Gain. Manual value, or Auto within the range the next row bounds.',
      },
      {
        id: 'iso-range', label: 'ISO Range Limit', modes: 'both',
        ref: 'iso-range',
        doc: 'The bounds Auto ISO may use.',
      },
      {
        id: 'iso-auto-min-ss', label: 'ISO AUTO Min. SS', modes: 'still',
        doc: 'How slow the shutter may go before Auto ISO raises gain.',
      },
    ] },
    { id: 'exposure-comp', num: 2, label: 'Exposure Comp.', items: [
      {
        id: 'exposure-comp', label: 'Exposure Comp.', modes: 'both',
        ref: 'exposure-comp',
        doc: 'Shifts the target the automatic modes aim for. Does nothing in full manual unless ISO is on Auto.',
      },
      {
        id: 'exposure-step', label: 'Exposure step', modes: 'both',
      },
      {
        id: 'exposure-std-adjust', label: 'Exposure Std. Adjust', modes: 'both',
        doc: 'Shifts the meter\'s idea of correct per metering mode. Invisible once set; leave at zero without a measurement.',
      },
    ] },
    { id: 'metering', num: 3, label: 'Metering', items: [
      {
        id: 'metering-mode', label: 'Metering Mode', modes: 'both',
        doc: 'Multi, Center, Spot, Entire Screen Avg., Highlight. Which pixels the meter believes.',
      },
      {
        id: 'face-priority-in-multi-metering', label: 'Face Priority in Multi Metering', modes: 'both',
      },
      {
        id: 'spot-metering-point', label: 'Spot Metering Point', modes: 'both',
      },
      {
        id: 'ael-w-shutter', label: 'AEL w/ Shutter', modes: 'still',
      },
    ] },
    { id: 'flash', num: 4, label: 'Flash', items: [
      {
        id: 'flash-mode', label: 'Flash Mode', modes: 'still',
      },
      {
        id: 'flash-comp', label: 'Flash Comp.', modes: 'still',
      },
      {
        id: 'exp-comp-set', label: 'Exp.comp.set', modes: 'still',
      },
      {
        id: 'wireless-flash', label: 'Wireless Flash', modes: 'still',
      },
      {
        id: 'red-eye-reduction', label: 'Red Eye Reduction', modes: 'still',
      },
      {
        id: 'external-flash-set', label: 'External Flash Set.', modes: 'still',
      },
      {
        id: 'reg-flash-shooting-set', label: 'Reg. Flash Shooting Set', modes: 'still',
      },
    ] },
    { id: 'white-balance', num: 5, label: 'White Balance', items: [
      {
        id: 'white-balance', label: 'White Balance', modes: 'both',
        ref: 'wb',
        doc: 'AWB, a kelvin value, or a captured custom register. The screen inside holds Color Temp./Filter with the G-M and A-B axes.',
        children: [
          {
            id: 'color-temp', label: 'Color Temp./Filter', modes: 'both',
            ref: 'color-temp',
            doc: 'The kelvin value plus the G-M and A-B shift axes.',
          },
        ],
      },
      {
        id: 'awb-priority', label: 'Priority Set in AWB', modes: 'both',
        ref: 'awb-priority',
        doc: 'How AWB leans under artificial light. Does nothing outside AWB.',
      },
      {
        id: 'shutter-awb-lock', label: 'Shutter AWB Lock', modes: 'still',
      },
      {
        id: 'shockless-wb', label: 'Shockless WB', modes: 'movie',
      },
    ] },
    { id: 'color-tone', num: 6, label: 'Color/Tone', items: [
      {
        id: 'd-range-optimizer', label: 'D-Range Optimizer', modes: 'both',
      },
      {
        id: 'creative-look', label: 'Creative Look', modes: 'both',
        ref: 'creative-look',
        doc: 'Finished looks. Sony does not document how this combines with an active Picture Profile on this body.',
      },
      {
        id: 'picture-profile', label: 'Picture Profile', modes: 'both',
        ref: 'picture-profile',
        doc: 'Preset bundles of gamma and colour handling. PP6 means Cine2 unless overridden inside it.',
        children: [
          {
            id: 'pp-gamma', label: 'Gamma', modes: 'both',
            ref: 'pp-gamma',
            doc: 'The curve inside the active Picture Profile. Setting one here overrides what the preset means.',
          },
          {
            id: 'pp-black-gamma', label: 'Black Gamma', modes: 'both',
            ref: 'pp-black-gamma',
            doc: 'Shadow response inside the profile.',
          },
          {
            id: 'pp-saturation', label: 'Saturation', modes: 'both',
            ref: 'pp-saturation',
            doc: 'In-camera saturation. One of the axes the stacking check watches.',
          },
          {
            id: 'pp-color-mode', label: 'Color Mode', modes: 'both',
            ref: 'pp-color-mode',
            doc: 'The colour rendering family inside the profile.',
          },
          {
            id: 'pp-detail', label: 'Detail Level', modes: 'both',
            ref: 'pp-detail',
            doc: 'In-camera sharpening. The other half of a doubled sharpen in post.',
          },
        ],
      },
      {
        id: 'select-lut', label: 'Select LUT', modes: 'movie',
        ref: 'select-lut',
        doc: 'The viewing transform for Log. No effect without Log Shooting.',
      },
      {
        id: 'manage-user-luts', label: 'Manage User LUTs', modes: 'movie',
      },
      {
        id: 'soft-skin-effect', label: 'Soft Skin Effect', modes: 'both',
      },
    ] },
    { id: 'zebra-display', num: 7, label: 'Zebra Display', items: [
      {
        id: 'zebra-display', label: 'Zebra Display', modes: 'both',
        ref: 'zebra-display',
      },
      {
        id: 'zebra-level', label: 'Zebra Level', modes: 'both',
        ref: 'zebra-level',
      },
    ] },
  ],
};
