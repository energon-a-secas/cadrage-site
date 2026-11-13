// ── Lights ───────────────────────────────────────────────────
// What the lighting simulator can place, and where it sells in Chile.
// Every figure names where it comes from and the day it was read. A
// maker's figure is used as stated. Where no maker states one (a generic
// panel, a light inside a softbox), the figure is yours to type or an
// estimate, and the simulator says which.

import { modifiedLux1m, luxForExposure } from '../engine/calc.js';

/** The day the figures and prices below were read. */
export const CHECKED = '2026-10-25';

/**
 * Shops. `blocked` ones do not allow automated reading (robots.txt, or a
 * challenge page in front of it), so their prices are as first noted on
 * the day given and were not re-checked.
 */
export const SHOPS = {
  apertura: { label: 'Apertura', host: 'apertura.cl' },
  dj: { label: 'David and Joseph', host: 'davidandjoseph.cl' },
  godox: { label: 'Godox Chile', host: 'godox.cl' },
  mifotopro: { label: 'MiFotoPro', host: 'mifotopro.cl' },
  rincon: { label: 'Rincón Fotográfico', host: 'rinconfotografico.cl' },
  tripodes: { label: 'Tripodes', host: 'tripodes.cl' },
  ml: { label: 'Mercado Libre', host: 'mercadolibre.cl', blocked: true },
  ubuy: { label: 'Ubuy', host: 'ubuy.cl', blocked: true },
};

/** Who stands behind the Godox prices, from godox.cl, read 2026-10-25. */
export const SHOP_NOTE = 'Godox\'s distributor in Chile (Hanuman SpA, godox.cl) lists Apertura, David and Joseph, MiFotoPro, Rincón Fotográfico and Tripodes as authorised shops, with up to 12 months\' warranty; its own prices are suggested retail. Mercado Libre and Ubuy do not allow automated reading, so their prices are as first noted on 2026-10-25 and were not re-checked.';

/**
 * Where each role puts a light, as an angle off the camera axis seen from
 * above: 0 points at the camera, negative is camera left. Exposure counts
 * the cosine of it, so a light at 45 degrees puts 71% of its light on a
 * card facing the camera, and one behind the model puts none there.
 */
export const LIGHT_ROLES = {
  key: { label: 'Key', angleDeg: -45, blurb: 'In front at 45 degrees, the closest light.' },
  fill: { label: 'Fill', angleDeg: 45, blurb: 'The other side, about half the key.' },
  front: { label: 'Front', angleDeg: 10, blurb: 'Beside the camera: lights everything, shapes nothing.' },
  rim: { label: 'Rim', angleDeg: 150, blurb: 'Behind and above, aimed at the model\'s edges.' },
  backdrop: { label: 'Backdrop', angleDeg: 180, aimedAway: true, blurb: 'Aimed at the backdrop, so none of it lands on the model.' },
};

const PANEL_PL48 = 47 * 28;
const SOFTBOX_60 = 60 * 60;
const SOFTBOX_90 = 60 * 90;

/**
 * Shares of a light that leave a modifier's front, for the modifiers no
 * maker publishes a figure through. Estimates, and labelled so wherever
 * they are used. For softboxes the anchor is the pairs Aputure and amaran
 * do publish, all for lights larger than these (read 2026-10-25): a 55 to
 * 90 cm softbox gives 0.36 to 0.55 of the bare figure at 1 m (amaran 150c
 * and 300c in a Light Dome Mini SE, help.aputure.com; LS 600d Pro in a
 * Light Box 60x90, docs.aputure.com), which `modifiedLux1m` reproduces
 * with about half the light leaving the front. A 5-in-1 reflector's
 * translucent disc held over a panel passes about half of its light, by
 * the usual rating of about a stop.
 */
export const ESTIMATES = {
  softbox: { flux: 0.5, range: [0.4, 0.61], label: 'about half of the bare light leaves the front' },
  disc: { flux: 0.5, range: [0.4, 0.7], label: 'a 5-in-1 reflector\'s translucent disc held over the panel passes about half of its light' },
};

