// ── Framing and close-ups ────────────────────────────────────
// The seventh calculator: what a lens frames from where the camera
// stands, how far it gets toward a small detail, and what each way of
// getting closer costs in depth and light. Its inputs sit in tools.js's
// session bag beside the other calculators'. The lens table, the tubes
// and close-up lenses and the shop prices are data/lenses.js; the
// arithmetic is engine/optics.js. The body is the a6700 throughout, as
// everywhere in the calculators.

import { escHtml } from '../utils.js';
import { state } from '../state.js';
import { kvRows } from '../ui.js';
import { sel, num } from './calc-fields.js';
import { COC_PRESETS, sensorOf } from '../engine/calc.js';
import {
  imageArea, magnificationAt, distanceAt, fieldAt, effectiveAperture, extensionStops, depthAtMagnification,
  reach, workingDistanceCm, magnificationToFill, hasClosePair,
} from '../engine/optics.js';
import { DIFFRACTION_FROM } from '../engine/rules/focus.js';
import { movieCrop } from '../data/bodies.js';
import { LENSES, LENS_GROUPS, CLOSE_UPS, LENS_EXTRAS, LENS_READ, LENS_SHOP_NOTE } from '../data/lenses.js';
import { priceItem } from './lights.js';

const BODY = 'a6700';

export const FRAME_DEFAULTS = {
  lensId: 'zeiss-55-1.8', zoomMm: null, extra: 'none', distanceCm: 90, aperture: 8,
  orientation: 'v', rec: 'base', subjectCm: 18, detailCm: 2,
};

/** How much of the frame's height a detail should fill before it counts as a close-up. */
const TARGET_SHARE = 0.5;

/** Repair what a lens switch or an old session left behind. */
function normalise(s) {
  if (!LENSES[s.lensId] || s.lensId === 'other') s.lensId = FRAME_DEFAULTS.lensId;
  if (!CLOSE_UPS[s.extra]) s.extra = 'none';
  const lens = LENSES[s.lensId];
  if (!lens.zoom) s.zoomMm = null;
  else if (!(s.zoomMm >= lens.focalMm && s.zoomMm <= lens.focalMaxMm)) s.zoomMm = lens.focalMaxMm;
}

/**
 * The lens as the arithmetic needs it. A zoom is taken at the focal
 * length chosen; its maker's close-focus pair belongs to the long end,
 * so anywhere else it is a plain thin lens with the same minimum focus.
 */
function activeLens(s) {
  const lens = LENSES[s.lensId];
  if (!lens.zoom) return lens;
  const atLongEnd = s.zoomMm === lens.focalMaxMm;
  return { ...lens, focalMm: s.zoomMm, maxMag: atLongEnd ? lens.maxMag : null };
}

const area = s => imageArea({
  sensor: sensorOf(BODY),
  crop: movieCrop(BODY, { res: '4k', fps: s.rec === 'high' ? 120 : 60 }),
  orientation: s.orientation,
});

// ── Inputs ───────────────────────────────────────────────────

const lensOptions = () => LENS_GROUPS.flatMap(g => Object.entries(LENSES)
  .filter(([, l]) => l.group === g.id)
  // Short names: the field is one grid cell wide, and the panel below gives each lens in full.
  .map(([value, l]) => ({ value, label: `${l.short}${l.own ? ' (yours)' : ''}` })));

