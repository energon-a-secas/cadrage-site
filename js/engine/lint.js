// ── Lint runner ──────────────────────────────────────────────
// Runs every rule against a config and returns findings. A rule that
// throws is reported as a rule bug rather than silently dropped: a lint
// engine that hides its own failures is worse than no lint engine.

import { RULES, SEVERITY, AREAS } from './rules.js';
import { BASIS, defaultEnabled } from '../data/basis.js';

/**
 * @param config  the shoot config
 * @param enabled optional map of ruleId -> boolean, overriding basis defaults
 */
export function lint(config, enabled = {}) {
  const findings = [];
  const passed = [];
  const skipped = [];
  const errors = [];

  for (const rule of RULES) {
    const on = enabled[rule.id] ?? defaultEnabled(rule.basis);
    if (!on) {
      skipped.push({ rule, reason: 'disabled' });
      continue;
    }

    let applies = false;
    try {
      applies = !!rule.applies(config);
    } catch (err) {
      errors.push({ rule, phase: 'applies', message: String(err) });
      continue;
    }
    if (!applies) {
      skipped.push({ rule, reason: 'not-applicable' });
      continue;
    }

    let result;
    try {
      result = rule.test(config);
    } catch (err) {
      errors.push({ rule, phase: 'test', message: String(err) });
      continue;
    }

    if (result?.fires) {
      findings.push({
        id: rule.id,
        area: rule.area,
        areaLabel: AREAS[rule.area] || rule.area,
        severity: rule.severity,
        severityLabel: SEVERITY[rule.severity]?.label || rule.severity,
        basis: rule.basis,
        basisLabel: BASIS[rule.basis]?.label || rule.basis,
        title: rule.title,
        detail: result.detail,
        fix: result.fix || rule.fix || null,
        learn: rule.learn || null,
      });
    } else {
      passed.push({ rule, detail: result?.detail || '' });
    }
  }

  findings.sort((a, b) => {
    const sev = (SEVERITY[b.severity]?.weight || 0) - (SEVERITY[a.severity]?.weight || 0);
    if (sev) return sev;
    const bas = (BASIS[b.basis]?.weight || 0) - (BASIS[a.basis]?.weight || 0);
    if (bas) return bas;
    return a.title.localeCompare(b.title);
  });

  return {
    findings,
    passed,
    skipped,
    errors,
    unverified: unverifiedState(enabled, findings),
    counts: countBy(findings),
    byArea: groupBy(findings, f => f.area),
  };
}

/**
 * Every rule whose basis is unverified, whether or not it ran. Reporting only
 * the disabled ones would take the toggle away the moment you used it, and an
 * unverified rule you cannot switch back off is just an assertion.
 */
function unverifiedState(enabled, findings) {
  return RULES
    .filter(rule => rule.basis === 'unverified')
    .map(rule => ({
      rule,
      enabled: enabled[rule.id] ?? defaultEnabled(rule.basis),
      fired: findings.some(f => f.id === rule.id),
    }));
}

function countBy(findings) {
  const out = { total: findings.length };
  for (const key of Object.keys(SEVERITY)) {
    out[key] = findings.filter(f => f.severity === key).length;
  }
  return out;
}

function groupBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const k = keyFn(item);
    (out[k] ||= []).push(item);
  }
  return out;
}

/** Unverified rules and their current state, for the UI. */
export function unverifiedSkips(result) {
  return result.unverified;
}

/** Apply a finding's fix to a config, returning a new config. */
export function applyFix(config, fix) {
  if (!fix?.path) return config;
  const next = structuredClone(config);
  const parts = fix.path.split('.');
  let node = next;
  for (const part of parts.slice(0, -1)) {
    if (node[part] === undefined || node[part] === null) node[part] = {};
    node = node[part];
  }
  node[parts[parts.length - 1]] = fix.to;
  return next;
}