/**
 * A placeholder for the PL48's figure at 1 m until you measure yours.
 * Nobody publishes one. 800 is chosen so the "Today" layout below (three
 * panels in front, about 1 m away) gives about the 2,000 lux that your
 * f/8, 1/100, ISO 800 exposure of 2026-10-24 implies, which is a
 * consistency check and not a measurement.
 */
export const PANEL_PLACEHOLDER_LUX = 800;

/**
 * Your exposure of 2026-10-24 (reel-forge, docs/shoots.md): f/8, 1/100
 * and ISO 800 put the white card at 77% under the three PL48 panels.
 */
export const REFERENCE_EXPOSURE = { date: '2026-10-24', aperture: 8, shutterDenom: 100, iso: 800, card: '77%' };
export const REFERENCE_LUX = luxForExposure(REFERENCE_EXPOSURE);

const GODOX_SL60II = 'https://godox.com/product-a/SL60II.html';
const GODOX_ML60II = 'https://godox.com/product-b/ML60IIBi.html';
const AMARAN_60DS = 'https://help.amarancreators.com/en/amaran-60ds/photometrics-technical-specifications';

/**
 * The lights. `mods` are the ways the simulator can fit each one, with
 * the emitting area that sets how fast its light falls off. A mod's
 * `lux1m` is a maker's figure, 'yours' for the PL48 figure you keep in
 * preferences, or 'typed' for a light whose figure you enter per light.
 * A maker's `table` ([cm, lux] at 5600 K, full power) takes over from
 * inverse square where it reaches. A mod with `from` and `estimate` is
 * worked out from another mod of the same light through ESTIMATES.
 * Prices: `clp` by card, `transfer` by bank transfer where the shop
 * shows one, `out` when it cannot be bought today, `seen` when the shop
 * blocks reading and the price is as first noted.
 */
