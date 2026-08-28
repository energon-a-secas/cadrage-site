// ── Learn ────────────────────────────────────────────────────
// The curriculum: tracks in learning order, basics before advanced
// inside each. A lesson page renders its markdown body and then points
// outward: at the camera rows it discusses, at the calculator that
// does its arithmetic, and at its neighbours. Progress is a local
// checkmark, stored per lesson id, worth exactly what a checkmark is.

import { escHtml, renderMarkdown } from '../utils.js';
import { state } from '../state.js';
import { LESSONS, LESSON_BY_ID, TRACKS, TRACK_ORDER, LEVELS, lessonsForTrack, neighbours } from '../data/lessons.js';
import { TREE_ITEM_BY_ID } from '../data/menu-tree.js';
import { RULES } from '../engine/rules.js';
import { basisChip, chip, panel } from '../ui.js';

export function renderLearn() {
  const id = state.route.param;
  if (id && LESSON_BY_ID[id]) return lessonPage(LESSON_BY_ID[id]);
  return index();
}

// ── Index ────────────────────────────────────────────────────

function index() {
  const read = LESSONS.filter(l => state.progress[l.id]).length;
  const tracks = TRACK_ORDER
    .filter(trk => lessonsForTrack(trk).length)
    .map(trackSection).join('');

  return `
    <div class="view view--learn">
      ${panel({
        title: 'Learn',
        lead: `Basics before advanced, in the order the decisions actually depend on each other. ${LESSONS.length} lessons, ${read} read. Every camera claim carries the same provenance chip the review uses.`,
        body: '',
      })}
      ${tracks}
    </div>`;
}

function trackSection(trackId) {
  const track = TRACKS[trackId];
  const list = lessonsForTrack(trackId);
  return `
    <section class="section ltrack">
      <div class="section__header">
        <div class="section__titles">
          <h2 class="section__title">${escHtml(track.label)}</h2>
          <p class="section__lead">${escHtml(track.blurb)}</p>
        </div>
      </div>
      <div class="lgrid">${list.map(lessonCard).join('')}</div>
    </section>`;
}

function lessonCard(l) {
  const done = !!state.progress[l.id];
  return `
    <a class="lcard${done ? ' is-read' : ''}" href="#/learn/${encodeURIComponent(l.id)}">
      <div class="lcard__top">
        <span class="lvl lvl--${escHtml(l.level)}">${escHtml(LEVELS[l.level]?.label || l.level)}</span>
        ${done ? '<span class="lcard__tick" title="Read">&#10003;</span>' : ''}
      </div>
      <h3 class="lcard__title">${escHtml(l.title)}</h3>
      <p class="lcard__summary">${escHtml(l.summary)}</p>
    </a>`;
}

// ── One lesson ───────────────────────────────────────────────

function lessonPage(l) {
  const done = !!state.progress[l.id];
  const { prev, next } = neighbours(l.id);
  const ruleCount = RULES.filter(r => r.learn === l.id).length;

  return `
    <div class="view view--lesson">
      <nav class="lesson__crumbs">
        <a href="#/learn">Learn</a>
        <span aria-hidden="true">/</span>
        <span>${escHtml(TRACKS[l.track]?.label || l.track)}</span>
      </nav>
      <article class="lesson">
        <header class="lesson__head">
          <div class="lesson__marks">
            <span class="lvl lvl--${escHtml(l.level)}">${escHtml(LEVELS[l.level]?.label || l.level)}</span>
            ${chip(TRACKS[l.track]?.label || l.track, 'area')}
            ${basisChip(l.basis)}
            ${ruleCount ? chip(`${ruleCount} review rule${ruleCount === 1 ? '' : 's'} cite this`) : ''}
          </div>
          <h2 class="lesson__title">${escHtml(l.title)}</h2>
          <p class="lesson__summary">${escHtml(l.summary)}</p>
        </header>
        <div class="lesson__body">${renderMarkdown(l.body)}</div>
        ${lessonLinks(l)}
        <footer class="lesson__foot">
          <button type="button" class="btn ${done ? 'btn--secondary' : 'btn--primary'} btn--sm" data-lesson-done="${escHtml(l.id)}">
            ${done ? 'Read. Mark unread' : 'Mark as read'}
          </button>
          <div class="lesson__pager">
            ${prev ? `<a class="btn btn--ghost btn--sm" href="#/learn/${encodeURIComponent(prev.id)}">&larr; ${escHtml(prev.title)}</a>` : ''}
            ${next ? `<a class="btn btn--ghost btn--sm" href="#/learn/${encodeURIComponent(next.id)}">${escHtml(next.title)} &rarr;</a>` : ''}
          </div>
        </footer>
      </article>
    </div>`;
}

/** The outward links: camera rows, calculators, related lessons. */
function lessonLinks(l) {
  const rows = (l.menu || [])
    .map(id => TREE_ITEM_BY_ID[id])
    .filter(Boolean)
    .map(item => `<a class="btn btn--secondary btn--sm" href="#/camera/${encodeURIComponent(item.id)}">${escHtml(item.label)}</a>`);
  const tools = (l.tools || [])
    .map(id => `<a class="btn btn--secondary btn--sm" href="#/tools/${encodeURIComponent(id)}">Calculator: ${escHtml(id)}</a>`);
  const rel = (l.related || [])
    .map(id => LESSON_BY_ID[id])
    .filter(Boolean)
    .map(r => `<a class="btn btn--ghost btn--sm" href="#/learn/${encodeURIComponent(r.id)}">${escHtml(r.title)}</a>`);

  if (!rows.length && !tools.length && !rel.length) return '';
  return `
    <aside class="lesson__links">
      ${rows.length ? `<div class="lesson__linkrow"><span class="lesson__linklabel">On the camera</span>${rows.join('')}</div>` : ''}
      ${tools.length ? `<div class="lesson__linkrow"><span class="lesson__linklabel">Do the arithmetic</span>${tools.join('')}</div>` : ''}
      ${rel.length ? `<div class="lesson__linkrow"><span class="lesson__linklabel">Related</span>${rel.join('')}</div>` : ''}
    </aside>`;
}
