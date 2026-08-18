// ── Shared utilities ─────────────────────────────────────────
// Small, pure helper functions used across multiple modules.

/** Cached element lookup by ID. */
const _els = {};
export function $(id) {
  return _els[id] || (_els[id] = document.getElementById(id));
}

/** Escape HTML special characters. */
export function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Show a temporary toast notification. */
let _toastTimer = null;
export function showToast(msg) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  // Announced by screen readers. Without these the toast is
  // invisible to anyone not looking at that corner of the screen.
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 2000);
}

/** Simple debounce. */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ── Markdown ─────────────────────────────────────────────────
// Input is HTML-escaped first, so this only ever promotes safe text to safe
// markup. Covers what the lesson corpus uses; anything else falls through as
// an escaped paragraph.
export function renderMarkdown(src) {
  const lines = escHtml(src).split(/\r?\n/);
  const out = [];
  let inList = false, inCode = false, para = [];

  const inline = s => s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\[([^\]]+)\]\((#\/[^\s)]*)\)/g, '<a href="$2">$1</a>');

  const flushPara = () => {
    if (!para.length) return;
    out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };

  for (const line of lines) {
    if (/^```/.test(line)) {
      flushPara(); closeList();
      out.push(inCode ? '</code></pre>' : '<pre><code>');
      inCode = !inCode;
      continue;
    }
    if (inCode) { out.push(`${line}\n`); continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); closeList();
      const level = Math.min(h[1].length + 2, 6);
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    const quote = /^>\s+(.*)$/.exec(line);
    if (quote) {
      flushPara(); closeList();
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }

    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) {
      flushPara();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }

    if (!line.trim()) { flushPara(); closeList(); continue; }
    para.push(line.trim());
  }

  flushPara(); closeList();
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

// ── Formatting ───────────────────────────────────────────────

/** A shutter denominator as a fraction. */
export function shutterLabel(denom) {
  return denom ? `1/${denom}` : 'auto';
}

export function signed(n) {
  if (!Number.isFinite(n)) return 'n/a';
  return n > 0 ? `+${n}` : String(n);
}

export function cm(n, digits = 1) {
  if (n === Infinity) return 'infinity';
  if (!Number.isFinite(n)) return 'n/a';
  if (n >= 100) return `${(n / 100).toFixed(2)}m`;
  return `${n.toFixed(digits)}cm`;
}

export function stops(n, digits = 1) {
  if (!Number.isFinite(n)) return 'n/a';
  const s = Math.abs(n).toFixed(digits);
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${s} stop${Math.abs(n) === 1 ? '' : 's'}`;
}

export function titleCase(str) {
  return String(str).replace(/(^|[\s-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

/** Trigger a file download from a string. */
export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Read a File as text. */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