export const LIGHTS = {
  pl48: {
    label: 'PL48 panel',
    short: 'PL48',
    kind: 'Generic bi-colour LED panel, about 47 x 28 cm, sold under many names',
    colour: { cct: 'Bi-colour', cri: null, tlci: null, leansGreen: true },
    src: 'No maker figure exists. Size, power and prices are from Mercado Libre listings as first noted on 2026-10-25, not re-checked; the listings are sold as 85 to 100 W, which is not credible at the price.',
    mods: {
      panel: { label: 'As it comes', areaCm2: PANEL_PL48, lux1m: 'yours' },
      diffused: { label: 'Under a 5-in-1 diffuser', areaCm2: PANEL_PL48, from: 'panel', estimate: 'disc' },
    },
    defaultMod: 'panel',
    prices: [{ shop: 'ml', clp: [18000, 40000], seen: true }],
  },
  'godox-sl60iid': {
    label: 'Godox SL60IID',
    short: 'SL60IID',
    kind: '70 W daylight COB, Bowens mount, reflector in the box',
    colour: { cct: '5600 K', cri: 96, tlci: 97, atLeast: true },
    src: 'Godox\'s product page and manual (illuminance table, 5600 K)',
    url: GODOX_SL60II,
    mods: {
      'softbox-60': { label: 'In a 60 x 60 softbox', areaCm2: SOFTBOX_60, from: 'bare', estimate: 'softbox' },
      'softbox-90': { label: 'In a 60 x 90 softbox', areaCm2: SOFTBOX_90, from: 'bare', estimate: 'softbox' },
      reflector: { label: 'With its reflector', areaCm2: 0, lux1m: 18600, table: [[100, 18600], [200, 3700], [300, 1450]] },
      bare: { label: 'Bare', areaCm2: 0, lux1m: 2160, table: [[100, 2160], [200, 552], [300, 264]] },
    },
    defaultMod: 'softbox-60',
    prices: [
      { shop: 'apertura', clp: 169990, transfer: 161830, url: 'https://apertura.cl/godox-sl60iid-daylight-canon-led-60w' },
      { shop: 'dj', clp: 169990, stock: '4 in stock', url: 'https://davidandjoseph.cl/index.php?route=product/product&path=353&product_id=57987' },
      { shop: 'godox', clp: 169990, note: 'suggested retail', url: 'https://godox.cl/producto/godox-sl60iid-daylight-canon-led-60w/' },
      { shop: 'rincon', clp: 176900, transfer: 168055, url: 'https://rinconfotografico.cl/godox-sl60iid-luz-led-daylight-de-60w' },
      { shop: 'tripodes', clp: 176900, stock: 'stock on request', url: 'https://www.tripodes.cl/godox-sl60iid-daylight-canon-led-60w' },
      { shop: 'ml', clp: [230000, null], seen: true },
    ],
  },
  'godox-sl60iibi': {
    label: 'Godox SL60IIBi',
    short: 'SL60IIBi',
    kind: '75 W bi-colour COB, Bowens mount, reflector in the box; by Godox\'s own figures brighter than the SL60IID',
    colour: { cct: '2800 to 6500 K', cri: 96, tlci: 97, atLeast: true, biColour: true },
    src: 'Godox\'s product page and manual (illuminance table, 5600 K)',
    url: GODOX_SL60II,
    mods: {
      'softbox-60': { label: 'In a 60 x 60 softbox', areaCm2: SOFTBOX_60, from: 'bare', estimate: 'softbox' },
      'softbox-90': { label: 'In a 60 x 90 softbox', areaCm2: SOFTBOX_90, from: 'bare', estimate: 'softbox' },
      reflector: { label: 'With its reflector', areaCm2: 0, lux1m: 25100, table: [[100, 25100], [200, 4610]] },
      bare: { label: 'Bare', areaCm2: 0, lux1m: 2430 },
    },
    defaultMod: 'softbox-60',
    prices: [
      { shop: 'godox', clp: 199990, note: 'suggested retail', url: 'https://godox.cl/producto/godox-sl60iibi-bi-color-led-luz-para-video/' },
      { shop: 'mifotopro', clp: 199990, transfer: 191990, stock: '4 in stock', url: 'https://www.mifotopro.cl/producto/godox-sl60iibi-bi-color-led-luz-para-video-gd-sl60iibi/' },
      { shop: 'tripodes', clp: 203990, stock: 'stock on request', url: 'https://www.tripodes.cl/godox-sl60iibi-bi-color-led-video-light' },
      { shop: 'rincon', clp: 229900, transfer: 218405, stock: 'last unit', url: 'https://rinconfotografico.cl/godox-sl60iibi-luz-led-bicolor' },
      { shop: 'dj', clp: 229900, stock: 'coming soon', out: true, url: 'https://davidandjoseph.cl/index.php?route=product/product&path=353&product_id=57139' },
    ],
  },
  'godox-ml60ii-bi': {
    label: 'Godox ML60II Bi',
    short: 'ML60II Bi',
    kind: '70 W bi-colour LED, compact; Godox\'s own mount, so Bowens softboxes need an adapter that is not in the box',
    colour: { cct: '2800 to 6500 K', cri: 96, tlci: 97, atLeast: true, biColour: true },
    src: 'Godox\'s product page and manual (photometric table, 5600 K)',
    url: GODOX_ML60II,
    mods: {
      'softbox-60': { label: 'In a 60 x 60 softbox', areaCm2: SOFTBOX_60, from: 'bare', estimate: 'softbox' },
      'softbox-90': { label: 'In a 60 x 90 softbox', areaCm2: SOFTBOX_90, from: 'bare', estimate: 'softbox' },
      reflector: { label: 'With its reflector', areaCm2: 0, lux1m: 22500, table: [[100, 22500], [200, 5620], [300, 2540]] },
      bare: { label: 'Bare', areaCm2: 0, lux1m: 2530, table: [[100, 2530], [200, 717], [300, 364]] },
    },
    defaultMod: 'softbox-60',
    prices: [
      { shop: 'godox', clp: 229990, note: 'suggested retail, sold as the kit with the AK-B01 battery grip', url: 'https://godox.cl/producto/godox-ml60ii-bi-luz-led-bicolor-70w-con-empunadura-y-battery-grip-ak-b01/' },
      { shop: 'tripodes', clp: 229990, stock: 'not available', out: true, url: 'https://www.tripodes.cl/godox-ml60iibi-bi-color-led-monolight-ak-b01-battery-handgrip-kit' },
      { shop: 'dj', clp: 249900, stock: 'coming soon', out: true, url: 'https://davidandjoseph.cl/index.php?route=product/product&path=353&product_id=57489' },
    ],
  },
  'amaran-60d-s': {
    label: 'Amaran 60d S',
    short: '60d S',
    kind: '65 W daylight COB, Bowens mount, Hyper Reflector in the box',
    colour: { cct: '5600 K', cri: 97, tlci: 99 },
    src: 'the amaran help centre\'s photometrics page',
    url: AMARAN_60DS,
    mods: {
      'softbox-60': { label: 'In a 60 x 60 softbox', areaCm2: SOFTBOX_60, from: 'bare', estimate: 'softbox' },
      'softbox-90': { label: 'In a 60 x 90 softbox', areaCm2: SOFTBOX_90, from: 'bare', estimate: 'softbox' },
      reflector: { label: 'With its Hyper Reflector', areaCm2: 0, lux1m: 37800, table: [[50, 134700], [100, 37800], [300, 4200]] },
      bare: { label: 'Bare', areaCm2: 0, lux1m: 2940, table: [[50, 11550], [100, 2940], [300, 344]] },
    },
    defaultMod: 'softbox-60',
    pricesNote: 'No Chilean shop that could be checked lists it.',
    prices: [{ shop: 'ubuy', clp: 247500, about: true, seen: true }],
  },
  custom: {
    label: 'Your own light',
    short: 'your light',
    kind: 'Any light, with its figure at 1 m typed in',
    colour: { cct: null, cri: null, tlci: null },
    src: 'Your figure.',
    mods: {
      small: { label: 'Small source', areaCm2: 0, lux1m: 'typed' },
      panel: { label: 'Panel, 47 x 28 cm', areaCm2: PANEL_PL48, lux1m: 'typed' },
      'softbox-60': { label: 'Softbox, 60 x 60 cm', areaCm2: SOFTBOX_60, lux1m: 'typed' },
      'softbox-90': { label: 'Softbox, 60 x 90 cm', areaCm2: SOFTBOX_90, lux1m: 'typed' },
    },
    defaultMod: 'small',
    prices: [],
  },
};