export function frameInputs(s) {
  normalise(s);
  const lens = LENSES[s.lensId];
  return [
    sel('frame', 'lensId', s.lensId, lensOptions(), 'Lens'),
    lens.zoom ? num('frame', 'zoomMm', s.zoomMm, 'Zoomed to', { min: lens.focalMm, max: lens.focalMaxMm, unit: 'mm' }) : '',
    sel('frame', 'extra', s.extra, Object.entries(CLOSE_UPS).map(([value, c]) => ({ value, label: c.label })), 'Close-up accessory'),
    num('frame', 'distanceCm', s.distanceCm, 'Sensor mark to subject', { min: 5, max: 1000, unit: 'cm' }),
    num('frame', 'aperture', s.aperture, 'Aperture', { min: 1, max: 32, step: 0.1, unit: 'f' }),
    sel('frame', 'orientation', s.orientation, [{ value: 'v', label: 'Vertical, 9:16' }, { value: 'h', label: 'Horizontal, 16:9' }], 'Frame'),
    sel('frame', 'rec', s.rec, [{ value: 'base', label: '4K up to 60p' }, { value: 'high', label: '4K 120p or 100p' }], 'Recording'),
    num('frame', 'subjectCm', s.subjectCm, 'Subject height', { min: 0.1, max: 500, step: 0.1, unit: 'cm' }),
    num('frame', 'detailCm', s.detailCm, 'Detail height', { min: 0.1, max: 100, step: 0.1, unit: 'cm' }),
    sel('frame', 'coc', state.prefs.coc, Object.entries(COC_PRESETS).map(([value, c]) => ({ value, label: c.label })), 'Sharpness standard'),
  ].join('');
}

// ── Outputs ──────────────────────────────────────────────────

