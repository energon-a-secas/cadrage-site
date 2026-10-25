# CLAUDE.md: Cadrage

Cadrage: learn the camera, walk through a setup, and review it for the settings that contradict each other, do nothing, or get corrected twice in post (cadrage.neorgon.com)

**Live:** cadrage.neorgon.com · **Port:** 8860

## Run

```bash
make serve
```

Then open http://localhost:8860. It must be served over HTTP. The app is ES modules, and `file://` blocks them. `make serve` uses the monorepo's `scripts/serve.py` (no-cache) when available; the plain fallback caches stale modules after edits.

```bash
make test    # tests/engine.test.mjs + tests/content.test.mjs
```

## Sections

Five routes, built around one setup object: **Learn** (25 lessons, basics to advanced, six tracks) · **Walkthrough** (ordered video and photo passes; video steps can write into the setup) · **Camera** (the a6700 menu replica, 280 rows) · **Review** (the 28-rule lint) · **Calculators**. Old routes `menu`, `post`, `profiles` are aliases.

## Architecture

| Module | Owns |
|---|---|
| `js/engine/rules.js` | `AREAS`, `SEVERITY`, `RULES` (28, each with `learn` pointing at a lesson id); the Format area lives in `js/engine/rules/format.js` and is spread back in place |
| `js/data/menu.js` | `MENU_ITEMS`: the live-row registry (label, `value(c)`, `controls`, `sid`, `rules`) |
| `js/data/menu-tree.js` | aggregates `js/data/tree/*.js` into `TREE` (8 tabs), `TREE_ITEMS`, `TREE_PATH`, mode filters |
| `js/data/tree/*.js` | the transcribed a6700 menu (source: help guide, read 2026-08-28); `main.js` is the tile screen |
| `js/data/lessons.js` | aggregates `js/data/lessons/*.js`; `LESSONS`, `TRACKS`, `LEVELS`, `neighbours` |
| `js/data/walkthroughs.js` | `WALKTHROUGHS` (13 video + 11 photo steps), `stepsForTrack`, `phasesForTrack` |
| `js/views/camera.js` | the replica: cursor (`state.camera`), keyboard model, tile grid, detail card |
| `js/views/learn.js` / `walkthrough.js` | index + lesson page; track pages + step cards |
| `js/views/review.js` / `quick-edit.js` / `tools.js` | the review page, its quick editor, the five calculators (the card one matches a card to a format) |
| `js/data/cards.js` | Sony's card per File Format and shooting mode (`CARD_FLOORS`, six tables), Sony's recordable times, and the SD Association's speed marks, buses and capacity standards |
| `js/engine/interactions.js`, `calc.js`, `lint.js` | which settings the camera reads; the arithmetic; the runner |

Contracts between these are frozen in the root repo's `docs/plans/2026-08-22-rigcheck-rework.md` and held by `tests/content.test.mjs` (1,100+ assertions: every `learn`, `menu`, `ref`, `link`, `lesson` and `set[].path` reference must resolve).

Vendored from `packages/neorgon-ui/`: never edit in place, run the sync script instead: `js/neorgon-footer.js`, `js/neorgon-header.js`, `js/neorgon-dom.js`.

## Data

Storage keys (all `cadrage-*`): `configs`, `active`, `prefs` (includes the card you own: `cardGb`, `cardBus`, `cardUhs`, `cardVideo`), `progress` (lesson ids and `walk:<stepId>`), `rules-enabled`.

## Conventions

- Zero build step. Plain ES modules loaded by `js/app.js`.
- Header and footer come from the shared kits. Do not add site-local `.neo-footer` or `.header-bar` CSS.
- Every control writes through `data-path`; events.js is the only writer.
- Lesson bodies are markdown inside template literals: no backtick and no dollar-brace inside a body, ever. The content test enforces the em-dash and banned-word rules over all data files.
- `js/engine/rules.js` is past the ~500-line guideline. Split when touching it, do not grow it further: move the area you touch into `js/engine/rules/<area>.js`, as Format was on 2026-10-24.

## Gotchas

- **`patchDerived` must look the zone up fresh** (`document.getElementById`, not the `$` cache in utils). The zone div is replaced by every full render; patching the cached detached node updates nothing and looks exactly like an event handler that never ran. It did, for hours.
- **The tree and the live registry are different layers.** `js/data/tree/` is what the body shows (transcribed, mostly read-only rows); `js/data/menu.js` is what the setup models. A tree row goes live by carrying `ref: <menu.js id>`. Never invent a control on a tree row without a ref; the camera view renders unmodelled rows as documentation on purpose.
- **Embed LUT File does not exist on the a6700.** The full help-guide menu list (read 2026-08-28) has no such row; it is FX-line. The rule `format/embed-lut-locked-on-sd` is deliberately `unverified` (ships off) and the config keeps `colour.embedLut` for old notes. Do not "fix" the rule back to sony-spec.
- **Var. Shutter and Anti-flicker Shoot. are children of one row** (`anti-flicker-set`, Shooting > Shutter/Silent), and Shutter Speed exists only as a Main-tab tile. That is the camera's real shape, not a modelling shortcut.
- **File Format is a container plus a size.** The body lists XAVC HS 4K, XAVC S 4K, XAVC S HD, XAVC S-I 4K and XAVC S-I HD as one choice; the setup stores `format.container` and `format.res`, and the size select offers the keys of `FORMATS[container].modes`. So every size Sony lists needs its rows, or the invalid-combination rule calls a real mode impossible. XAVC S-I is Intra and its bitrate follows the frame rate, so its 60p and 50p are separate rows.
- **Format selects keep a stored value the table lacks**, labelled "(not offered)" by `withStored` in `bodies.js`. Without it the select shows its first option while the setup holds another, and a lone offered row (every XAVC S-I frame rate has one) looks chosen and can never be picked.
- **Setup-tab rows ignore the dial.** Their transcription `modes` meant "acts on", so the generator moved it to `actsOn` and forced `modes: 'both'`. Filter Setup by mode and rows will wrongly vanish.
- **Sony's card table and a card's marks can disagree, and both the card tool and the Review show both.** Sony gives one class per File Format and shooting mode, sized for the format's top bitrate, and nothing lower for lower Record Settings: V60 for XAVC HS 4K, while a V30 card's 30 MB/s covers 100M (12.5 MB/s). Never compress that into a single pass or fail, and never derive a Sony requirement from the arithmetic. The SDA matches marks within one family only, so V30 does not formally answer Sony's U3.
- **The setup's card is two rules on purpose.** `format/card-below-sony-list` (sony-spec, a note) holds the recorded card against Sony's movie table with Proxy off, since the setup models neither S&Q nor a proxy; `format/card-slower-than-stream` (physics, a warning) compares the marks' MB/s with the Record Setting. The user chose, on 2026-10-25, that turntable-55's U3 V30 card shows the note. `format.card` stays the capacity standard; `cardBus`, `cardUhs` and `cardVideo` are null until recorded, and both rules sit out without a mark.
- Camera keyboard: arrows move, Enter descends, Escape ascends; legacy key names (`Down`, `Esc`) are normalised in events.js because automation and old engines send them.

## Do not touch

- `js/neorgon-*.js` and `css/neorgon-*.css`: vendored kits, regenerated by `packages/neorgon-ui/sync-*.sh`.