/** Things that are not lights, priced for the tiers. */
export const ACCESSORIES = {
  'softbox-60': {
    label: '60 x 60 Bowens softbox',
    kind: 'Godox SB-FW6060, with a grid. Its Bowens speed ring fits the SL60II lights and the 60d S directly.',
    // Godox lists the SB-FW series as "Bowen's Mount, Aluminum Ring
    // Adaptor" and the SL60II as "suitable with any Bowens-mount
    // modifiers" (godox.com, read 2026-11-13). The kits below are the
    // trap: one was bought for this set on 2026-11-13 and did not fit.
    caution: 'Not the kits sold with an S or S2 speedlite bracket (Godox SFUV, SGUV, SGGV, often titled "softbox with S2 Bowens bracket"). Bowens in that title is the front of the bracket: the softbox clips over the bracket\'s rim and has no speed ring of its own, so it does not mount on a COB light.',
    prices: [
      { shop: 'apertura', clp: 49900, transfer: 47505, url: 'https://apertura.cl/godox-caja-de-luz-60x60-con-grid-softbox-montura-tipo-bowens' },
      { shop: 'godox', clp: 49900, note: 'suggested retail', url: 'https://godox.cl/producto/godox-caja-de-luz-60x60-con-grid-softbox-montura-tipo-bowens/' },
    ],
  },
  'softbox-90': {
    label: '60 x 90 Bowens softbox',
    kind: 'A larger, softer source for the fill. Any Bowens 60 x 90 fits.',
    prices: [
      { shop: 'rincon', model: 'Nanlite SB-RT-90X60', clp: 36900, transfer: 35055, stock: 'last unit', url: 'https://rinconfotografico.cl/nanlite-softbox-90-x-60cm-bowens' },
      { shop: 'apertura', model: 'Godox SB-BW-6090', clp: 42900, transfer: 40841, url: 'https://apertura.cl/godox-softbox-60x90-montura-bowens' },
      { shop: 'tripodes', model: 'Iluminus IL-SOFT-6090', clp: 42900, url: 'https://www.tripodes.cl/iluminus-softbox-60x90-montura-bowens' },
      { shop: 'godox', model: 'Godox SB-BW-6090', clp: 42900, stock: 'out of stock', out: true, url: 'https://godox.cl/producto/godox-softbox-60x90-montura-bowens/' },
    ],
  },
  'disc-5in1': {
    label: '5-in-1 reflector',
    kind: 'Its translucent disc is the diffuser: held over a panel\'s face it blends the LED dots into one even highlight.',
    prices: [
      { shop: 'tripodes', model: 'Godox RFT-05-60, 60 cm', clp: 19990, stock: 'stock on request', url: 'https://www.tripodes.cl/godox-disco-reflector-plegable-5-en-1-de-60cm-rft-06-60-godox' },
      { shop: 'rincon', model: 'Neewer, 80 cm', clp: 23990, transfer: 22791, url: 'https://rinconfotografico.cl/neewer-reflector-5-en-1-plegable-de-80-cm-con-asas' },
      { shop: 'tripodes', model: 'Godox RFT-05-80, 80 cm', clp: 24990, url: 'https://www.tripodes.cl/godox-disco-reflector-colapsable-5-en-1-80cm-negro-plata-suave-dorado-y-plata-blanco-transparente-godox' },
    ],
  },
};

