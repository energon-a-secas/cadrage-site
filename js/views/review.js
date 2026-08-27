// ── Review ───────────────────────────────────────────────────
// The default view: one config in, findings out. Order matters here —
// the setup summary first so you can see what is being judged, then the
// findings, then what the camera is ignoring, then the claims that were
// deliberately not checked. A tool that reports only problems reads as an
// accusation; the same list with its inputs and its omissions visible
// reads as a check.

import { escHtml, shutterLabel } from '../utils.js';
import { state, activeConfig } from '../state.js';
import { lint, unverifiedSkips } from '../engine/lint.js';
import { interactions, lensLabel } from '../engine/interactions.js';
import { flicker } from '../engine/calc.js';
import { AREAS } from '../engine/rules.js';
import { FORMATS } from '../data/bodies.js';
import { basisChip, chip, panel, findingCard, kvRows, emptyState } from '../ui.js';
import { quickEditPanel } from './quick-edit.js';

/**
 * The view shell. `#reviewResults` is the only part that re-renders when a
 * field changes, which is what keeps focus and caret alive in the setup
 * inputs — a full re-render destroys both on every keystroke.
 */
export function renderReview() {
  const config = activeConfig();
  return `
    <div class="view view--review">
      ${configBar(config)}
      ${quickEditPanel(config)}
      <div id="reviewResults">${reviewResults()}</div>
    </div>`;
}

/** Everything derived from the config. Called again on every edit. */
export function reviewResults() {
  const config = activeConfig();
  const result = lint(config, state.rulesEnabled);
  const inter = interactions(config);
  const skips = unverifiedSkips(result);

  return `
      ${headline(config)}
      ${summary(result, inter)}
      ${findings(result)}
      ${ruleErrors(result)}
      ${skipped(skips)}
      ${interactionTable(inter)}`;
}

// ── Which config ─────────────────────────────────────────────

function configBar(config) {
  const options = state.configs.map(c =>
    `<option value="${escHtml(c.id)}"${c.id === config.id ? ' selected' : ''}>${escHtml(c.label)}</option>`).join('');
  return `
    <div class="config-bar">
      <label class="field field--inline">
        <span class="field__label">Setup</span>
        <select class="field__input" id="configPicker">${options}</select>
      </label>
      <div class="config-bar__meta">
        ${chip(FORMATS[config.format.container]?.label || config.format.container)}
        ${chip(`${config.format.fps}p`)}
        ${chip(shutterLabel(config.exposure.shutter.denom))}
        ${chip(`${config.room.mainsHz}Hz mains`)}
        ${chip(lensLabel(config))}
      </div>
    </div>
    ${config.note ? `<p class="config-note">${escHtml(config.note)}</p>` : ''}`;
}

// ── The headline: flicker arithmetic, shown rather than asserted ──

function headline(config) {
  const denom = config.exposure.shutter.denom;
  const f = flicker({ mainsHz: config.room.mainsHz, shutterDenom: denom, fps: config.format.fps });
  if (!f.ok) return '';

  const rows = [];
  rows.push([`Mains supply`, `${config.room.mainsHz} Hz`]);
  rows.push([`Light pulses at`, `${f.pulseHz} Hz, one every ${f.pulseMs.toFixed(2)} ms`]);
  if (denom) {
    rows.push([`Shutter open for`, `${f.exposureMs.toFixed(2)} ms at ${shutterLabel(denom)}`]);
    rows.push([
      `Pulses per exposure`,
      `<strong class="${f.clean ? 'is-good' : 'is-bad'}">${f.pulsesPerExposure.toFixed(3)}</strong> ${f.clean ? '(whole, so every frame collects the same light)' : '(not a whole number, so each frame catches a different slice)'}`,
    ]);
  }
  rows.push([`Speeds that land whole`, f.safeDenoms.map(d => `1/${d}`).join(', ')]);
  if (f.fps) {
    rows.push([
      `180-degree ideal at ${f.fps}p`,
      `1/${f.motionIdeal}${f.motionIdealSelectable ? '' : ', not one of the camera\'s 1/3-stop steps'}${f.motionIdealClean ? ', and flicker-clean here' : ', and not flicker-clean here'}`,
    ]);
    if (f.compromise) {
      const s = f.compromiseStops;
      rows.push([
        `Closest clean and selectable`,
        `1/${f.compromise}${Math.abs(s) > 0.01 ? ` (${s > 0 ? '+' : ''}${s.toFixed(2)} stops from the ideal)` : ''}`,
      ]);
    }
  }

  const verdict = !denom
    ? 'Shutter speed is on auto, so the camera picks it and flicker is left to chance.'
    : f.clean
      ? `${shutterLabel(denom)} lands on a whole light pulse at ${config.room.mainsHz} Hz.`
      : `${shutterLabel(denom)} does not divide the light pulse. ${f.nearestSafe ? `1/${f.nearestSafe} does.` : ''}`;

  return panel({
    title: 'Flicker, worked out',
    lead: `${escHtml(verdict)} ${basisChip('physics')}`,
    body: `
      <div class="proof">${kvRows(rows)}</div>
      <p class="proof__note">Change the mains frequency in the setup below and this recalculates. If it keeps the same verdict either way, it is not reading your config.</p>`,
  });
}

// ── Counts ───────────────────────────────────────────────────

