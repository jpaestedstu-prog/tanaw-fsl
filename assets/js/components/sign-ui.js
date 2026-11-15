/* =========================================================================
   Tanaw — sign UI components
   Status badges, media frames (with clearly labeled placeholders), sign
   tiles and the quick-view dialog. Media elements are created lazily by
   hydrateMedia() once a frame is in the document.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = (T.components = T.components || {});

  const STATUS = {
    verified: { label: 'Verified demonstration', short: 'Verified', icon: 'shield', tone: 'verified',
      explain: 'Recorded by a named signer and reviewed by a named, qualified verifier. Registered in the project’s verified media manifest.' },
    local: { label: 'Added on this device', short: 'On this device', icon: 'device', tone: 'local',
      explain: 'Attached on this device through the Contributor Studio. Check the signer and verifier details shown.' },
    test: { label: 'Test media — not a sign', short: 'Test media', icon: 'flask', tone: 'test',
      explain: 'A generated test image used to try Tanaw’s quizzes and flashcards. It does not show any FSL sign.' },
    pending: { label: 'Awaiting verified demonstration', short: 'Awaiting', icon: 'hourglass', tone: 'pending',
      explain: 'No verified FSL demonstration has been added yet, so Tanaw shows a placeholder instead of guessing.' },
  };

  C.statusInfo = (status) => STATUS[status] || STATUS.pending;

  C.statusBadge = (status, opts = {}) => {
    const s = C.statusInfo(status);
    return html`<span class="badge badge--${s.tone}" title="${s.label}">${T.icon(s.icon)}<span>${opts.compact ? s.short : s.label}</span></span>`;
  };

  const filLang = (text) => html`<span lang="fil">${text}</span>`;
  C.filLang = filLang;

  /** Accessible description used as the media's alternative text. */
  function altText(sign, d) {
    const who = d.meta && d.meta.signer ? ` by ${d.meta.signer}` : '';
    if (d.status === 'test') return `Test image for ${sign.en}. This is not an FSL sign.`;
    return `${d.status === 'verified' ? 'Verified FSL demonstration' : 'FSL demonstration added on this device'} of "${sign.en}"${sign.fil && sign.fil !== sign.en ? ` (${sign.fil})` : ''}${who}.`;
  }

  C.placeholder = (sign, size) => html`
    <div class="placeholder ${size === 'sm' ? 'placeholder--sm' : ''}" role="img" aria-label="Placeholder: no verified FSL demonstration for ${sign.en} yet">
      ${raw(T.art.signingSpace())}
      ${size === 'sm' ? '' : html`
      <div class="placeholder__text">
        <p class="placeholder__title">${T.icon('hourglass')}<span>Verified FSL demonstration pending</span></p>
        <p class="placeholder__body">Reserved for a video by a Deaf FSL signer, reviewed by a qualified FSL educator. Tanaw does not show unverified signs.</p>
      </div>`}
    </div>`;

  /**
   * Media frame for a sign. size: sm | md | lg
   * opts: controls, autoplay, loop, caption, flip
   */
  C.mediaFrame = (sign, opts = {}) => {
    const { size = 'lg', controls = true, autoplay = false, loop = true, caption = true } = opts;
    const d = T.media.describe(sign.id);
    const flip = opts.flip != null ? opts.flip : !!T.store.state.settings.flipDemo;
    return html`
      <figure class="media-frame media-frame--${size} is-${d.status} ${flip ? 'is-flipped' : ''}"
        data-media-sign="${sign.id}" data-controls="${controls ? '1' : '0'}" data-autoplay="${autoplay ? '1' : '0'}" data-loop="${loop ? '1' : '0'}">
        <div class="media-frame__stage">
          ${d.status === 'pending'
            ? C.placeholder(sign, size)
            : html`<div class="media-frame__loading"><span class="spinner" aria-hidden="true"></span><span class="visually-hidden">Loading demonstration</span></div>`}
        </div>
        ${caption ? html`
        <figcaption class="media-frame__caption">
          ${C.statusBadge(d.status, { compact: size === 'sm' })}
          ${d.status === 'test' && size !== 'sm' ? html`<span class="media-frame__note">Pipeline test image — not an FSL sign.</span>` : ''}
          ${d.status !== 'pending' && d.status !== 'test' && d.meta && d.meta.signer && size !== 'sm' ? html`<span class="media-frame__note">Signed by ${d.meta.signer}${d.meta.region ? ` · ${d.meta.region}` : ''}</span>` : ''}
        </figcaption>` : ''}
      </figure>`;
  };

  C.mediaError = (sign, d) => html`
    <div class="media-frame__error" role="alert">
      ${T.icon('alert', { size: 32 })}
      <p><strong>Demonstration file not found.</strong></p>
      <p>${d.status === 'verified' ? html`Expected at <code>${d.src}</code>. Check that the file was copied into the project.` : 'The file stored on this device could not be loaded.'}</p>
    </div>`;

  /** Turn every un-hydrated media frame inside `root` into a real <video>/<img>. */
  C.hydrateMedia = (root) => {
    const frames = root.querySelectorAll('[data-media-sign]:not([data-hydrated])');
    frames.forEach(async (fig) => {
      fig.setAttribute('data-hydrated', '1');
      const id = fig.dataset.mediaSign;
      const d = T.media.describe(id);
      if (d.status === 'pending') return;
      const sign = T.data.getSign(id) || { id, en: id, fil: '' };
      const stage = fig.querySelector('.media-frame__stage');
      let url = null;
      try { url = await T.media.getURL(id); } catch (e) { url = null; }
      if (!fig.isConnected) return;
      if (!url) { stage.innerHTML = String(C.mediaError(sign, d)); return; }
      let el;
      if (d.kind === 'image') {
        el = document.createElement('img');
        el.alt = altText(sign, d);
        el.decoding = 'async';
      } else {
        el = document.createElement('video');
        el.muted = true;
        el.playsInline = true;
        el.setAttribute('playsinline', '');
        el.loop = fig.dataset.loop === '1';
        el.preload = 'metadata';
        el.controls = fig.dataset.controls === '1';
        if (d.poster) el.poster = d.poster;
        el.setAttribute('aria-label', altText(sign, d));
        if (fig.dataset.autoplay === '1' && !U.reducedMotion()) el.autoplay = true;
      }
      el.className = 'media-frame__media';
      el.addEventListener('error', () => { stage.innerHTML = String(C.mediaError(sign, d)); }, { once: true });
      el.src = url;
      stage.replaceChildren(el);
      fig.classList.add('is-ready');
      fig.dispatchEvent(new CustomEvent('media:ready', { bubbles: true, detail: { signId: id, element: el } }));
    });
  };

  /* ---------- "I can sign this" (learned from a Deaf teacher) ---------- */
  C.isLearned = (id) => !!(T.store.state.progress.selfcheck || {})[id];

  C.setLearned = (id, on) => {
    T.store.update((st) => {
      if (on) st.progress.selfcheck[id] = true;
      else delete st.progress.selfcheck[id];
    });
    if (on) T.progress.logActivity();
  };

  /** One-line guidance shown wherever a sign would otherwise be demonstrated. */
  C.learnFromTeacher = (sign) => html`
    <p class="learn-note">${T.icon('people')}<span>Learn how to sign <strong>${C.signLabel(sign)}</strong> from a Deaf FSL teacher. Signs can differ from region to region, so learn the one used where you live.</span></p>`;

  /** Compact tile used in the vocabulary grid and lesson galleries. */
  C.signTile = (sign, opts = {}) => {
    const d = T.media.describe(sign.id);
    const cat = T.data.category(sign.cat);
    const isGlyph = sign.cat === 'alphabet' || sign.cat === 'numbers';
    const learned = C.isLearned(sign.id);
    const tag = opts.button ? 'button' : 'a';
    const attrs = opts.button
      ? raw(`type="button" data-quickview="${U.esc(sign.id)}"`)
      : raw(`href="#/sign/${encodeURIComponent(sign.id)}"`);
    const status = T.config.demonstrations
      ? html`<span class="sign-tile__status">${C.statusBadge(d.status, { compact: true })}</span>`
      : learned ? html`<span class="sign-tile__status"><span class="badge badge--learned">${T.icon('check')}<span>Learned</span></span></span>` : '';
    return html`
      <${raw(tag)} class="sign-tile ${T.config.demonstrations ? `is-${d.status}` : ''} ${learned ? 'is-learned' : ''} ${isGlyph ? 'sign-tile--glyph' : ''}" ${attrs}>
        <span class="sign-tile__visual" aria-hidden="true">
          ${isGlyph ? html`<span class="sign-tile__glyph">${sign.en}</span>` : T.icon(cat ? cat.icon : 'dot', { size: 28 })}
        </span>
        <span class="sign-tile__text">
          <span class="sign-tile__en">${isGlyph ? (sign.cat === 'alphabet' ? `Letter ${sign.en}` : `Number ${sign.en}`) : sign.en}</span>
          ${sign.fil && sign.fil !== sign.en ? html`<span class="sign-tile__fil" lang="fil">${sign.fil}</span>` : ''}
        </span>
        ${status}
      </${raw(tag)}>`;
  };

  /** Word card dialog used while demonstrations are switched off. */
  function wordCard(sign) {
    const id = U.uid('learned');
    T.ui.dialog({
      title: C.signLabel(sign),
      size: 'md',
      body: html`
        <div class="quickview quickview--word">
          ${sign.fil && sign.fil !== sign.en ? html`<p class="quickview__fil">${filLang(sign.fil)}</p>` : ''}
          ${C.learnFromTeacher(sign)}
          ${sign.note ? html`<p class="quickview__note">${T.icon('bulb')}<span>${sign.note}</span></p>` : ''}
          <label class="check check--learned" for="${id}">
            <input type="checkbox" id="${id}" data-learned ${C.isLearned(sign.id) ? raw('checked') : ''}>
            <span class="check__box" aria-hidden="true">${T.icon('check')}</span>
            <span class="check__text">I can sign this<span class="check__hint">Tick it once your teacher has shown you and you feel confident.</span></span>
          </label>
          <a class="btn btn--secondary btn--sm" href="#/sign/${encodeURIComponent(sign.id)}">${T.icon('library')}<span>Open in Vocabulary</span></a>
        </div>`,
      onOpen: (dlg) => {
        dlg.addEventListener('change', (e) => {
          if (e.target.matches('[data-learned]')) C.setLearned(sign.id, e.target.checked);
        });
        dlg.addEventListener('click', (e) => { if (e.target.closest('a[href^="#/"]')) dlg.close('nav'); });
      },
      onClose: () => T.bus.emit('learned:change', { id: sign.id }),
    });
  }

  /** Quick-view dialog for a sign (used inside lessons so learners keep their place). */
  C.quickView = (signId) => {
    const sign = T.data.getSign(signId);
    if (!sign) return;
    if (!T.config.demonstrations) { wordCard(sign); return; }
    const d = T.media.describe(sign.id);
    T.ui.dialog({
      title: sign.cat === 'alphabet' ? `Letter ${sign.en}` : sign.cat === 'numbers' ? `Number ${sign.en}` : sign.en,
      size: 'lg',
      body: html`
        <div class="quickview">
          ${C.mediaFrame(sign, { size: 'lg', autoplay: true })}
          <div class="quickview__info">
            ${sign.fil && sign.fil !== sign.en ? html`<p class="quickview__fil">${filLang(sign.fil)}</p>` : ''}
            <p class="quickview__status">${C.statusInfo(d.status).explain}</p>
            ${sign.note ? html`<p class="quickview__note">${T.icon('bulb')}<span>${sign.note}</span></p>` : ''}
            <a class="btn btn--secondary btn--sm" href="#/sign/${encodeURIComponent(sign.id)}">${T.icon('library')}<span>Open in Vocabulary</span></a>
          </div>
        </div>`,
      onOpen: (dlg) => {
        C.hydrateMedia(dlg);
        dlg.addEventListener('click', (e) => { if (e.target.closest('a[href^="#/"]')) dlg.close('nav'); });
      },
    });
  };

  /** Human-readable label for a sign (letters and numbers get a prefix). */
  C.signLabel = (sign) => (sign.cat === 'alphabet' ? `Letter ${sign.en}` : sign.cat === 'numbers' ? `Number ${sign.en}` : sign.en);
})();
