/* =========================================================================
   Tanaw — core utilities
   Classic script (no ES modules) so the site also runs from file://.
   Everything hangs off one global namespace: window.Tanaw
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});

  /* ---------- Safe HTML templating ----------
     html`...` escapes every interpolated value unless it is wrapped in raw()
     (or is itself the result of html``). This keeps user-entered and imported
     text from ever being interpreted as markup. */
  class SafeHTML {
    constructor(value) { this.value = value; }
    toString() { return this.value; }
  }

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  }

  function toHTML(value) {
    if (value == null || value === false || value === true) return '';
    if (value instanceof SafeHTML) return value.value;
    if (Array.isArray(value)) return value.map(toHTML).join('');
    return esc(value);
  }

  function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) out += toHTML(values[i]) + strings[i + 1];
    return new SafeHTML(out);
  }

  const raw = (value) => new SafeHTML(String(value == null ? '' : value));

  /* ---------- DOM helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function mount(el, content) {
    el.innerHTML = String(content);
    return el;
  }

  /** Delegated event listener. Pass { signal } to remove it automatically. */
  function on(root, type, selector, handler, options) {
    const listener = (event) => {
      const start = event.target instanceof Element ? event.target : event.target && event.target.parentElement;
      if (!start) return;
      const match = start.closest(selector);
      if (match && root.contains(match)) handler(event, match);
    };
    root.addEventListener(type, listener, options);
    return () => root.removeEventListener(type, listener, options);
  }

  /** True while the user is typing in a form control (used to skip shortcuts). */
  function isTyping(event) {
    const t = event.target;
    if (!t || !(t instanceof Element)) return false;
    if (t.isContentEditable) return true;
    const tag = t.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      const type = (t.getAttribute('type') || 'text').toLowerCase();
      return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'file', 'color'].includes(type);
    }
    return false;
  }

  /* ---------- Text helpers ---------- */
  function normalize(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function slugify(text) {
    return normalize(text).replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  }

  function plural(n, one, many) {
    return `${n} ${n === 1 ? one : (many || one + 's')}`;
  }

  /* ---------- Function helpers ---------- */
  function debounce(fn, wait) {
    let timer = null;
    const debounced = function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  let uidCounter = 0;
  const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`;

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const sample = (list, n) => shuffle(list).slice(0, n);

  /** Small, stable string hash (FNV-1a). Used for date-seeded choices such as the daily challenge. */
  function hash(text) {
    let h = 0x811c9dc5;
    const s = String(text);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /** Run fn at most once per animation frame with the latest arguments. */
  function rafThrottle(fn) {
    let frame = 0;
    let last = [];
    const throttled = (...args) => {
      last = args;
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; fn(...last); });
    };
    throttled.cancel = () => { cancelAnimationFrame(frame); frame = 0; };
    return throttled;
  }

  /* ---------- Dates (local calendar days, stored as YYYY-MM-DD) ---------- */
  function dateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseKey(key) {
    const [y, m, d] = String(key).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function addDays(key, n) {
    const d = parseKey(key);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }

  function daysBetween(a, b) {
    return Math.round((parseKey(b) - parseKey(a)) / 86400000);
  }

  const isDateKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);

  function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
    const d = value instanceof Date ? value : isDateKey(value) ? parseKey(value) : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    try { return new Intl.DateTimeFormat('en-PH', opts).format(d); } catch (e) { return d.toDateString(); }
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /* ---------- Files ---------- */
  function download(filename, data, mime = 'application/octet-stream') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error || new Error('Could not read file'));
      r.readAsText(file);
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error || new Error('Could not read file'));
      r.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(dataURL) {
    // Lazy mime group so parameters such as ";codecs=vp9" stay with the type.
    const match = /^data:([^,]*?)(;base64)?,(.*)$/s.exec(String(dataURL));
    if (!match) throw new Error('Invalid data URL');
    const mime = match[1] || 'application/octet-stream';
    const isBase64 = !!match[2];
    const payload = match[3];
    if (!isBase64) return new Blob([decodeURIComponent(payload)], { type: mime });
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function extensionForMime(mime) {
    const m = String(mime || '').toLowerCase();
    if (m.includes('webm')) return 'webm';
    if (m.includes('mp4')) return 'mp4';
    if (m.includes('quicktime')) return 'mov';
    if (m.includes('ogg')) return 'ogv';
    if (m.includes('png')) return 'png';
    if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
    if (m.includes('gif')) return 'gif';
    if (m.includes('webp')) return 'webp';
    if (m.includes('avif')) return 'avif';
    return 'bin';
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to legacy copy */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  const reducedMotion = () => document.documentElement.dataset.motion === 'reduce';

  /* ---------- Tiny event bus ---------- */
  const listeners = Object.create(null);
  const bus = {
    on(event, fn, signal) {
      (listeners[event] || (listeners[event] = new Set())).add(fn);
      const off = () => listeners[event] && listeners[event].delete(fn);
      if (signal) signal.addEventListener('abort', off, { once: true });
      return off;
    },
    emit(event, detail) {
      const set = listeners[event];
      if (!set) return;
      Array.from(set).forEach((fn) => {
        try { fn(detail); } catch (err) { console.error('[Tanaw] listener error for', event, err); }
      });
    },
  };

  T.util = {
    SafeHTML, esc, html, raw, $, $$, mount, on, isTyping,
    normalize, slugify, plural, debounce, clamp, uid, shuffle, sample, hash, rafThrottle,
    dateKey, parseKey, addDays, daysBetween, isDateKey, formatDate, formatBytes,
    download, readFileAsText, blobToDataURL, dataURLToBlob, extensionForMime, copyText,
    reducedMotion,
  };
  T.bus = bus;
})();
