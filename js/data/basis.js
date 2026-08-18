// ── Provenance ───────────────────────────────────────────────
// Every rule and every data row states where its claim comes from.
// A finding you cannot trace is a finding you cannot act on, so the
// UI renders this as a chip rather than hiding it in a comment.

export const BASIS = {
  physics: {
    label: 'Physics',
    blurb: 'Derived from arithmetic or optics. Holds regardless of camera model.',
    weight: 5,
  },
  'sony-spec': {
    label: 'Sony spec',
    blurb: 'Stated in the A6700 help guide. Quoted, not paraphrased.',
    weight: 4,
  },
  'industry-convention': {
    label: 'Convention',
    blurb: 'Standard practice in production. Widely agreed, not a law.',
    weight: 3,
  },
  'empirical-user': {
    label: 'Your notes',
    blurb: 'Something you recorded from your own shoots.',
    weight: 2,
  },
  unverified: {
    label: 'Unverified',
    blurb: 'Circulates widely but no primary source confirms it. Off by default.',
    weight: 1,
  },
};

export const BASIS_ORDER = ['physics', 'sony-spec', 'industry-convention', 'empirical-user', 'unverified'];

/** Unverified rules never fire unless you deliberately switch them on. */
export function defaultEnabled(basis) {
  return basis !== 'unverified';
}
