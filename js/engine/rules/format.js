// ── Rules: format ────────────────────────────────────────────
// The recording-format rules, the first area moved out of rules.js once it
// passed the size guideline. rules.js spreads them back in at the same
// position, so the order the review lists them in is unchanged.

import { isValidMode, modesAtFps, fpsFor, resFor, CHROMA_LABELS, FORMATS } from '../../data/bodies.js';
import { SPEED_MARKS, CAPACITY_STANDARDS, floorLabel, cardLabel } from '../../data/cards.js';
import { cardMatch } from '../calc.js';

const cardOf = c => ({ standard: c.format.card, bus: c.format.cardBus, uhs: c.format.cardUhs, video: c.format.cardVideo });
const marksOf = c => [c.format.cardUhs, c.format.cardVideo].map(id => SPEED_MARKS[id]).filter(Boolean);
const mbs = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** The setup's card against Sony's movie table: the setup records neither S&Q nor a proxy. */
const setupCard = c => cardMatch({
  container: c.format.container, res: c.format.res, fps: c.format.fps, bitrate: c.format.bitrate,
  mode: 'movie', proxy: false, card: cardOf(c),
});

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
    id: 'format/card-below-sony-list',
    area: 'format',
    severity: 'note',
    basis: 'sony-spec',
    title: 'The card is below the one Sony lists',
    learn: 'memory-cards',
    applies: c => marksOf(c).length > 0,
    test: c => {
      const m = setupCard(c);
      const name = `${FORMATS[c.format.container]?.label || c.format.container} ${String(c.format.res).toUpperCase()}`;
      const card = cardLabel(cardOf(c));
      if (!m.ok) return { fires: false, detail: `Sony's card table has no movie row for ${name}, so there is nothing to hold the card against.` };
      const want = floorLabel(m.floor);
      if (m.meetsSony) return { fires: false, detail: `The recorded card, ${card}, meets the ${want} Sony lists for ${name} movie recording.` };

      const marks = m.marks.join(' ');
      const parts = [`Sony lists ${want} for ${name} movie recording, and this setup records its card as ${card}.`];
      if (m.mediaOk === false) {
        parts.push(`${CAPACITY_STANDARDS[m.standard]?.label || m.standard} is not a capacity standard Sony lists for this File Format, whatever the card's speed.`);
      }
      if (m.otherFamily) {
        parts.push(`${marks} promises the speed of Sony's ${SPEED_MARKS[m.floor.mark].label} under another SD Association family, and the SDA only counts a match within one family.`);
      }
      if (c.format.bitrate < m.floor.maxMbps) {
        parts.push(`Sony gives one card per File Format, sized for its highest bitrate (${m.floor.maxMbps} Mbps), and lists nothing lower for lower Record Settings.`);
      }
      parts.push(m.rateCovered
        ? `At ${c.format.bitrate}M the stream is ${mbs(m.streamMBs)} MB/s and ${marks} promises ${m.promisedMBs} MB/s, so the card's own floor covers this Record Setting: the gap is to Sony's table, not to the card's speed.`
        : `At ${c.format.bitrate}M the stream is ${mbs(m.streamMBs)} MB/s, more than ${marks} promises, which is its own finding.`);
      return { fires: true, detail: parts.join(' ') };
    },
  },
  {
    id: 'format/card-slower-than-stream',
    area: 'format',
    severity: 'warn',
    basis: 'physics',
    title: 'The card promises less than this setting writes',
    learn: 'memory-cards',
    applies: c => marksOf(c).length > 0 && !!c.format.bitrate,
    test: c => {
      const marks = marksOf(c);
      const labels = marks.map(m => m.label).join(' ');
      const promised = Math.max(...marks.map(m => m.mbs));
      const stream = c.format.bitrate / 8;
      if (promised >= stream) {
        return { fires: false, detail: `${labels} promises ${promised} MB/s of sustained writing, and ${c.format.bitrate}M needs ${mbs(stream)} MB/s.` };
      }
      const enough = Object.values(SPEED_MARKS).filter(m => m.family === 'video' && m.mbs >= stream)[0];
      return {
        fires: true,
        detail: `At ${c.format.bitrate}M the camera writes ${mbs(stream)} MB/s, and this card's marks (${labels}) promise a minimum of ${promised} MB/s. The SD Association defines a speed mark as the minimum sequential write a card keeps up, which is what recording video needs to avoid dropped frames; below it the card can fall behind mid-take. ${enough ? `A card marked ${enough.label} or faster covers this Record Setting.` : ''}`.trim(),
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
