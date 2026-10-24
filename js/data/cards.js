// ── Memory cards ─────────────────────────────────────────────
// Two sources, kept apart because they answer different questions.
// Sony's memory card page says which card each File Format needs on the
// a6700; the SD Association says what the marks on a card promise.
// Read 2026-10-24: helpguide.sony.net/ilc/2320/v1/en/contents/
// 0002H_usable_memory_card.html and 1003C_recordable_time_movie.html,
// and sdcard.org's speed class, bus speed and capacity pages.

/**
 * Speed marks and the minimum sequential write each promises, from the
 * SD Association's chart. A device's mark is met by a card in the same
 * family at the same or a higher number; across families the SDA
 * guarantees nothing, even at the same MB/s. V60 and V90 exist only on
 * UHS-II and UHS-III cards.
 */
export const SPEED_MARKS = {
  u1: { label: 'U1', family: 'uhs', mbs: 10 },
  u3: { label: 'U3', family: 'uhs', mbs: 30 },
  v10: { label: 'V10', family: 'video', mbs: 10 },
  v30: { label: 'V30', family: 'video', mbs: 30 },
  v60: { label: 'V60', family: 'video', mbs: 60, uhsTwoOnly: true },
  v90: { label: 'V90', family: 'video', mbs: 90, uhsTwoOnly: true },
};

/**
 * The bus is the I or II on the label: a ceiling on transfer, where the
 * speed marks are a floor. The a6700 takes both (specifications page).
 */
export const CARD_BUSES = {
  'uhs-i': { label: 'UHS-I', ceiling: 'up to 104 MB/s' },
  'uhs-ii': { label: 'UHS-II', ceiling: '156 MB/s, or 312 MB/s half duplex' },
};

/** Sizes as sold, in decimal gigabytes. */
export const CARD_SIZES_GB = [32, 64, 128, 256, 512, 1000];