function summary(result, inter) {
  const c = result.counts;
  const cards = [
    { n: c.error, label: 'Contradictions', mod: 'error' },
    { n: c.warn, label: 'Worth changing', mod: 'warn' },
    { n: c.note, label: 'Worth knowing', mod: 'note' },
    { n: c.inert + inter.ignoredCount, label: 'Doing nothing', mod: 'inert' },
  ];
  return `
    <div class="tally">
      ${cards.map(x => `
        <div class="tally__card tally__card--${x.mod}">
          <span class="tally__n">${x.n}</span>
          <span class="tally__label">${escHtml(x.label)}</span>
        </div>`).join('')}
      <div class="tally__card tally__card--pass">
        <span class="tally__n">${result.passed.length}</span>
        <span class="tally__label">Checks passed</span>
      </div>
    </div>`;
}

// ── Findings ─────────────────────────────────────────────────

function findings(result) {
  if (!result.findings.length) {
    return panel({
      title: 'Findings',
      body: emptyState(
        'Nothing contradicts anything',
        `${result.passed.length} checks ran against this setup and none of them fired. That is a real result, not an empty page.`),
    });
  }

  const groups = Object.entries(result.byArea)
    .sort((a, b) => b[1].length - a[1].length);

  const body = groups.map(([area, list]) => `
    <div class="finding-group">
      <h3 class="finding-group__title">${escHtml(AREAS[area] || area)} <span class="finding-group__n">${list.length}</span></h3>
      ${list.map(findingCard).join('')}
    </div>`).join('');

  return panel({
    title: 'Findings',
    lead: 'Each one names where its claim comes from. A fix button writes the change into this setup, so the list should shrink as you use it.',
    body,
    actions: `<button type="button" class="btn btn--ghost btn--sm" id="toggleShowPassed">${state.prefs.showPassed ? 'Hide' : 'Show'} passed checks</button>`,
  }) + (state.prefs.showPassed ? passedList(result) : '');
}

function passedList(result) {
  return panel({
    title: 'Checks that passed',
    lead: 'What was looked at and found fine. This is the half that makes the other half trustworthy.',
    body: `<ul class="passed">${result.passed.map(p => `
      <li><span class="passed__title">${escHtml(p.rule.title)}</span>${basisChip(p.rule.basis)}
        ${p.detail ? `<span class="passed__detail">${escHtml(p.detail)}</span>` : ''}</li>`).join('')}</ul>`,
  });
}

// ── Rules that threw ─────────────────────────────────────────

function ruleErrors(result) {
  if (!result.errors.length) return '';
  return panel({
    title: 'Rules that failed to run',
    lead: 'These are bugs in Cadrage, not in your setup. They are shown rather than swallowed, because a silent rule is indistinguishable from a passing one.',
    body: `<ul class="rule-errors">${result.errors.map(e => `
      <li><code>${escHtml(e.rule.id)}</code> threw during <code>${escHtml(e.phase)}</code>: ${escHtml(e.message)}</li>`).join('')}</ul>`,
  });
}

// ── Deliberate omissions ─────────────────────────────────────

function skipped(skips) {
  if (!skips.length) return '';
  return panel({
    title: 'Not checked, on purpose',
    lead: `These rules rest on claims that circulate widely but that no primary source confirms. They ship off, and stay listed here once switched on so the decision is always reversible. ${basisChip('unverified')}`,
    body: `<ul class="skips">${skips.map(s => `
      <li class="skip${s.enabled ? ' skip--on' : ''}">
        <div class="skip__head">
          <span class="skip__title">${escHtml(s.rule.title)}</span>
          <span class="skip__state">${s.enabled ? (s.fired ? 'On, and firing above' : 'On, not firing') : 'Off'}</span>
          <button type="button" class="btn btn--ghost btn--sm" data-enable-rule="${escHtml(s.rule.id)}">
            ${s.enabled ? 'Switch it back off' : 'Check it anyway'}
          </button>
        </div>
        <p class="skip__why">${escHtml(unverifiedWhy(s.rule))}</p>
      </li>`).join('')}</ul>`,
  });
}

function unverifiedWhy(rule) {
  if (rule.id === 'exposure/dual-gain-dead-zone') {
    return 'The A6700 is widely said to have a dual base ISO. Sony publishes no base ISO figure for this body at all, only that the available range varies with the gamma. Turning this on tells you what the claim would imply; it does not make the claim true.';
  }
  return 'No primary source states this. Enabling it means treating a community claim as a rule.';
}

// ── What the camera is ignoring ───────────────────────────────

function interactionTable(inter) {
  const order = ['ignored', 'unknown', 'active', 'off'];
  const rows = [...inter.rows].sort((a, b) =>
    order.indexOf(a.state) - order.indexOf(b.state) || a.label.localeCompare(b.label));

  const lead = inter.ignoredCount
    ? `${inter.ignoredCount} of ${inter.rows.length} settings are written down but not read by the camera in this configuration.`
    : `Every setting recorded here is one the camera is actually reading.`;

  return panel({
    title: 'Which settings are doing something',
    lead: escHtml(lead),
    body: `
      <table class="grid">
        <thead><tr><th>Setting</th><th>Value</th><th>State</th><th>Why</th></tr></thead>
        <tbody>
          ${rows.map(r => `
            <tr data-state="${escHtml(r.state)}">
              <th scope="row">${escHtml(r.label)}</th>
              <td class="grid__value">${escHtml(r.value)}</td>
              <td><span class="state state--${escHtml(r.state)}">${escHtml(r.stateLabel)}</span></td>
              <td class="grid__why">${escHtml(r.why)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`,
  });
}
