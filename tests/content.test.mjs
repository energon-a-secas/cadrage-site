// ── Content integrity ────────────────────────────────────────
// The contracts from docs/plans/2026-08-22-rigcheck-rework.md, held as
// tests: every cross-reference between rules, lessons, walkthrough
// steps, the menu tree and the live-row registry must resolve. Plain
// node, no framework: `make test`.

import { readFileSync, readdirSync } from 'node:fs';
import { RULES } from '../js/engine/rules.js';
import { LESSONS, LESSON_BY_ID, TRACKS, LEVELS } from '../js/data/lessons.js';
import { WALKTHROUGHS, WALK_BY_ID, WALK_TRACKS } from '../js/data/walkthroughs.js';
import { TREE, TREE_ITEMS, TREE_ITEM_BY_ID, TREE_PATH } from '../js/data/menu-tree.js';
import { MENU_ITEMS } from '../js/data/menu.js';
import { BASIS } from '../js/data/basis.js';
import { blank } from '../js/data/presets.js';
import { readPath } from '../js/state.js';

let pass = 0;
const failures = [];
function ok(label, good, detail = '') {
  if (good) pass++;
  else failures.push(`${label}${detail ? `\n    ${detail}` : ''}`);
}

const TOOL_IDS = ['flicker', 'dof', 'spill', 'equiv', 'card'];

// ── C1: lessons ──────────────────────────────────────────────
{
  const ids = LESSONS.map(l => l.id);
  ok('lesson ids unique', new Set(ids).size === ids.length);
  ok('there are lessons at all', LESSONS.length >= 20, `count ${LESSONS.length}`);

  for (const l of LESSONS) {
    ok(`${l.id}: level valid`, !!LEVELS[l.level], String(l.level));
    ok(`${l.id}: track valid`, !!TRACKS[l.track], String(l.track));
    ok(`${l.id}: basis valid`, !!BASIS[l.basis], String(l.basis));
    ok(`${l.id}: has order`, Number.isFinite(l.order));
    ok(`${l.id}: summary under 160 chars`, typeof l.summary === 'string' && l.summary.length <= 160, `${l.summary?.length}`);
    ok(`${l.id}: body is prose`, typeof l.body === 'string' && l.body.trim().length > 400, `${l.body?.trim().length} chars`);
    for (const m of l.menu || []) ok(`${l.id}: menu ref ${m} resolves`, !!TREE_ITEM_BY_ID[m]);
    for (const t of l.tools || []) ok(`${l.id}: tool ${t} valid`, TOOL_IDS.includes(t));
    for (const r of l.related || []) ok(`${l.id}: related ${r} resolves`, !!LESSON_BY_ID[r]);
  }

  // Every rule's learn pointer resolves; the promise findingCard makes.
  for (const r of RULES) {
    ok(`rule ${r.id}: learn '${r.learn}' resolves`, !!LESSON_BY_ID[r.learn]);
  }
}

// ── C2: the tree ─────────────────────────────────────────────
{
  const ids = TREE_ITEMS.map(i => i.id);
  ok('tree ids unique', new Set(ids).size === ids.length,
    ids.filter((x, i) => ids.indexOf(x) !== i).join(', '));
  ok('tree has the full transcription', TREE_ITEMS.length >= 260, `count ${TREE_ITEMS.length}`);
  ok('eight tabs', TREE.length === 8);

  const live = new Set(MENU_ITEMS.map(i => i.id));
  for (const item of TREE_ITEMS) {
    ok(`${item.id}: modes valid`, ['both', 'still', 'movie'].includes(item.modes));
    if (item.ref) ok(`${item.id}: ref '${item.ref}' is a live row`, live.has(item.ref));
    ok(`${item.id}: has a path`, !!TREE_PATH[item.id]);
  }
  for (const tab of TREE) {
    for (const grp of tab.groups) {
      for (const it of grp.items) {
        if (it.link) ok(`link tile ${it.id} resolves`, !!TREE_ITEM_BY_ID[it.link], it.link);
      }
    }
  }
  // Rows the walkthroughs advertised before the tree landed.
  for (const id of ['shutter-speed', 'aperture', 'frame-rate', 'record-setting', 'var-shutter', 'anti-flicker', 'shoot-mode', 'select-lut', 'manage-user-luts']) {
    ok(`tree carries ${id}`, !!TREE_ITEM_BY_ID[id]);
  }
  // The row research proved absent stays absent.
  ok('no embed-lut row in the tree', !TREE_ITEM_BY_ID['embed-lut']);
}

// ── C3: walkthroughs ─────────────────────────────────────────
{
  const base = blank();
  const ids = WALKTHROUGHS.map(s => s.id);
  ok('step ids unique', new Set(ids).size === ids.length);
  for (const s of WALKTHROUGHS) {
    ok(`${s.id}: track valid`, !!WALK_TRACKS[s.track]);
    if (s.menuId) ok(`${s.id}: menuId '${s.menuId}' resolves`, !!TREE_ITEM_BY_ID[s.menuId]);
    if (s.lesson) ok(`${s.id}: lesson '${s.lesson}' resolves`, !!LESSON_BY_ID[s.lesson]);
    if (s.tool) ok(`${s.id}: tool '${s.tool}' valid`, TOOL_IDS.includes(s.tool));
    ok(`${s.id}: photo steps never write`, s.track !== 'photo' || (s.set || []).length === 0);
    for (const w of s.set || []) {
      const exists = readPath(base, w.path) !== undefined;
      ok(`${s.id}: set path '${w.path}' exists in blank()`, exists);
      const value = typeof w.value === 'function' ? w.value(base) : w.value;
      ok(`${s.id}: value for '${w.path}' is concrete`, value !== undefined);
    }
  }
  ok('WALK_BY_ID covers all', Object.keys(WALK_BY_ID).length === WALKTHROUGHS.length);
}

// ── Copy rules over the content files ────────────────────────
{
  const files = [
    ...readdirSync('js/data/lessons').map(f => `js/data/lessons/${f}`),
    'js/data/lessons.js', 'js/data/walkthroughs.js', 'js/data/menu-tree.js',
    ...readdirSync('js/data/tree').map(f => `js/data/tree/${f}`),
  ];
  const banned = ['powerful', 'seamless', 'leverages', 'robust', 'utilize'];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    ok(`${f}: no em dash`, !text.includes('-'));
    for (const w of banned) {
      ok(`${f}: no '${w}'`, !new RegExp(`\\b${w}\\b`, 'i').test(text));
    }
  }
}

// ── Report ───────────────────────────────────────────────────
if (failures.length) {
  console.error(`${failures.length} FAILED, ${pass} passed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`${pass} assertions passed`);