const num1 = v => String(Number(v.toFixed(1)));
const len = v => (v >= 20 ? v.toFixed(0) : num1(v));
/** Both sides to the same precision: "19 x 34 cm", "9.4 x 16.6 cm". */
const frameTxt = f => {
  const digits = Math.max(f.widthCm, f.heightCm) >= 20 ? 0 : 1;
  return `${f.widthCm.toFixed(digits)} x ${f.heightCm.toFixed(digits)} cm`;
};
const magTxt = m => `${m >= 0.095 ? m.toFixed(2) : m.toFixed(3)}x`;
const pct = v => `${v >= 0.995 ? Math.round(v * 100) : (v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
const stopsTxt = v => `${v.toFixed(1)} stop${v.toFixed(1) === '1.0' ? '' : 's'}`;
function depthTxt(d) {
  if (!d.ok) return 'not worked out';
  if (d.totalCm === Infinity) return 'unlimited';
  if (d.totalCm >= 1) return `${d.totalCm.toFixed(1)} cm`;
  const mm = d.totalCm * 10;
  return `${mm >= 0.1 ? mm.toFixed(1) : mm.toFixed(2)} mm`;
}

/** "fills 55% of the frame's height", or what happens when it does not fit. */
function fillTxt(sizeCm, frameCm) {
  const share = sizeCm / frameCm;
  return share > 1 ? `does not fit: it is ${share.toFixed(1)} times the frame's height` : `fills ${pct(share)} of the frame's height`;
}

/** Everything the outputs say about one magnification. */
function at(lens, m, s, a, coc) {
  const frame = fieldAt(a, m);
  return {
    m, frame,
    depth: depthAtMagnification({ lens, m, aperture: s.aperture, cocMm: coc.mm }),
    effective: effectiveAperture(s.aperture, m),
    stops: extensionStops(m),
    detailShare: s.detailCm / frame.heightCm,
  };
}

/** Exposure once the lens is extended. Under a third of a stop is not worth a line. */
function lightTxt(p, s) {
  if (p.stops < 0.3) return `f/${s.aperture}: no loss worth counting this far away`;
  return `f/${p.effective.toFixed(1)} effective, ${stopsTxt(p.stops)} under the marked f/${s.aperture}`;
}

/**
 * Room between the front of the lens and the subject, as a figure and
 * whose it is. The maker's own working distance wins at the closest
 * focus; otherwise it is the distance less flange, tube and barrel, an
 * upper bound on a lens whose barrel grows as it focuses.
 */
function room(lens, m, distanceCm, tubeMm = 0) {
  if (lens.working && !tubeMm && hasClosePair(lens) && m >= lens.maxMag * 0.999) return { text: lens.working, by: lens.src };
  const wd = workingDistanceCm({ lens, distanceCm, tubeMm });
  if (wd === null) return null;
  // An estimate, so whole centimetres once there are ten of them.
  const cm = Math.max(0, wd);
  return { text: `${lens.extends ? 'under' : 'about'} ${cm >= 10 ? Math.round(cm) : num1(cm)} cm`, grows: !!lens.extends };
}
const roomRow = r => (r === null ? 'not worked out: no barrel length recorded'
  : r.by ? `${escHtml(r.text)}, by ${escHtml(r.by)}` : `${r.text}${r.grows ? ': its barrel grows as it focuses closer' : ''}`);

export function frameOutputs(s) {
  normalise(s);
  const lens = activeLens(s);
  const coc = COC_PRESETS[state.prefs.coc] || COC_PRESETS['4k'];
  if (!s.aperture || !s.distanceCm || !s.subjectCm || !s.detailCm) {
    return '<p class="calc-warn">Fill in the distance, the aperture and the two heights.</p>';
  }
  const a = area(s);
  const extra = CLOSE_UPS[s.extra];
  const bandOnly = lens.minMag > 0;
  if (extra.kind === 'none') return bandOnly ? bandOutputs(s, lens, a, coc, null) : bareOutputs(s, lens, a, coc);
  if (bandOnly) return `<p class="calc-warn">${escHtml(lens.short)} already starts at ${magTxt(lens.minMag)}: a tube or a close-up lens on it is not worked out here. Set the accessory to None.</p>`;
  return bandOutputs(s, lens, a, coc, extra);
}

function bareOutputs(s, lens, a, coc) {
  const r = magnificationAt(lens, s.distanceCm);
  if (!r.ok) {
    return `<p class="calc-warn">${escHtml(lens.short)} has no maker figure for its closest focus here, and ${s.distanceCm} cm is nearer than a plain ${lens.focalMm} mm lens can focus at all. Move the subject back.</p>`;
  }
  const p = at(lens, r.m, s, a, coc);
  const where = r.insideMfd ? lens.mfdCm : s.distanceCm;
  const verdict = r.insideMfd
    ? `<p class="calc-verdict is-bad">${escHtml(lens.short)} cannot focus at ${s.distanceCm} cm: its minimum is ${lens.mfdCm} cm from the sensor mark. The figures below are for ${lens.mfdCm} cm, the closest it gets.</p>`
    : `<p class="calc-verdict">${escHtml(lens.short)} from ${s.distanceCm} cm frames <strong>${frameTxt(p.frame)}</strong>. The ${s.subjectCm} cm subject ${fillTxt(s.subjectCm, p.frame.heightCm)}.</p>`;
  const rows = [
    ['Magnification', `${magTxt(p.m)}: 1 cm on the subject is ${(p.m * 10).toFixed(2)} mm on the sensor`],
    ['Frame at the subject', frameTxt(p.frame)],
    [`The ${s.subjectCm} cm subject`, fillTxt(s.subjectCm, p.frame.heightCm)],
    [`The ${s.detailCm} cm detail`, `${fillTxt(s.detailCm, p.frame.heightCm)}${p.detailShare < 0.5 ? `, ${pct(Math.min(1, p.detailShare * 2))} after a 2x crop to 1080p` : ''}`],
    [`Depth at f/${s.aperture}`, `${depthTxt(p.depth)} (${escHtml(coc.label)})`],
    ['Light the sensor gets', lightTxt(p, s)],
    ['Front of the lens to the subject', roomRow(room(lens, p.m, where))],
  ];
  const end = reach(lens);
  if (end.ok) {
    const c = at(lens, end.maxMag, s, a, coc);
    const mag = end.estimate ? `about ${magTxt(end.maxMag)} by the thin lens, since the maker gives no magnification` : magTxt(end.maxMag);
    rows.push(['Closest it focuses', `${lens.mfdCm} cm, ${mag}: a frame of ${frameTxt(c.frame)}, where the detail ${fillTxt(s.detailCm, c.frame.heightCm)}`]);
  }
  return `${verdict}${kvRows(rows)}${notes(p, s, lens)}${modelNote(lens, r)}`;
}

/**
 * A lens that focuses only inside a band: any lens behind a tube or a
 * close-up lens, and a macro-only lens on its own (`extra` null).
 */
function bandOutputs(s, lens, a, coc, extra) {
  const r = reach(lens, extra);
  if (!r.ok) return '<p class="calc-warn">That accessory cannot be worked out for this lens.</p>';
  const far = at(lens, r.minMag, s, a, coc);
  const near = at(lens, r.maxMag, s, a, coc);
  const from = r.from === 'sensor' ? 'from the sensor mark' : 'from the front of the close-up lens';
  const tube = extra?.kind === 'tube';
  const extended = !extra || tube;   // a close-up lens extends nothing, so it costs no light
  const who = extra ? `${escHtml(lens.short)} with ${escHtml(extra.phrase)}` : escHtml(lens.short);
  const verdict = `<p class="calc-verdict">${who} focuses only on a subject <strong>${len(r.nearCm)} to ${len(r.farCm)} cm</strong> ${from}, drawing ${magTxt(r.minMag)} to ${magTxt(r.maxMag)}: a frame from ${frameTxt(far.frame)} down to <strong>${frameTxt(near.frame)}</strong>. The distance typed above does not apply: ${extra ? 'the accessory' : 'the lens'} sets it.</p>`;
  const rows = [
    ['Farthest it focuses', `${len(r.farCm)} cm ${from}, ${magTxt(r.minMag)}: the detail ${fillTxt(s.detailCm, far.frame.heightCm)}`],
    ['Closest it focuses', `${len(r.nearCm)} cm ${from}, ${magTxt(r.maxMag)}: the detail ${fillTxt(s.detailCm, near.frame.heightCm)}`],
    [`The ${s.subjectCm} cm subject`, `${fillTxt(s.subjectCm, far.frame.heightCm)}, even at the far end`],
    [`Depth at f/${s.aperture}`, `${depthTxt(far.depth)} at the far end, ${depthTxt(near.depth)} at the near end (${escHtml(coc.label)})`],
    ['Light the sensor gets', extended ? `${lightTxt(far, s)} at the far end; ${lightTxt(near, s)} at the near end` : `f/${s.aperture}: a close-up lens costs no light`],
  ];
  if (tube) {
    const a1 = room(lens, r.maxMag, r.nearCm, extra.mm);
    const a2 = room(lens, r.minMag, r.farCm, extra.mm);
    if (a1 && a2) rows.push(['Front of the lens to the subject', `${a1.text} at the near end, ${a2.text} at the far end`]);
  }
  if (!extra && lens.workingCm) rows.push(['Front of the lens to the subject', `${len(lens.workingCm.far)} cm at ${magTxt(r.minMag)}, ${len(lens.workingCm.near)} cm at ${magTxt(r.maxMag)}, by ${escHtml(lens.src)}`]);
  const why = !extra
    ? `These ends are ${escHtml(lens.src)}. The lens does not focus beyond its lowest magnification, so nothing larger than the far frame above fits.`
    : `${tube
      ? 'A tube has no glass: it moves the whole lens forward, so the lens loses infinity and everything beyond the far end above. Focus by moving the camera, then trim with the ring.'
      : 'A close-up lens brings infinity in to its own focal length, so nothing beyond the far end above focuses while it is on.'} These ends are thin-lens estimates, not a maker's figures.`;
  return `${verdict}${kvRows(rows)}${notes(extended ? near : { ...near, stops: 0, effective: s.aperture }, s, lens)}<p class="calc-note">${why}</p>`;
}

