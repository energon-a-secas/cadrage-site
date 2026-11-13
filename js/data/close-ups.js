// ── Close-up accessories ─────────────────────────────────────
// What gets a lens closer without replacing it: extension tubes behind
// it, close-up lenses in front. The arithmetic is engine/optics.js; the
// figures here are each maker's, or a distributor's where it says so.

/**
 * What can go behind or in front of a lens. A tube's `mm` is its length;
 * a close-up lens's strength is in dioptres. `product` names the entry
 * in LENS_EXTRAS that sells it.
 */
export const CLOSE_UPS = {
  none: { label: 'None', kind: 'none' },
  'tube-10': { label: '10 mm tube', phrase: 'a 10 mm tube', kind: 'tube', mm: 10, product: 'tubes' },
  'tube-16': { label: '16 mm tube', phrase: 'a 16 mm tube', kind: 'tube', mm: 16, product: 'tubes' },
  'tube-26': { label: '10 + 16 mm tubes', phrase: 'both tubes, 26 mm', kind: 'tube', mm: 26, product: 'tubes' },
  'hoya-4': { label: '+4 close-up lens (Hoya No.4)', phrase: 'a +4 close-up lens', kind: 'dioptre', dioptres: 4, product: 'hoya' },
  'raynox-250': { label: '+8 close-up lens (Raynox DCR-250)', phrase: 'a +8 close-up lens', kind: 'dioptre', dioptres: 8, product: 'raynox' },
  'nisi-9': { label: '+9 close-up lens (NiSi NC 49mm)', phrase: 'a +9 close-up lens', kind: 'dioptre', dioptres: 9, product: 'nisi' },
};

/** The accessories themselves: what each is, whose figures, what it costs. */
export const LENS_EXTRAS = {
  tubes: {
    label: 'Extension tubes, 10 + 16 mm, Sony E',
    kind: 'Meike MK-S-AF3A: two tubes used alone or together, so 10, 16 or 26 mm, for full-frame and APS-C E-mount bodies. Meike calls it an auto focus tube and says it "requires exposure compensation", which is the light a tube costs. Its page does not say in so many words that the aperture passes through, so try f/8 on it before relying on it. Viltrox sells the same pair as the DG-NEX.',
    src: 'Meike\'s product page',
    url: 'https://meikeglobal.com/products/meike-mk-s-af3a-metal-auto-focus-macro-extension-tube-adapter-ring-10mm-16mm-for-sony-mirrorless-e-mount-fe-mount-a7-nex-camera-a7-a7m2-nex3-nex5-nex6-nex7-a5000-a5100-a6000-a6300-a6500-a9-a7iii',
    usd: { value: 29.99, note: 'at Meike\'s own store' },
  },
  hoya: {
    label: 'Hoya Close-Up Lens Set II, 49 mm',
    kind: 'Three screw-in close-up lenses, +1, +2 and +4, made in the Zeiss\'s 49 mm thread. Hoya\'s own table, for a lens that focuses to 50 cm, puts the +4 at 17 to 25 cm from the front of the lens.',
    src: 'Hoya\'s product page',
    url: 'https://hoyafilter.com/product/close_up_lens_set_ii/',
  },
  raynox: {
    label: 'Raynox DCR-250',
    kind: 'A +8 two-group close-up lens on a snap-on adapter for 52 to 67 mm threads, so the Zeiss\'s 49 mm thread needs a 49 to 52 mm step-up ring. Listed at EUR 79.90 in OM System\'s European store.',
    src: 'OM System\'s store page, a distributor: Raynox\'s own site could not be read',
    url: 'https://explore.omsystem.com/bg/en/raynox-dcr-250',
  },
  nisi: {
    label: 'NiSi Close Up Lens Kit NC 49mm',
    kind: 'A +9 close-up lens that screws straight onto the Zeiss\'s 49 mm thread, with rings for 62 and 67 mm. NiSi gives its working distance as about 2 to 14 cm.',
    src: 'NiSi USA\'s product page',
    url: 'https://nisiopticsusa.com/product/nisi-close-up-lens-kit-nc-49mm-with-62-and-67mm-adaptors',
    usd: { value: 109, note: 'at NiSi\'s US store' },
  },
};

/** Who stands behind the lens prices, and what was left out. */
export const LENS_SHOP_NOTE = 'Prices are from Tripodes, Rincón Fotográfico, Apertura and David and Joseph, read on the date shown; Rincón\'s bank transfer price is 5% under its card price, and Apertura shows only its cash or transfer price. Marketplace sellers on Falabella list some of these lenses for less; they are left out because the seller changes with the listing. None of the tubes or close-up lenses turned up at a shop in Chile that allows reading, and Mercado Libre does not allow it.';
