// ── The a6700 menu tree ──────────────────────────────────────
// Aggregates the per-tab transcriptions (js/data/tree/) into the shape
// the camera view renders. Structure and labels come from the help
// guide (read 2026-08-28); tab order is the verified on-screen order.
// A row the setup object models carries `ref`, the id of the live row
// in data/menu.js; a row without one renders read-only, never a fake
// control (contract C2, docs/plans/2026-08-22-rigcheck-rework.md).
// `children` are rows living inside a parent row's own screen on the
// body; a `link` is a Main-tab tile that opens the row it names.

import { MAIN_TAB } from './tree/main.js';
import { SHOOTING_TAB } from './tree/shooting.js';
import { EXPOSURE_TAB } from './tree/exposure-color.js';
import { FOCUS_TAB } from './tree/focus.js';
import { MY_MENU_TAB, PLAYBACK_TAB, NETWORK_TAB, SETUP_TAB } from './tree/library.js';

/** Verified on-screen order: My Menu, Main, then the six work tabs. */
export const TREE = [
  MY_MENU_TAB, MAIN_TAB, SHOOTING_TAB, EXPOSURE_TAB, FOCUS_TAB,
  PLAYBACK_TAB, NETWORK_TAB, SETUP_TAB,
];

/** Every real row, flat, children included. Link tiles are excluded:
 *  they are doors, not rows. */
export const TREE_ITEMS = [];
export const TREE_PATH = {};
for (const tab of TREE) {
  for (const grp of tab.groups) {
    for (const item of grp.items) {
      if (item.link) continue;
      TREE_ITEMS.push(item);
      TREE_PATH[item.id] = { tabId: tab.id, groupId: grp.id };
      for (const child of item.children || []) {
        TREE_ITEMS.push(child);
        TREE_PATH[child.id] = { tabId: tab.id, groupId: grp.id, parentId: item.id };
      }
    }
  }
}

export const TREE_ITEM_BY_ID = Object.fromEntries(TREE_ITEMS.map(i => [i.id, i]));

/** A link tile resolves to the row it opens; a real row is itself. */
export function resolveItem(itemOrTile) {
  if (itemOrTile?.link) return TREE_ITEM_BY_ID[itemOrTile.link] || null;
  return itemOrTile || null;
}

/** Rows visible with the dial at `mode` ('still' | 'movie'). */
export function itemsForMode(items, mode) {
  return items.filter(i => i.modes === 'both' || i.modes === mode);
}

/** Groups of a tab visible in a mode, with their visible items. */
export function groupsForMode(tab, mode) {
  return tab.groups
    .filter(grp => !grp.modes || grp.modes === mode)
    .map(grp => ({ ...grp, items: itemsForMode(grp.items, mode) }))
    .filter(grp => grp.items.length);
}
