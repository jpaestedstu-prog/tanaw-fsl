/* =========================================================================
   Tanaw — small shared widgets
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = (T.components = T.components || {});

  /** Circular progress ring. pct 0..100. */
  C.ring = (pct, opts = {}) => {
    const size = opts.size || 72;
    const stroke = opts.stroke || 8;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const p = U.clamp(Number(pct) || 0, 0, 100);
    const offset = circ * (1 - p / 100);
    return html`
      <span class="ring ${opts.tone ? 'ring--' + opts.tone : ''}" style="--ring-size:${size}px">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">
          <circle class="ring__track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"/>
          <circle class="ring__value" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"
            stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
        </svg>
        <span class="ring__label">${opts.label != null ? opts.label : `${Math.round(p)}%`}</span>
      </span>`;
  };

  /** Linear progress bar. */
  C.bar = (pct, label, tone) => html`
    <span class="bar ${tone ? 'bar--' + tone : ''}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
      <span class="bar__fill" style="width:${U.clamp(pct, 0, 100)}%"></span>
    </span>`;

  /** Standard page header with optional breadcrumbs. */
  C.pageHead = ({ eyebrow, title, lead, crumbs, actions, icon }) => html`
    <header class="page-head">
      ${crumbs && crumbs.length ? html`
        <nav class="crumbs" aria-label="Breadcrumb">
          <ol>${crumbs.map((c, i) => html`<li>${c.href && i < crumbs.length - 1 ? html`<a href="${c.href}">${c.label}</a>` : html`<span aria-current="page">${c.label}</span>`}</li>`)}</ol>
        </nav>` : ''}
      <div class="page-head__row">
        <div class="page-head__text">
          ${eyebrow ? html`<p class="eyebrow">${icon ? T.icon(icon) : ''}<span>${eyebrow}</span></p>` : ''}
          <h1 class="page-title">${title}</h1>
          ${lead ? html`<p class="lead">${lead}</p>` : ''}
        </div>
        ${actions ? html`<div class="page-head__actions">${actions}</div>` : ''}
      </div>
    </header>`;

  /** Empty / not-found state. Pass page: true when it is the whole page (renders an h1). */
  C.emptyState = ({ icon = 'sparkles', title, body, action, page = false }) => html`
    <div class="empty-state">
      <span class="empty-state__icon">${T.icon(icon, { size: 36 })}</span>
      ${page ? html`<h1 class="empty-state__title">${title}</h1>` : html`<h2 class="empty-state__title">${title}</h2>`}
      ${body ? html`<p>${body}</p>` : ''}
      ${action || ''}
    </div>`;

  /** Info notice block. tone: info | warn | success */
  C.notice = (tone, icon, content) => html`<div class="notice notice--${tone}">${T.icon(icon)}<div>${content}</div></div>`;

  C.statTile = ({ icon, value, label, tone, hint }) => html`
    <div class="stat-tile ${tone ? 'stat-tile--' + tone : ''}">
      <span class="stat-tile__icon">${T.icon(icon)}</span>
      <span class="stat-tile__value">${value}</span>
      <span class="stat-tile__label">${label}</span>
      ${hint ? html`<span class="stat-tile__hint">${hint}</span>` : ''}
    </div>`;

  /** 0–3 stars, announced as text. */
  C.stars = (n, total = 3) => html`
    <span class="stars" role="img" aria-label="${n} of ${total} stars">
      ${Array.from({ length: total }, (_, i) => html`<span class="stars__star ${i < n ? 'is-on' : ''}" aria-hidden="true">${T.icon('star')}</span>`)}
    </span>`;

  /** The next (or current) observance, soonest first. */
  C.nextObservances = () => T.data.observances
    .map((o) => Object.assign({ o }, T.data.nextOccurrence(o)))
    .sort((a, b) => a.days - b.days);

  C.observanceWhen = (n) => (n.ongoing ? 'Happening now' : n.days === 1 ? 'Tomorrow' : `In ${n.days} days`);

  C.observanceRange = (n, withYear = false) => {
    const opts = { month: 'long', day: 'numeric' };
    const end = withYear ? { month: 'long', day: 'numeric', year: 'numeric' } : opts;
    return n.o.kind === 'day'
      ? U.formatDate(n.start, withYear ? end : opts)
      : `${U.formatDate(n.start, opts)} – ${U.formatDate(n.end, end)}`;
  };

  /* ---------- Full-screen text display (Bridge, Everyday scenes) ---------- */
  function fit(box, text) {
    let lo = 14;
    let hi = 480;
    for (let k = 0; k < 18 && lo < hi - 1; k++) {
      const mid = Math.floor((lo + hi) / 2);
      text.style.fontSize = `${mid}px`;
      if (text.scrollHeight <= box.clientHeight && text.scrollWidth <= box.clientWidth) lo = mid;
      else hi = mid;
    }
    text.style.fontSize = `${lo}px`;
  }

  /** Show trusted HTML as large high-contrast text. opts: { tone, label, onShow } */
  C.showBig = (content, opts = {}) => {
    if (opts.onShow) opts.onShow();
    const dlg = document.createElement('dialog');
    dlg.className = `bigtext ${opts.tone ? 'bigtext--' + opts.tone : ''}`;
    dlg.setAttribute('aria-label', opts.label || 'Message display');
    dlg.innerHTML = String(html`
      <div class="bigtext__inner">
        <div class="bigtext__box" data-box><div class="bigtext__text" data-text>${content}</div></div>
        <div class="bigtext__bar">
          <button type="button" class="btn btn--ghost-inverse" data-rotate>${T.icon('rotate')}<span>Rotate for the other person</span></button>
          ${document.fullscreenEnabled ? html`<button type="button" class="btn btn--ghost-inverse" data-fs>${T.icon('maximize')}<span>Full screen</span></button>` : ''}
          <button type="button" class="btn btn--inverse" data-close>${T.icon('close')}<span>Close</span></button>
        </div>
      </div>`);
    document.body.appendChild(dlg);
    const box = dlg.querySelector('[data-box]');
    const text = dlg.querySelector('[data-text]');
    const refit = () => fit(box, text);
    const ro = window.ResizeObserver ? new ResizeObserver(refit) : null;
    if (ro) ro.observe(box);
    window.addEventListener('resize', refit);
    const prev = document.activeElement;
    dlg.addEventListener('click', async (e) => {
      if (e.target.closest('[data-close]')) dlg.close();
      if (e.target.closest('[data-rotate]')) { dlg.classList.toggle('is-rotated'); refit(); }
      if (e.target.closest('[data-fs]')) {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await dlg.requestFullscreen();
        } catch (err) { /* ignore */ }
        setTimeout(refit, 120);
      }
    });
    dlg.addEventListener('close', () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', refit);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      dlg.remove();
      if (prev && prev.isConnected) prev.focus({ preventScroll: true });
    });
    dlg.showModal();
    requestAnimationFrame(refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    return dlg;
  };

  /** Shared count for "used the Conversation Bridge" (once per page load). */
  let bridgeCounted = false;
  C.countBridgeUse = () => {
    if (bridgeCounted) return;
    bridgeCounted = true;
    T.progress.bump('bridgeUses');
  };

  /* ---------- Text-to-speech (Bridge, Everyday scenes) ---------- */
  C.tts = {
    available: () => 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function',
    voices: () => (C.tts.available() ? window.speechSynthesis.getVoices() || [] : []),
    /** langHint: 'fil' | 'en'. voiceURI: optional saved choice. */
    speak(text, langHint, voiceURI) {
      if (!C.tts.available() || !text || !String(text).trim()) return false;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).trim());
      const voices = C.tts.voices();
      let v = voiceURI ? voices.find((x) => x.voiceURI === voiceURI) : null;
      if (!v) {
        const want = langHint === 'en' ? ['en-ph', 'en'] : ['fil', 'tl'];
        for (const w of want) {
          v = voices.find((x) => (x.lang || '').toLowerCase().replace('_', '-').startsWith(w));
          if (v) break;
        }
      }
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = langHint === 'en' ? 'en-PH' : 'fil-PH'; }
      u.rate = Number(T.store.state.settings.ttsRate) || 1;
      window.speechSynthesis.speak(u);
      return true;
    },
    stop() { if (C.tts.available()) window.speechSynthesis.cancel(); },
  };

  C.raw = raw;
})();
