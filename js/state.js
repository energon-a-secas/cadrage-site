// ── State ────────────────────────────────────────────────────
// One exported mutable object, imported by every module. Storage is split
// across several small keys rather than one blob, so a corrupt profile list
// cannot take your preferences with it.

import { blank, loadPreset, fromPartial, CONFIG_VERSION } from './data/presets.js';
import { defaultEnabled } from './data/basis.js';

const KEYS = {
  configs: 'cadrage-configs',
  active: 'cadrage-active',
  prefs: 'cadrage-prefs',
  progress: 'cadrage-progress',
  rules: 'cadrage-rules-enabled',
};

export const state = {
  configs: [],
  activeId: null,
  prefs: {
    coc: '4k',
    cardGb: 128,
    showPassed: false,
    seenIntro: false,
  },
  progress: {},        // lessonId -> true
  rulesEnabled: {},    // ruleId -> boolean, overriding basis defaults
  compareId: null,     // second config for the diff view
  route: { section: 'review', param: null, query: {} },
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota or private browsing */ }
}

/**
 * Migrate a stored config to the current shape. Merging over `blank()` both
 * backfills fields added since it was saved and keeps the engine's assumption
 * that every path it reads exists.
 */
function hydrateConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const merged = fromPartial(raw);
  merged.v = CONFIG_VERSION;
  return merged;
}

export function load() {
  const storedConfigs = read(KEYS.configs, null);
  state.configs = Array.isArray(storedConfigs)
    ? storedConfigs.map(hydrateConfig).filter(Boolean)
    : [];

  // First visit: seed the presets so there is something to look at.
  if (!state.configs.length) {
    state.configs = [loadPreset('turntable-55'), loadPreset('handson-15')].filter(Boolean);
  }

  const storedActive = read(KEYS.active, null);
  state.activeId = state.configs.some(c => c.id === storedActive)
    ? storedActive
    : state.configs[0]?.id || null;

  Object.assign(state.prefs, read(KEYS.prefs, {}));
  state.progress = read(KEYS.progress, {}) || {};
  state.rulesEnabled = read(KEYS.rules, {}) || {};
}

export function saveConfigs() { write(KEYS.configs, state.configs); }
export function saveActive() { write(KEYS.active, state.activeId); }
export function savePrefs() { write(KEYS.prefs, state.prefs); }
export function saveProgress() { write(KEYS.progress, state.progress); }
export function saveRules() { write(KEYS.rules, state.rulesEnabled); }

export function activeConfig() {
  return state.configs.find(c => c.id === state.activeId) || state.configs[0] || blank();
}

export function compareConfig() {
  if (!state.compareId) return null;
  return state.configs.find(c => c.id === state.compareId) || null;
}

/** Replace the active config wholesale (used by fixes and the editor). */
export function setActiveConfig(next) {
  const i = state.configs.findIndex(c => c.id === state.activeId);
  if (i === -1) {
    state.configs.push(next);
    state.activeId = next.id;
  } else {
    state.configs[i] = next;
  }
  saveConfigs();
}

/** Write one dotted path into the active config. */
export function setPath(path, value) {
  const next = structuredClone(activeConfig());
  const parts = path.split('.');
  let node = next;
  for (const part of parts.slice(0, -1)) {
    if (node[part] === undefined || node[part] === null) node[part] = {};
    node = node[part];
  }
  node[parts[parts.length - 1]] = value;
  setActiveConfig(next);
  return next;
}

export function readPath(config, path) {
  return path.split('.').reduce((node, part) => (node == null ? node : node[part]), config);
}

export function addConfig(config) {
  const c = hydrateConfig(config);
  c.id = uniqueId(c.id || 'setup');
  state.configs.push(c);
  state.activeId = c.id;
  saveConfigs();
  saveActive();
  return c;
}

export function duplicateActive() {
  const src = activeConfig();
  const copy = structuredClone(src);
  copy.id = uniqueId(`${src.id}-copy`);
  copy.label = `${src.label} copy`;
  state.configs.push(copy);
  state.activeId = copy.id;
  saveConfigs();
  saveActive();
  return copy;
}

export function removeConfig(id) {
  state.configs = state.configs.filter(c => c.id !== id);
  if (state.activeId === id) state.activeId = state.configs[0]?.id || null;
  if (state.compareId === id) state.compareId = null;
  saveConfigs();
  saveActive();
}

function uniqueId(base) {
  const slug = String(base).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'setup';
  if (!state.configs.some(c => c.id === slug)) return slug;
  let n = 2;
  while (state.configs.some(c => c.id === `${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export function ruleEnabled(rule) {
  return state.rulesEnabled[rule.id] ?? defaultEnabled(rule.basis);
}

export function toggleRule(ruleId, basis) {
  const current = state.rulesEnabled[ruleId] ?? defaultEnabled(basis);
  state.rulesEnabled[ruleId] = !current;
  saveRules();
}

export { KEYS };