/** What the magnification costs: diffraction, depth on a turning model. */
function notes(p, s, lens) {
  const out = [];
  if (p.effective > DIFFRACTION_FROM + 0.5) {
    out.push(['warn', `Diffraction follows the effective aperture, f/${p.effective.toFixed(1)} here: past about f/${DIFFRACTION_FROM} a 4K frame from this sensor softens. Open the marked aperture, or accept it for the depth.`]);
  }
  if (p.depth.ok && p.depth.totalCm < 1) {
    out.push(['note', `At ${magTxt(p.m)} the sharp zone is ${depthTxt(p.depth)} deep. On a turning model a detail sweeps through that in a moment: stop the turntable for this shot, or frame a part that sits on its axis.`]);
  }
  if (lens.af === false) out.push(['note', `${lens.short} is manual focus${lens.contacts === false ? ', with the aperture on a ring on the lens: the camera records neither' : ''}. On a tripod with the magnifier that costs nothing.`]);
  return out.map(([kind, text]) => `<p class="calc-${kind}">${escHtml(text)}</p>`).join('');
}

function modelNote(lens, r) {
  const ends = r.calibrated
    ? `The closest-focus figures are ${escHtml(lens.src)}; between there and infinity the frame is a thin-lens estimate hung from them, good to a few percent.`
    : 'No maker figure for the magnification at the closest focus here, so this is a plain thin lens.';
  return `<p class="calc-note">${ends} Distances run from the sensor mark on the camera's top plate, where Sony measures a minimum focus distance. Sony states no crop for 4K up to 60p; its pixel counts put the movie area about 4% inside the full width, so real frames can run that much tighter.</p>`;
}

