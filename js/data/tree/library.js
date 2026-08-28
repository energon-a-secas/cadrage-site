// ── My Menu / Playback / Network / Setup tab, transcribed ──────────────────────────────────
// Structure and row labels transcribed from the ILCE-6700 help guide
// (helpguide.sony.net/ilc/2320/v1/en, list of MENU items, read
// 2026-08-28). Rows the setup object models carry `ref`, the id of the
// live row in data/menu.js; rows without one render read-only in the
// camera view. `children` are rows that live inside a parent row's own
// screen on the body. Tab colours are null on purpose: the guide's art
// is grayscale and states no colours, so presentation colour is the
// view's approximation, not data.

export const MY_MENU_TAB = {
  id: 'my-menu', label: 'My Menu', colour: null,
  note: 'Rows you registered yourself. On the body this tab is whatever you made it; the six rows here are the management rows Sony lists.',
  groups: [
    { id: 'my-menu-setting', num: 1, label: 'My Menu Setting', items: [
      {
        id: 'add-item', label: 'Add Item', modes: 'both',
      },
      {
        id: 'sort-item', label: 'Sort Item', modes: 'both',
      },
      {
        id: 'delete-item', label: 'Delete Item', modes: 'both',
      },
      {
        id: 'delete-page', label: 'Delete Page', modes: 'both',
      },
      {
        id: 'delete-all', label: 'Delete All', modes: 'both',
      },
      {
        id: 'display-from-my-menu', label: 'Display From My Menu', modes: 'both',
      },
    ] },
  ],
};

export const PLAYBACK_TAB = {
  id: 'playback', label: 'Playback', colour: null,
  groups: [
    { id: 'playback-target', num: 1, label: 'Playback Target', items: [
      {
        id: 'view-mode', label: 'View Mode', modes: 'both',
      },
    ] },
    { id: 'magnification', num: 2, label: 'Magnification', items: [
      {
        id: 'enlarge-image', label: 'Enlarge Image', modes: 'both',
      },
      {
        id: 'enlarge-initial-mag', label: 'Enlarge Initial Mag.', modes: 'both',
      },
      {
        id: 'enlarge-initial-position', label: 'Enlarge Initial Position', modes: 'both',
      },
    ] },
    { id: 'selection-memo', num: 3, label: 'Selection/Memo', items: [
      {
        id: 'protect', label: 'Protect', modes: 'both',
      },
      {
        id: 'rating', label: 'Rating', modes: 'both',
      },
      {
        id: 'rating-set-custom-key', label: 'Rating Set(Custom Key)', modes: 'both',
      },
    ] },
    { id: 'delete', num: 4, label: 'Delete', items: [
      {
        id: 'delete', label: 'Delete', modes: 'both',
      },
      {
        id: 'delete-pressing-twice', label: 'Delete pressing twice', modes: 'both',
      },
      {
        id: 'delete-confirm', label: 'Delete confirm.', modes: 'both',
      },
    ] },
    { id: 'edit', num: 5, label: 'Edit', items: [
      {
        id: 'crop', label: 'Crop', modes: 'both',
      },
      {
        id: 'rotate', label: 'Rotate', modes: 'both',
      },
      {
        id: 'photo-capture', label: 'Photo Capture', modes: 'both',
      },
      {
        id: 'jpeg-heif-switch-2', label: 'JPEG/HEIF Switch', modes: 'both',
      },
    ] },
    { id: 'viewing', num: 6, label: 'Viewing', items: [
      {
        id: 'cont-play-for-interval', label: 'Cont. Play for Interval', modes: 'both',
      },
      {
        id: 'play-speed-for-interval', label: 'Play Speed for Interval', modes: 'both',
      },
      {
        id: 'slide-show', label: 'Slide Show', modes: 'both',
      },
    ] },
    { id: 'playback-option', num: 7, label: 'Playback Option', items: [
      {
        id: 'image-index', label: 'Image Index', modes: 'both',
      },
      {
        id: 'display-as-group', label: 'Display as Group', modes: 'both',
      },
      {
        id: 'display-rotation', label: 'Display Rotation', modes: 'both',
      },
      {
        id: 'focus-frame-display', label: 'Focus Frame Display', modes: 'both',
      },
      {
        id: 'disp-specified-time-img', label: 'Disp Specified Time Img.', modes: 'both',
      },
      {
        id: 'image-jump-setting', label: 'Image Jump Setting', modes: 'both',
      },
    ] },
  ],
};

