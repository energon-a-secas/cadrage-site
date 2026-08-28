// ── Router ───────────────────────────────────────────────────
// `#/section/param?query`. Unknown sections fall back to review rather
// than rendering nothing. Old section names stay routable as aliases so
// a link shared before the rework still lands somewhere sensible.

import { state } from './state.js';

export const ROUTES = ['learn', 'walkthrough', 'camera', 'review', 'tools'];

/** Pre-rework names, kept as redirects rather than dead ends. */
const ALIASES = {
  menu: 'camera',
  post: 'review',
  profiles: 'review',
};

export function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const section = ALIASES[parts[0]] || parts[0] || 'review';
  return {
    section: ROUTES.includes(section) ? section : 'review',
    param: parts[1] ? decodeURIComponent(parts[1]) : null,
    query: Object.fromEntries(new URLSearchParams(queryPart || '')),
  };
}

/**
 * A shared link always wins over stored state: someone opening a `?c=` URL
 * expects to see that setup, not whatever they last had open.
 */
export function applyRoute() {
  state.route = parseRoute();
  return state.route;
}

export function go(section, param = null, query = null) {
  const q = query && Object.keys(query).length
    ? `?${new URLSearchParams(query)}`
    : '';
  location.hash = `#/${section}${param ? `/${encodeURIComponent(param)}` : ''}${q}`;
}

/** Update the hash without adding a history entry (filters, tab state). */
export function replace(section, param = null, query = null) {
  const q = query && Object.keys(query).length
    ? `?${new URLSearchParams(query)}`
    : '';
  history.replaceState(null, '', `#/${section}${param ? `/${encodeURIComponent(param)}` : ''}${q}`);
}