/**
 * A simulator light as the arithmetic needs it: its figure at 1 m, the
 * area it emits from, the maker's table if any, the angle its role puts
 * it at, and where the figure comes from. `panelLux1m` is the PL48 figure
 * you measured, null until you have.
 */
export function resolveLight(light, { panelLux1m = null } = {}) {
  const def = LIGHTS[light.preset] || LIGHTS.custom;
  const modId = def.mods[light.mod] ? light.mod : def.defaultMod;
  const mod = def.mods[modId];
  const role = LIGHT_ROLES[light.role] ? light.role : 'key';
  const base = sourceFigure(def.mods[mod.from] || mod, light, panelLux1m);
  let lux1m = base.lux1m;
  let kind = base.kind;
  if (mod.estimate) {
    const from = def.mods[mod.from];
    lux1m = lux1m === null ? null : modifiedLux1m({ lux1m, flux: ESTIMATES[mod.estimate].flux, fromAreaCm2: from.areaCm2, areaCm2: mod.areaCm2 });
    kind = kind === 'placeholder' ? 'placeholder' : 'estimate';
  }
  return {
    preset: def === LIGHTS.custom ? 'custom' : light.preset,
    mod: modId,
    role,
    label: def.label,
    short: def.short,
    modLabel: mod.label,
    lux1m,
    figure: kind,
    estimate: mod.estimate || null,
    areaCm2: mod.areaCm2,
    table: mod.table || null,
    distanceCm: light.distanceCm,
    output: light.output ?? 100,
    angleDeg: LIGHT_ROLES[role].angleDeg,
    aimedAway: !!LIGHT_ROLES[role].aimedAway,
    colour: def.colour,
  };
}

function sourceFigure(mod, light, panelLux1m) {
  if (mod.lux1m === 'yours') {
    return Number.isFinite(panelLux1m) && panelLux1m > 0
      ? { lux1m: panelLux1m, kind: 'yours' }
      : { lux1m: PANEL_PLACEHOLDER_LUX, kind: 'placeholder' };
  }
  if (mod.lux1m === 'typed') {
    return Number.isFinite(light.lux1m) && light.lux1m > 0
      ? { lux1m: light.lux1m, kind: 'yours' }
      : { lux1m: null, kind: 'yours' };
  }
  return { lux1m: mod.lux1m, kind: 'maker' };
}