export const NETWORK_TAB = {
  id: 'network', label: 'Network', colour: null,
  groups: [
    { id: 'cnct-pc-remote', num: 1, label: 'Cnct./PC Remote', items: [
      {
        id: 'smartphone-connection', label: 'Smartphone Connection', modes: 'both',
      },
      {
        id: 'pc-remote-function', label: 'PC Remote Function', modes: 'both',
      },
      {
        id: 'select-on-cam-send', label: 'Select on Cam & Send', modes: 'both',
      },
      {
        id: 'reset-transfer-status', label: 'Reset Transfer Status', modes: 'both',
      },
      {
        id: 'cnct-while-power-off', label: 'Cnct. while Power OFF', modes: 'both',
      },
      {
        id: 'remote-shoot-setting', label: 'Remote Shoot Setting', modes: 'both',
      },
    ] },
    { id: 'streaming', num: 2, label: 'Streaming', items: [
      {
        id: 'usb-streaming', label: 'USB Streaming', modes: 'both',
      },
    ] },
    { id: 'creators-cloud', num: 3, label: 'Creators\' Cloud', items: [
      {
        id: 'cloud-connection', label: 'Cloud Connection', modes: 'both',
      },
      {
        id: 'cloud-information', label: 'Cloud Information', modes: 'both',
      },
    ] },
    { id: 'wi-fi', num: 4, label: 'Wi-Fi', items: [
      {
        id: 'wi-fi-connect', label: 'Wi-Fi Connect', modes: 'both',
      },
      {
        id: 'wps-push', label: 'WPS Push', modes: 'both',
      },
      {
        id: 'access-point-set', label: 'Access Point Set.', modes: 'both',
      },
      {
        id: 'wi-fi-frequency-band', label: 'Wi-Fi Frequency Band', modes: 'both',
        note: 'Marked with an asterisk on the listing page: "For some models only".',
      },
      {
        id: 'display-wi-fi-info', label: 'Display Wi-Fi Info.', modes: 'both',
      },
      {
        id: 'ssid-pw-reset', label: 'SSID/PW Reset', modes: 'both',
      },
    ] },
    { id: 'bluetooth', num: 5, label: 'Bluetooth', items: [
      {
        id: 'bluetooth-function', label: 'Bluetooth Function', modes: 'both',
      },
      {
        id: 'pairing', label: 'Pairing', modes: 'both',
      },
      {
        id: 'manage-paired-device', label: 'Manage Paired Device', modes: 'both',
      },
      {
        id: 'bluetooth-rmt-ctrl', label: 'Bluetooth Rmt Ctrl', modes: 'both',
      },
      {
        id: 'disp-device-address', label: 'Disp Device Address', modes: 'both',
      },
    ] },
    { id: 'wired-lan', num: 6, label: 'Wired LAN', items: [
      {
        id: 'ip-address-setting', label: 'IP Address Setting', modes: 'both',
      },
      {
        id: 'display-wired-lan-info', label: 'Display Wired LAN Info.', modes: 'both',
      },
    ] },
    { id: 'usb-lan-tethering', num: 7, label: 'USB-LAN/Tethering', items: [
      {
        id: 'usb-lan-connection', label: 'USB-LAN Connection', modes: 'both',
      },
      {
        id: 'usb-lan-disconnection', label: 'USB-LAN Disconnection', modes: 'both',
      },
      {
        id: 'tethering-connection', label: 'Tethering Connection', modes: 'both',
      },
      {
        id: 'tethering-disconnection', label: 'Tethering Disconnection', modes: 'both',
      },
    ] },
    { id: 'network-option', num: 8, label: 'Network Option', items: [
      {
        id: 'airplane-mode', label: 'Airplane Mode', modes: 'both',
      },
      {
        id: 'edit-device-name', label: 'Edit Device Name', modes: 'both',
      },
      {
        id: 'import-root-certificate', label: 'Import Root Certificate', modes: 'both',
      },
      {
        id: 'access-authen-settings', label: 'Access Authen. Settings', modes: 'both',
      },
      {
        id: 'access-authen-info', label: 'Access Authen. Info', modes: 'both',
      },
      {
        id: 'wi-fi-direct-settings', label: 'Wi-Fi Direct Settings', modes: 'both',
      },
      {
        id: 'reset-network-set', label: 'Reset Network Set.', modes: 'both',
      },
    ] },
  ],
};