// ── Lenses and close-up options ──────────────────────────────

/**
 * One option against the target magnification: whether it gets there,
 * from where, and with how much room. A lens that focuses continuously
 * is judged where it reaches the target, not at its closest, since it
 * can always back off; a band (a tube, a close-up lens, a macro-only
 * lens) is judged by whether the target falls inside it.
 */
function optionLine(lens, r, s, a, coc, need, tubeMm = 0) {
  const from = r.from === 'sensor' ? '' : ' from its front';
  const about = r.estimate ? 'about ' : '';
  if (r.maxMag < need) {
    const p = at(lens, r.maxMag, s, a, coc);
    return `<strong>Falls short</strong>: at its closest, ${len(r.nearCm)} cm${from} and ${about}${magTxt(r.maxMag)}, the frame is ${frameTxt(p.frame)} and the detail ${fillTxt(s.detailCm, p.frame.heightCm)}.`;
  }
  if (r.minMag > need) {
    const p = at(lens, r.minMag, s, a, coc);
    return `<strong>Starts tighter</strong>: its widest frame, ${len(r.farCm)} cm${from} and ${magTxt(r.minMag)}, is ${frameTxt(p.frame)}, where the detail ${fillTxt(s.detailCm, p.frame.heightCm)}. It goes on to ${magTxt(r.maxMag)}.`;
  }
  if (r.kind !== 'bare' || r.minMag > 0) {
    return `<strong>Reaches it</strong> inside its band: ${len(r.nearCm)} to ${len(r.farCm)} cm${from}, ${about}${magTxt(r.minMag)} to ${magTxt(r.maxMag)}.`;
  }
  const d = distanceAt(lens, need);
  const space = room(lens, need, d, tubeMm);
  const left = !space ? '' : space.by ? `, leaving ${escHtml(space.text)} in front of the lens` : `, leaving ${space.text} in front of the lens${space.grows ? ', less as its barrel grows' : ''}`;
  return `<strong>Reaches it</strong> from ${len(d)} cm${left}. Its closest is ${len(r.nearCm)} cm and ${magTxt(r.maxMag)}, a frame of ${frameTxt(fieldAt(a, r.maxMag))}.`;
}

