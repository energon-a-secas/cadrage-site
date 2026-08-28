// ── Walkthrough ──────────────────────────────────────────────
// One track at a time, phases in order, steps as cards. A video step
// with a `set` list can write its argued-for values into the active
// setup; the values shown are computed against the current config, so
// what the button promises is what it writes. Done marks live in
// state.progress under 'walk:<stepId>'.

import { escHtml, renderMarkdown } from '../utils.js';
import { state, activeConfig } from '../state.js';
import { WALK_TRACKS, stepsForTrack, phasesForTrack } from '../data/walkthroughs.js';
import { LESSON_BY_ID } from '../data/lessons.js';
import { TREE_ITEM_BY_ID } from '../data/menu-tree.js';
import { panel, chip } from '../ui.js';

const doneKey = id => `walk:${id}`;

export function renderWalkthrough() {
  const track = state.route.param;
  if (track && WALK_TRACKS[track]) return trackPage(track);
  return chooser();
}

// ── Choosing a track ─────────────────────────────────────────

function chooser() {
  return `
    <div class="view view--walk">
      ${panel({
        title: 'Walkthrough',
        lead: 'A pass through the camera in the order the decisions depend on each other. Format before exposure, exposure before colour, and the review at the end to judge the whole thing.',
        body: `<div class="wchoose">${Object.entries(WALK_TRACKS).map(([id, t]) => trackCard(id, t)).join('')}</div>`,
      })}
    </div>`;
}

function trackCard(id, t) {
  const steps = stepsForTrack(id);
  const done = steps.filter(s => state.progress[doneKey(s.id)]).length;
  return `
    <a class="wcard" href="#/walkthrough/${escHtml(id)}">
      <h3 class="wcard__title">${escHtml(t.label)}</h3>
      <p class="wcard__blurb">${escHtml(t.blurb)}</p>
      <div class="wcard__meta">${steps.length} steps${done ? `, ${done} done` : ''}</div>
    </a>`;
}

// ── One track ────────────────────────────────────────────────

function trackPage(track) {
  const t = WALK_TRACKS[track];
  const steps = stepsForTrack(track);
  const done = steps.filter(s => state.progress[doneKey(s.id)]).length;
  const config = activeConfig();

  const phases = phasesForTrack(track).map(phase => {
    const own = steps.filter(s => s.phase === phase);
    return `
      <section class="section wphase">
        <div class="section__header">
          <div class="section__titles"><h2 class="section__title">${escHtml(phase)}</h2></div>
        </div>
        ${own.map(s => stepCard(s, steps.indexOf(s) + 1, config)).join('')}
      </section>`;
  }).join('');

  return `
    <div class="view view--walk">
      <nav class="lesson__crumbs">
        <a href="#/walkthrough">Walkthrough</a>
        <span aria-hidden="true">/</span>
        <span>${escHtml(t.label)}</span>
      </nav>
      ${panel({
        title: `${t.label} walkthrough`,
        lead: `${escHtml(t.blurb)} Progress: ${done} of ${steps.length}.`,
        body: progressBar(done, steps.length),
      })}
      ${phases}
    </div>`;
}

function progressBar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="wbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;
}

function stepCard(s, n, config) {
  const isDone = !!state.progress[doneKey(s.id)];
  const row = s.menuId ? TREE_ITEM_BY_ID[s.menuId] : null;
  const lesson = s.lesson ? LESSON_BY_ID[s.lesson] : null;

  const sets = (s.set || []).map(w => {
    const value = typeof w.value === 'function' ? w.value(config) : w.value;
    return `<li>${escHtml(w.label)} <code>${escHtml(displayValue(value))}</code></li>`;
  });

  const actions = [
    row ? `<a class="btn btn--secondary btn--sm" href="#/camera/${encodeURIComponent(row.id)}">Show on the camera</a>` : '',
    lesson ? `<a class="btn btn--ghost btn--sm" href="#/learn/${encodeURIComponent(lesson.id)}">Read why</a>` : '',
    s.tool ? `<a class="btn btn--ghost btn--sm" href="#/tools/${encodeURIComponent(s.tool)}">Calculator</a>` : '',
    sets.length ? `<button type="button" class="btn btn--primary btn--sm" data-walk-apply="${escHtml(s.id)}">Apply to the setup</button>` : '',
    `<button type="button" class="btn btn--ghost btn--sm" data-walk-done="${escHtml(s.id)}">${isDone ? 'Done. Undo' : 'Mark done'}</button>`,
  ].filter(Boolean).join('');

  return `
    <article class="wstep${isDone ? ' is-done' : ''}" id="step-${escHtml(s.id)}">
      <header class="wstep__head">
        <span class="wstep__n">${n}</span>
        <h3 class="wstep__title">${escHtml(s.title)}</h3>
        ${row ? chip(row.label, 'area') : ''}
        ${isDone ? '<span class="lcard__tick" title="Done">&#10003;</span>' : ''}
      </header>
      <div class="wstep__body">${renderMarkdown(s.why)}</div>
      ${sets.length ? `<ul class="wstep__sets">${sets.join('')}</ul>` : ''}
      <footer class="wstep__foot">${actions}</footer>
    </article>`;
}

function displayValue(v) {
  if (v === true) return 'On';
  if (v === false) return 'Off';
  if (v === null || v === undefined) return 'not recorded';
  return String(v);
}