export const SETUP_TAB = {
  id: 'setup', label: 'Setup', colour: null,
  note: 'Setup rows display in every dial position; where a row acts on one medium only, actsOn records which, from the icon Sony prints inside the label.',
  groups: [
    { id: 'area-date', num: 1, label: 'Area/Date', items: [
      {
        id: 'language', label: 'Language', modes: 'both',
        note: 'Printed with a globe icon (image/cE802.png) before the label.',
      },
      {
        id: 'area-date-time-setting', label: 'Area/Date/Time Setting', modes: 'both',
      },
      {
        id: 'ntsc-pal-selector', label: 'NTSC/PAL Selector', modes: 'both',
      },
    ] },
    { id: 'reset-save-settings', num: 2, label: 'Reset/Save Settings', items: [
      {
        id: 'setting-reset', label: 'Setting Reset', modes: 'both',
      },
      {
        id: 'save-load-settings', label: 'Save/Load Settings', modes: 'both',
      },
    ] },
    { id: 'operation-customize', num: 3, label: 'Operation Customize', items: [
      {
        id: 'custom-key-dial-set', label: 'Custom Key/Dial Set.', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label; the row\'s own mode column is the all-modes icon, so the item is listed in every dial position.',
        actsOn: 'still',
      },
      {
        id: 'custom-key-dial-set-movie', label: 'Custom Key/Dial Set.', modes: 'both',
        note: 'Printed with the movie icon (image/cE660.png) before the label; the row\'s own mode column is the all-modes icon.',
        actsOn: 'movie',
      },
      {
        id: 'custom-key-setting', label: 'Custom Key Setting', modes: 'both',
        note: 'Printed with a further icon (image/cE804.png) before the label; links to the same Custom Key/Dial Set. page, which states keys can be assigned separately for still, movie and playback modes. Icon meaning not stated in the page legend.',
      },
      {
        id: 'fn-menu-settings', label: 'Fn Menu Settings', modes: 'both',
      },
      {
        id: 'different-set-for-still-mv', label: 'Different Set for Still/Mv', modes: 'both',
      },
      {
        id: 'disp-screen-disp-set', label: 'DISP (Screen Disp) Set', modes: 'both',
      },
      {
        id: 'rec-w-shutter', label: 'REC w/ Shutter', modes: 'both',
        note: 'Printed with the movie icon (image/cE660.png) before the label.',
        actsOn: 'movie',
      },
      {
        id: 'zoom-ring-rotate', label: 'Zoom Ring Rotate', modes: 'both',
      },
    ] },
    { id: 'dial-customize', num: 4, label: 'Dial Customize', items: [
      {
        id: 'custom-key-dial-set-still', label: 'Custom Key/Dial Set.', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label.',
        actsOn: 'still',
      },
      {
        id: 'custom-key-dial-set-2', label: 'Custom Key/Dial Set.', modes: 'both',
        note: 'Printed with the movie icon (image/cE660.png) before the label.',
        actsOn: 'movie',
      },
      {
        id: 'my-dial-settings', label: 'My Dial Settings', modes: 'both',
      },
      {
        id: 'av-tv-rotate', label: 'Av/Tv Rotate', modes: 'both',
      },
      {
        id: 'dial-wheel-lock', label: 'Dial / Wheel Lock', modes: 'both',
      },
    ] },
    { id: 'touch-operation', num: 5, label: 'Touch Operation', items: [
      {
        id: 'touch-operation', label: 'Touch Operation', modes: 'both',
      },
      {
        id: 'touch-panel-pad', label: 'Touch Panel/Pad', modes: 'both',
      },
      {
        id: 'touch-panel-settings', label: 'Touch Panel Settings', modes: 'both',
      },
      {
        id: 'touch-pad-settings', label: 'Touch Pad Settings', modes: 'both',
      },
    ] },
    { id: 'accessibility', num: 6, label: 'Accessibility', items: [
      {
        id: 'screen-reader', label: 'Screen Reader', modes: 'both',
        note: 'The group heading carries footnote *, defined on the page as "For some models only". The group label is printed with an icon (image/cE67D.png).',
      },
    ] },
    { id: 'finder-monitor', num: 7, label: 'Finder/Monitor', items: [
      {
        id: 'select-finder-monitor', label: 'Select Finder/Monitor', modes: 'both',
      },
      {
        id: 'monitor-brightness', label: 'Monitor Brightness', modes: 'both',
      },
      {
        id: 'viewfinder-bright', label: 'Viewfinder Bright.', modes: 'both',
      },
      {
        id: 'finder-color-temp', label: 'Finder Color Temp.', modes: 'both',
      },
      {
        id: 'display-quality', label: 'Display Quality', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label.',
        actsOn: 'still',
      },
      {
        id: 'finder-frame-rate', label: 'Finder Frame Rate', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label.',
        actsOn: 'still',
      },
      {
        id: 'monitor-flip-direction', label: 'Monitor Flip Direction', modes: 'both',
      },
    ] },
    { id: 'display-option', num: 8, label: 'Display Option', items: [
      {
        id: 'tc-ub-disp-setting', label: 'TC/UB Disp. Setting', modes: 'both',
      },
      {
        id: 'gamma-display-assist', label: 'Gamma Display Assist', modes: 'both',
      },
      {
        id: 'gamma-disp-assist-typ', label: 'Gamma Disp. Assist Typ.', modes: 'both',
      },
      {
        id: 'display-lut', label: 'Display LUT', modes: 'both',
        note: 'Printed with an icon (image/cE664.png) before the label; that icon is not defined in the page\'s still/movie legend.',
      },
      {
        id: 'remain-shoot-display', label: 'Remain Shoot Display', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label.',
        actsOn: 'still',
      },
      {
        id: 'auto-review', label: 'Auto Review', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label.',
        actsOn: 'still',
      },
      {
        id: 'shoot-mode-sel-screen', label: 'Shoot Mode Sel. Screen', modes: 'both',
      },
    ] },
    { id: 'power-setting-option', num: 9, label: 'Power Setting Option', items: [
      {
        id: 'auto-monitor-off', label: 'Auto Monitor OFF', modes: 'both',
        note: 'Printed with the still-image icon (image/cE381.png) before the label.',
        actsOn: 'still',
      },
      {
        id: 'power-save-start-time', label: 'Power Save Start Time', modes: 'both',
      },
      {
        id: 'power-save-by-monitor', label: 'Power Save by Monitor', modes: 'both',
      },
      {
        id: 'auto-power-off-temp', label: 'Auto Power OFF Temp.', modes: 'both',
      },
    ] },
    { id: 'sound-option', num: 10, label: 'Sound Option', items: [
      {
        id: 'volume-settings', label: 'Volume Settings', modes: 'both',
      },
      {
        id: '4ch-audio-monitoring', label: '4ch Audio Monitoring', modes: 'both',
        note: 'Printed with the movie icon (image/cE660.png) before the label.',
        actsOn: 'movie',
      },
      {
        id: 'audio-signals', label: 'Audio signals', modes: 'both',
      },
    ] },
    { id: 'usb', num: 11, label: 'USB', items: [
      {
        id: 'usb-connection-mode', label: 'USB Connection Mode', modes: 'both',
      },
      {
        id: 'usb-lun-setting', label: 'USB LUN Setting', modes: 'both',
      },
      {
        id: 'usb-power-supply', label: 'USB Power Supply', modes: 'both',
      },
    ] },
    { id: 'external-output', num: 12, label: 'External Output', items: [
      {
        id: 'hdmi-resolution', label: 'HDMI Resolution', modes: 'both',
        note: 'Printed with an icon (image/cE661.png) before the label; that icon is not defined in the page\'s still/movie legend, so still-only could not be confirmed.',
      },
      {
        id: 'hdmi-output-settings', label: 'HDMI Output Settings', modes: 'both',
        note: 'Printed with the movie icon (image/cE660.png) before the label.',
        actsOn: 'movie',
      },
      {
        id: 'hdmi-info-display', label: 'HDMI Info. Display', modes: 'both',
      },
      {
        id: 'ctrl-for-hdmi', label: 'CTRL FOR HDMI', modes: 'both',
      },
    ] },
    { id: 'setup-option', num: 13, label: 'Setup Option', items: [
      {
        id: 'video-light-mode', label: 'Video Light Mode', modes: 'both',
      },
      {
        id: 'sensor-cleaning', label: 'Sensor Cleaning', modes: 'both',
      },
      {
        id: 'auto-pixel-mapping', label: 'Auto Pixel Mapping', modes: 'both',
      },
      {
        id: 'pixel-mapping', label: 'Pixel Mapping', modes: 'both',
      },
      {
        id: 'version', label: 'Version', modes: 'both',
      },
      {
        id: 'display-serial-number', label: 'Display Serial Number', modes: 'both',
      },
      {
        id: 'privacy-notice', label: 'Privacy Notice', modes: 'both',
      },
      {
        id: 'certification-logo', label: 'Certification Logo', modes: 'both',
        note: 'Carries footnote *, defined on the page as "For some models only".',
      },
    ] },
  ],
};