const link = (url, text) => (url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer">${escHtml(text)}</a>` : escHtml(text));
const usdItem = usd => (usd ? `<li>US$ ${usd.value.toLocaleString('en-US')} ${escHtml(usd.note)}<span class="buy__date">, checked ${escHtml(LENS_READ)}</span></li>` : '');
const NOT_IN_CHILE = '<p class="buy__kind">Not found at a shop in Chile that allows reading.</p>';

/** Shop prices, a US price where a maker's store gave one, and a line when Chile has none. */
function priceList(item, owned = false) {
  const prices = (item.prices || []).map(p => priceItem({ checked: LENS_READ, ...p })).join('');
  const usd = usdItem(item.usd);
  return `${prices || usd ? `<ul class="buy__prices">${prices}${usd}</ul>` : ''}${prices || owned ? '' : NOT_IN_CHILE}`;
}

function lensCard(lens, s, a, coc, need) {
  const facts = [lens.mount, lens.af === false ? 'manual focus' : 'autofocus', lens.stabilised ? 'stabilised' : null,
    lens.weightG ? `${lens.weightG.toLocaleString('en-US')} g` : null, lens.filterMm ? `${lens.filterMm} mm filter` : null].filter(Boolean).join(', ');
  const r = reach(lens);
  const guess = r.ok && r.estimate ? ' The maker gives no magnification, so that one is a thin-lens estimate.' : '';
  const working = lens.working ? ` At its closest: ${escHtml(lens.working)} in front of the lens, by the maker.` : '';
  return `
      <article class="buy">
        <h3 class="buy__title">${escHtml(lens.label)}${lens.own ? ' <span class="tier__price">yours</span>' : ''}</h3>
        <p class="buy__kind">${escHtml(lens.kind)}. ${escHtml(facts)}.</p>
        <p class="buy__figures">${r.ok ? optionLine(lens, r, s, a, coc, need) : 'No closest-focus figures recorded.'}${guess}${working} From ${link(lens.url, lens.src)}, read ${escHtml(LENS_READ)}.</p>
        ${lens.note ? `<p class="buy__kind">${escHtml(lens.note)}</p>` : ''}
        ${priceList(lens, lens.own)}
      </article>`;
}

function extraCard(c, lens, s, a, coc, need) {
  const r = reach(lens, c);
  return `
      <article class="buy">
        <h3 class="buy__title">${escHtml(lens.short)} with ${escHtml(c.phrase)}</h3>
        <p class="buy__figures">${r.ok ? optionLine(lens, r, s, a, coc, need, c.mm || 0) : 'Cannot be worked out for this lens.'} A thin-lens estimate.</p>
        <p class="buy__kind">Sold as: ${escHtml(LENS_EXTRAS[c.product].label)}.</p>
      </article>`;
}

function productCard(p) {
  return `
      <article class="buy">
        <h3 class="buy__title">${escHtml(p.label)}</h3>
        <p class="buy__kind">${escHtml(p.kind)}</p>
        <p class="buy__figures">From ${link(p.url, p.src)}, read ${escHtml(LENS_READ)}.</p>
        ${priceList(p)}
      </article>`;
}

/** Every lens and accessory against the detail and frame above, then what each costs. */
export function lensShop(s) {
  normalise(s);
  const coc = COC_PRESETS[state.prefs.coc] || COC_PRESETS['4k'];
  if (!s.aperture || !s.detailCm) return '<p class="calc-warn">Fill in the aperture and the detail height above.</p>';
  const a = area(s);
  const chosen = activeLens(s);
  const need = magnificationToFill({ sizeCm: s.detailCm, sideMm: a.heightMm, share: TARGET_SHARE });
  const depth = depthAtMagnification({ lens: LENSES[FRAME_DEFAULTS.lensId], m: need, aperture: s.aperture, cocMm: coc.mm });
  const groups = LENS_GROUPS.map(g => {
    const cards = Object.values(LENSES).filter(l => l.group === g.id).map(l => lensCard(l, s, a, coc, need)).join('');
    return cards ? `<p class="calc-sub">${escHtml(g.label)}</p>${g.lead ? `<p class="calc-note">${escHtml(g.lead)}</p>` : ''}<div class="buys">${cards}</div>` : '';
  }).join('');
  const onChosen = chosen.minMag > 0
    ? `<p class="calc-note">${escHtml(chosen.short)} already starts at ${magTxt(chosen.minMag)}: pick another lens above to see what a tube or a close-up lens does on it.</p>`
    : `<div class="buys">${Object.values(CLOSE_UPS).filter(c => c.kind !== 'none').map(c => extraCard(c, chosen, s, a, coc, need)).join('')}</div>`;
  return `
    <p class="calc-verdict">For the ${s.detailCm} cm detail to fill half the frame's height takes <strong>${magTxt(need)}</strong> in this frame. At f/${s.aperture} that leaves <strong>${depthTxt(depth)}</strong> of sharp depth (${escHtml(coc.label)}), whichever option gets there: depth follows the magnification, not the lens.</p>
    ${groups}
    <p class="calc-sub">Cheaper than a lens: on the ${escHtml(chosen.short)}</p>
    ${onChosen}
    <div class="buys">${Object.values(LENS_EXTRAS).map(productCard).join('')}</div>
    <p class="calc-note">${escHtml(LENS_SHOP_NOTE)}</p>`;
}
