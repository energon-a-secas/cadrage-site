// ── Rules: format ────────────────────────────────────────────
// The recording-format rules, the first area moved out of rules.js once it
// passed the size guideline. rules.js spreads them back in at the same
// position, so the order the review lists them in is unchanged.

import { isValidMode, modesAtFps, fpsFor, resFor, CHROMA_LABELS, FORMATS } from '../../data/bodies.js';

export const FORMAT_RULES = [
  {
    id: 'format/invalid-combination',
    area: 'format',
    severity: 'error',
    basis: 'sony-spec',
    title: 'That recording mode does not exist',
    learn: 'codecs-and-bitrates',
    applies: c => !!(c.format.container && c.format.res && c.format.fps && c.format.bitrate && c.format.chroma),
    test: c => {
      const { container, res, fps, bitrate, chroma } = c.format;
      const name = FORMATS[container]?.label || container;
      const size = String(res).toUpperCase();
      const sampling = ch => CHROMA_LABELS[ch] || ch;
      if (isValidMode(container, res, fps, bitrate, chroma)) {
        return { fires: false, detail: `${name} ${size} ${fps}p ${bitrate}M ${sampling(chroma)} is a documented mode.` };
      }
      // File Format pairs a container with a size, so a size the container
      // never records has no Record Setting rows to suggest instead.
      const sizes = resFor(container);
      if (!sizes.includes(res)) {
        const offered = sizes.length
          ? `The list offers ${name} in ${sizes.map(r => r.toUpperCase()).join(' and ')} only.`
          : `The a6700 records ${Object.values(FORMATS).map(f => f.label).join(', ')}.`;
        return {
          fires: true,
          detail: `${name} ${size} is not on Sony's File Format list, so no Record Setting row exists for it. ${offered}`,
        };
      }
      const atFps = modesAtFps(container, res, fps);
      const rates = fpsFor(container, res);
      const alt = atFps.length
        ? `At ${fps}p this container offers ${atFps.map(m => `${m.bitrate}M ${sampling(m.chroma)}`).join(', ')}.`
        : `${name} ${size} has no ${fps}p option at all; it offers ${rates.join('p, ')}p.`;
      return {
        fires: true,
        detail: `${name} ${size} at ${fps}p, ${bitrate}M, ${sampling(chroma)} is not in Sony's Record Setting table. ${alt}`,
      };
    },
  },
  {
    id: 'format/embed-lut-locked-on-sd',
    area: 'format',
    severity: 'note',
    basis: 'unverified',
    title: 'Embed LUT File is another body\'s row',
    learn: 'luts',
    applies: c => c.colour.embedLut === true,
    test: c => {
      const card = c.format.card;
      const caveat = 'The a6700 help guide lists no Embed LUT File row anywhere in its menu (checked 2026-08-28). The row and its SD/SDHC lock are documented for the FX line, which is why this rule is unverified here rather than Sony spec.';
      if (card === 'sdxc' || card === 'cfexpress') {
        return { fires: false, detail: `Card type would support embedding on the bodies that have the row. ${caveat}` };
      }
      return {
        fires: true,
        detail: `On the bodies that have the row, Sony locks Embed LUT File to Off for SD and SDHC cards, so footage arrives in the editor without the LUT that made it look right on the camera. ${caveat}`,
      };
    },
  },
];