// ── Layouts ──────────────────────────────────────────────────

const pl48 = (role, distanceCm, mod = 'panel') => ({ preset: 'pl48', mod, role, distanceCm, output: 100, lux1m: null });
const cob = (preset, mod, role, distanceCm) => ({ preset, mod, role, distanceCm, output: 100, lux1m: null });

/**
 * Starting layouts: where the panels stood on 2026-10-24, as a guess,
 * and the four ways up from there. `buy` lists what a tier adds, priced
 * from the tables above.
 */
export const SCENARIOS = [
  {
    id: 'today',
    label: 'Today',
    blurb: 'Three PL48 panels from the front, about 1 m away. A guess at the 2026-10-24 layout: set your real distances.',
    buy: [],
    lights: [pl48('key', 100), pl48('fill', 100), pl48('front', 100)],
  },
  {
    id: 'free',
    label: 'Free',
    tier: true,
    blurb: 'The same panels, each with a job: key closer, fill farther at about half, the third behind as a rim.',
    buy: [],
    lights: [pl48('key', 42), pl48('fill', 62), pl48('rim', 70)],
  },
  {
    id: 'cheap',
    label: 'Cheap',
    tier: true,
    blurb: 'A 5-in-1 reflector\'s translucent disc held over the key panel, and the fill moved back to stay at half: smoother highlights on gloss, paid for with the stop the free layout gained.',
    buy: [{ accessory: 'disc-5in1' }],
    lights: [pl48('key', 42, 'diffused'), pl48('fill', 90), pl48('rim', 70)],
  },
  {
    id: 'best-value',
    label: 'Best value',
    tier: true,
    blurb: 'One high-CRI COB as the key in a 60 x 60 softbox; the panels stay as fill and rim.',
    buy: [{ light: 'godox-sl60iid' }, { accessory: 'softbox-60' }],
    lights: [cob('godox-sl60iid', 'softbox-60', 'key', 45), pl48('fill', 62), pl48('rim', 70)],
  },
  {
    id: 'more',
    label: 'More',
    tier: true,
    blurb: 'Two COBs: the key in a 60 x 60 softbox, the fill in a 60 x 90, one panel as the rim. About the light of best value, with no green left in the shadows.',
    buy: [{ light: 'godox-sl60iid' }, { accessory: 'softbox-60' }, { light: 'godox-sl60iid' }, { accessory: 'softbox-90' }],
    lights: [cob('godox-sl60iid', 'softbox-60', 'key', 45), cob('godox-sl60iid', 'softbox-90', 'fill', 62), pl48('rim', 70)],
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map(s => [s.id, s]));

/**
 * The lowest card price in a list that can be bought today and was read
 * today, in CLP. Bank transfer is usually 5% under it.
 */
export function lowestPrice(prices = []) {
  const lows = prices.filter(p => !p.out && !p.seen)
    .map(p => (Array.isArray(p.clp) ? p.clp[0] : p.clp)).filter(Number.isFinite);
  return lows.length ? Math.min(...lows) : null;
}

/** What a tier costs at the lowest checked card prices, or null if any part is unpriced. */
export function tierCost(scenario) {
  let total = 0;
  for (const item of scenario.buy || []) {
    const prices = item.light ? LIGHTS[item.light]?.prices : ACCESSORIES[item.accessory]?.prices;
    const low = lowestPrice(prices);
    if (low === null) return null;
    total += low;
  }
  return total;
}

const clp = n => `CLP ${n.toLocaleString('en-US')}`;

/** "CLP 169,990", "about CLP 247,500", "CLP 18,000 to 40,000", "CLP 230,000 and up". */
export function priceLabel(p) {
  if (Array.isArray(p.clp)) {
    const [low, high] = p.clp;
    return high === null ? `${clp(low)} and up` : `${clp(low)} to ${high.toLocaleString('en-US')}`;
  }
  return `${p.about ? 'about ' : ''}${clp(p.clp)}`;
}

export { clp };
