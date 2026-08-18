// ── Entry point ──────────────────────────────────────────────
// Load stored setups, resolve the hash, draw, bind. Nothing else.

import { load } from './state.js';
import { applyRoute } from './router.js';
import { render } from './render.js';
import { bindEvents } from './events.js';

function init() {
  load();
  // Route before the first render: a shared link should show its own setup,
  // not whatever was last open in this browser.
  applyRoute();
  bindEvents();
  render();
}

init();