export const sizeLabel = gb => (gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`);

/** SD Association capacity standards. */
export const CAPACITY_STANDARDS = {
  sdhc: { label: 'SDHC', range: 'over 2 GB up to 32 GB', fs: 'FAT32' },
  sdxc: { label: 'SDXC', range: 'over 32 GB up to 2 TB', fs: 'exFAT' },
};

export function capacityStandard(gb) {
  return gb <= 32 ? 'sdhc' : 'sdxc';
}

export const SHOOT_MODES = {
  movie: 'Movie',
  sq: 'S&Q Motion',
  timelapse: 'Time-lapse',
};

/**
 * Sony's card per shooting mode, Proxy Recording off or on, and File
 * Format (container/size). `maxMbps` is Sony's "maximum recordable bit
 * rate when recording"; with a proxy Sony adds up to 16 Mbps for it.
 * Time-lapse rows state no bitrate. S-I has no proxy rows because the
 * camera cannot record a proxy in XAVC S-I.
 */
export const CARD_FLOORS = {
  movie: {
    off: {
      'xavc-hs/4k': { maxMbps: 280, media: ['sdxc'], mark: 'v60' },
      'xavc-s/4k': { maxMbps: 280, media: ['sdxc'], mark: 'v60' },
      'xavc-s/hd': { maxMbps: 100, media: ['sdhc', 'sdxc'], mark: 'u3' },
      'xavc-s-i/4k': { maxMbps: 600, media: ['sdxc'], mark: 'v90' },
      'xavc-s-i/hd': { maxMbps: 222, media: ['sdxc'], mark: 'v90' },
    },
    on: {
      'xavc-hs/4k': { maxMbps: 200, proxyMbps: 16, media: ['sdxc'], mark: 'v60' },
      'xavc-s/4k': { maxMbps: 200, proxyMbps: 16, media: ['sdxc'], mark: 'v60' },
      'xavc-s/hd': { maxMbps: 50, proxyMbps: 16, media: ['sdhc', 'sdxc'], mark: 'u3' },
    },
  },
  sq: {
    off: {
      'xavc-hs/4k': { maxMbps: 500, media: ['sdxc'], mark: 'v90' },
      'xavc-s/4k': { maxMbps: 560, media: ['sdxc'], mark: 'v90' },
      'xavc-s/hd': { maxMbps: 500, media: ['sdxc'], mark: 'v90' },
      'xavc-s-i/4k': { maxMbps: 600, media: ['sdxc'], mark: 'v90' },
      'xavc-s-i/hd': { maxMbps: 445, media: ['sdxc'], mark: 'v90' },
    },
    on: {
      'xavc-hs/4k': { maxMbps: 250, proxyMbps: 16, media: ['sdxc'], mark: 'v60' },
      'xavc-s/4k': { maxMbps: 280, proxyMbps: 16, media: ['sdxc'], mark: 'v60' },
      'xavc-s/hd': { maxMbps: 125, proxyMbps: 16, media: ['sdxc'], mark: 'v60' },
    },
  },
  timelapse: {
    off: {
      'xavc-hs/4k': { media: ['sdhc', 'sdxc'], mark: 'u3' },
      'xavc-s/4k': { media: ['sdhc', 'sdxc'], mark: 'u3' },
      'xavc-s/hd': { media: ['sdhc', 'sdxc'], mark: 'u3' },
      'xavc-s-i/4k': { media: ['sdxc'], mark: 'v90' },
      'xavc-s-i/hd': { media: ['sdxc'], mark: 'v90' },
    },
    on: {
      'xavc-hs/4k': { media: ['sdxc'], mark: 'v60' },
      'xavc-s/4k': { media: ['sdxc'], mark: 'v60' },
      'xavc-s/hd': { media: ['sdhc', 'sdxc'], mark: 'u3' },
    },
  },
};

/** "SDXC V60 or higher", the way Sony prints a row. */
export function floorLabel(floor) {
  const media = floor.media.map(m => CAPACITY_STANDARDS[m].label).join('/');
  return `${media} ${SPEED_MARKS[floor.mark].label} or higher`;
}

/**
 * Sony's recordable movie times in minutes, Proxy Recording off, for the
 * two sizes Sony tabulates. They run below plain division on the bitrate.
 */
export const SONY_RECORD_TIMES = [
  { container: 'xavc-hs', res: '4k', fps: [60, 50], bitrate: 200, minutes: { 64: 35, 128: 70 } },
  { container: 'xavc-hs', res: '4k', fps: [60, 50], bitrate: 150, minutes: { 64: 45, 128: 95 } },
  { container: 'xavc-hs', res: '4k', fps: [60, 50], bitrate: 100, minutes: { 64: 65, 128: 130 } },
  { container: 'xavc-hs', res: '4k', fps: [60, 50], bitrate: 75, minutes: { 64: 85, 128: 170 } },
  { container: 'xavc-hs', res: '4k', fps: [60, 50], bitrate: 45, minutes: { 64: 130, 128: 270 } },
  { container: 'xavc-s', res: '4k', fps: [60, 50], bitrate: 200, minutes: { 64: 35, 128: 70 } },
  { container: 'xavc-s', res: '4k', fps: [60, 50], bitrate: 150, minutes: { 64: 45, 128: 95 } },
  { container: 'xavc-s', res: 'hd', fps: [60, 50], bitrate: 50, minutes: { 64: 120, 128: 250 } },
  { container: 'xavc-s', res: 'hd', fps: [60, 50], bitrate: 25, minutes: { 64: 200, 128: 420 } },
  { container: 'xavc-s-i', res: '4k', fps: [60], bitrate: 600, minutes: { 64: 10, 128: 25 } },
  { container: 'xavc-s-i', res: '4k', fps: [50], bitrate: 500, minutes: { 64: 10, 128: 25 } },
  { container: 'xavc-s-i', res: 'hd', fps: [60], bitrate: 222, minutes: { 64: 30, 128: 65 } },
  { container: 'xavc-s-i', res: 'hd', fps: [50], bitrate: 185, minutes: { 64: 30, 128: 65 } },
];

/** Sony's figure for this exact row and card size, or null where Sony lists none. */
export function sonyRecordTime({ container, res, fps, bitrate, cardGb }) {
  const row = SONY_RECORD_TIMES.find(r =>
    r.container === container && r.res === res && r.fps.includes(fps) && r.bitrate === bitrate);
  return row?.minutes[cardGb] ?? null;
}
