/* =========================================================================
   Tanaw — sign detail (#/sign/:id) with provenance record
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  function provenance(sign, d) {
    const m = d.meta || {};
    const row = (label, value) => (value ? html`<div class="prov__row"><dt>${label}</dt><dd>${value}</dd></div>` : '');
    if (d.status === 'pending') {
      return html`
        <div class="prov prov--pending">
          <p class="prov__title">${T.icon('hourglass')}<span>No verified demonstration yet</span></p>
          <p>Tanaw has not received a demonstration of this entry recorded by a Deaf FSL signer and reviewed by a qualified FSL educator, so nothing is shown. FSL also varies by region — learn this sign from a Deaf teacher in your community.</p>
          <p class="prov__cta">Are you a Deaf FSL signer or educator? <a href="#/studio?sign=${encodeURIComponent(sign.id)}">Add a verified demonstration in the Contributor Studio</a>.</p>
        </div>`;
    }
    if (d.status === 'test') {
      return html`
        <div class="prov prov--test">
          <p class="prov__title">${T.icon('flask')}<span>Test media — not a sign</span></p>
          <p>This entry is using a generated test image so the quiz and flashcard features can be tried. It does not show any FSL sign. Remove test media in the Contributor Studio.</p>
        </div>`;
    }
    return html`
      <div class="prov prov--${d.status}">
        <p class="prov__title">${T.icon(d.status === 'verified' ? 'shield' : 'device')}<span>${d.status === 'verified' ? 'Verification record' : 'Added on this device'}</span></p>
        <dl class="prov__list">
          ${row('Signer', m.signer ? `${m.signer}${m.signerIsDeaf ? ' (Deaf FSL user)' : ''}` : '')}
          ${row('Verified by', m.verifiedBy ? `${m.verifiedBy}${m.verifierRole ? ` — ${m.verifierRole}` : ''}` : '')}
          ${row('Region / variant', m.region)}
          ${row('Recorded', m.recorded ? U.formatDate(m.recorded) : '')}
          ${row('Consent', m.consent || (m.consentConfirmed ? 'Confirmed by the person who added this clip' : ''))}
          ${row('License', m.license)}
        </dl>
        ${d.status === 'local' ? html`<p class="prov__note">${T.icon('lock')}<span>Stored only in this browser on this device. It is not part of the shared verified library until a project maintainer adds it to the media manifest.</span></p>` : ''}
      </div>`;
  }

  const canShareLink = /^https?:$/.test(window.location.protocol);

  function pager(sign, cat) {
    const siblings = T.data.signsIn(sign.cat);
    const idx = siblings.findIndex((s) => s.id === sign.id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
    const related = siblings.filter((s) => s.id !== sign.id).slice(0, 12);
    return html`
      <nav class="pager" aria-label="Browse ${cat.label}">
        ${prev ? html`<a class="pager__link" href="#/sign/${encodeURIComponent(prev.id)}">${T.icon('chevron-left')}<span><small>Previous</small>${C.signLabel(prev)}</span></a>` : html`<span></span>`}
        ${next ? html`<a class="pager__link pager__link--next" href="#/sign/${encodeURIComponent(next.id)}"><span><small>Next</small>${C.signLabel(next)}</span>${T.icon('chevron-right')}</a>` : html`<span></span>`}
      </nav>
      ${related.length ? html`
        <section class="related" aria-labelledby="related-title">
          <h2 class="section__title section__title--sm" id="related-title">More in ${cat.label}</h2>
          <div class="chip-row chip-row--wrap">
            ${related.map((s) => html`<a class="chip chip--link ${C.isLearned(s.id) ? 'is-learned' : ''}" href="#/sign/${encodeURIComponent(s.id)}">${C.isLearned(s.id) ? T.icon('check') : ''}<span>${C.signLabel(s)}</span>${C.isLearned(s.id) ? html`<span class="visually-hidden"> (learned)</span>` : ''}</a>`)}
          </div>
        </section>` : ''}`;
  }

  /** A vocabulary word while demonstrations are switched off: guidance, notes and the learner's own progress. */
  function renderWord(el, sign, signal) {
    const cat = T.data.category(sign.cat) || { label: 'Other', icon: 'dot' };
    const lesson = cat.lesson ? T.data.getLesson(cat.lesson) : null;
    const label = C.signLabel(sign);
    const inDeck = T.srs.isAdded(sign.id);
    el.innerHTML = String(html`
      <div class="container page">
        ${C.pageHead({
          crumbs: [{ label: 'Vocabulary', href: '#/library' }, { label: cat.label, href: `#/library?cat=${sign.cat}` }, { label }],
          title: label,
          lead: sign.fil && sign.fil !== sign.en ? html`<span class="sign-fil" lang="fil">${sign.fil}</span>` : '',
        })}

        <div class="word-layout">
          <div class="word-main">
            <div class="sign-meta">
              <a class="chip chip--static" href="#/library?cat=${sign.cat}">${T.icon(cat.icon)}<span>${cat.label}</span></a>
              ${lesson ? html`<a class="chip chip--static" href="#/learn/${lesson.id}">${T.icon('path')}<span>Lesson: ${lesson.title}</span></a>` : ''}
            </div>
            ${sign.cat === 'alphabet' && T.config.hand3d ? html`<section class="word-3d" data-word-3d aria-label="Letter ${sign.en} in 3D (experimental)"></section>` : ''}
            ${C.learnFromTeacher(sign)}
            ${sign.note ? html`
              <section class="sign-section">
                <h2 class="sign-section__title">Language &amp; culture note</h2>
                <p class="sign-note">${T.icon('bulb')}<span>${sign.note}</span></p>
              </section>` : ''}
            <p class="field__hint">${T.icon('shield')}<span>${sign.cat === 'alphabet' && T.config.hand3d
              ? 'Tanaw shows letters on an experimental 3D hand, but not whole signs: those need a face and a body, and a Deaf teacher.'
              : 'Tanaw does not show whole signs: they need a face, a body and a Deaf teacher to learn them accurately.'} <a href="#/about">Why?</a></span></p>
          </div>

          <section class="word-progress card" aria-labelledby="h-progress">
            <h2 class="sign-section__title" id="h-progress">Your progress</h2>
            <label class="check check--learned">
              <input type="checkbox" data-learned ${C.isLearned(sign.id) ? U.raw('checked') : ''}>
              <span class="check__box" aria-hidden="true">${T.icon('check')}</span>
              <span class="check__text">I can sign this<span class="check__hint">Tick it once your teacher has shown you and you feel confident.</span></span>
            </label>
            <div class="btn-row">
              <button type="button" class="btn btn--secondary" data-deck aria-pressed="${String(inDeck)}">${T.icon(inDeck ? 'check' : 'plus')}<span>${inDeck ? 'In your review deck' : 'Add to review deck'}</span></button>
              <a class="btn btn--ghost" href="#/practice/mirror?sign=${encodeURIComponent(sign.id)}">${T.icon('practice')}<span>Practice in the mirror</span></a>
              ${canShareLink ? html`<button type="button" class="btn btn--ghost" data-copy>${T.icon('link')}<span>Copy link</span></button>` : ''}
            </div>
            <p class="field__hint">Spaced review asks you to recall the sign for this word, then check it against what your teacher showed you.</p>
          </section>
        </div>

        ${pager(sign, cat)}
      </div>`);

    // Letters: the experimental 3D hand (loaded on demand).
    const slot = el.querySelector('[data-word-3d]');
    if (slot) {
      T.router.ensureHand().then(() => {
        if (signal.aborted || !slot.isConnected) return;
        const letter = T.data.handLetter(sign.en);
        if (!letter || letter.gap) {
          slot.innerHTML = String(html`<p class="hand-note">${T.icon('info')}<span>${letter ? letter.desc : 'This letter is not modeled in 3D.'}</span></p>`);
          return;
        }
        slot.innerHTML = String(html`
          ${C.handStage({ kind: 'Letter', name: letter.id, compact: true })}
          <p class="hand-note">${T.icon('flask')}<span>${letter.desc} Experimental 3D, not validated by Deaf FSL experts. <a href="#/lab?tab=alphabet&amp;letter=${letter.id}">Open in the 3D Hand Lab</a></span></p>`);
        const hand = C.mountHand(slot.querySelector('[data-stage3d]'), { signal, label: `Experimental 3D hand showing the letter ${letter.id}` });
        if (hand) hand.show(letter.id);
        T.progress.markExplored(`lab:letter:${letter.id}`, { xp: 1 });
      }).catch((err) => { console.error('[Tanaw] 3D letter:', err); slot.remove(); });
    }

    el.addEventListener('change', (e) => {
      if (!e.target.matches('[data-learned]')) return;
      C.setLearned(sign.id, e.target.checked);
      T.ui.toast(e.target.checked ? `Marked “${label}” as learned.` : `“${label}” is no longer marked as learned.`, { icon: 'check-circle' });
    }, { signal });
    el.addEventListener('click', async (e) => {
      const deck = e.target.closest('[data-deck]');
      if (deck) {
        const on = deck.getAttribute('aria-pressed') !== 'true';
        T.srs.setAdded(sign.id, on);
        deck.setAttribute('aria-pressed', String(on));
        deck.innerHTML = String(html`${T.icon(on ? 'check' : 'plus')}<span>${on ? 'In your review deck' : 'Add to review deck'}</span>`);
        T.ui.toast(on ? 'Added to your review deck.' : 'Removed from your review deck.', { icon: 'layers' });
      }
      if (e.target.closest('[data-copy]')) {
        const ok = await U.copyText(window.location.href);
        T.ui.toast(ok ? 'Link copied.' : 'Could not copy — copy the address bar instead.', { icon: ok ? 'check-circle' : 'alert' });
      }
    }, { signal });
  }

  V.sign = {
    world: 'learn',
    station: 'library',
    title: (params) => {
      const s = T.data.getSign(params.id);
      return s ? `${C.signLabel(s)} — Vocabulary` : 'Entry not found';
    },
    render(el, params, query, { signal }) {
      const sign = T.data.getSign(params.id);
      if (!sign) {
        el.innerHTML = String(html`<div class="container page">${C.emptyState({ icon: 'search', title: 'Entry not found', body: 'This vocabulary entry does not exist on this device.', action: html`<a class="btn btn--primary" href="#/library">Back to Vocabulary</a>`, page: true })}</div>`);
        return;
      }
      if (!T.config.demonstrations) { renderWord(el, sign, signal); return; }
      const d = T.media.describe(sign.id);
      const cat = T.data.category(sign.cat) || { label: 'Other', icon: 'dot' };
      const siblings = T.data.signsIn(sign.cat);
      const idx = siblings.findIndex((s) => s.id === sign.id);
      const prev = idx > 0 ? siblings[idx - 1] : null;
      const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
      const lesson = cat.lesson ? T.data.getLesson(cat.lesson) : null;
      const hasMedia = d.status !== 'pending';
      const inDeck = hasMedia || T.srs.isAdded(sign.id);
      const related = siblings.filter((s) => s.id !== sign.id).slice(0, 12);
      const label = C.signLabel(sign);
      const flipped = !!T.store.state.settings.flipDemo;

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            crumbs: [{ label: 'Vocabulary', href: '#/library' }, { label: cat.label, href: `#/library?cat=${sign.cat}` }, { label }],
            title: label,
            lead: sign.fil && sign.fil !== sign.en ? html`<span class="sign-fil" lang="fil">${sign.fil}</span>` : '',
          })}

          <div class="sign-layout">
            <div class="sign-layout__media">
              ${C.mediaFrame(sign, { size: 'lg', autoplay: false, flip: flipped })}
              ${d.kind === 'video' ? html`
                <div class="media-tools" role="group" aria-label="Playback options">
                  <fieldset class="segmented segmented--sm">
                    <legend class="media-tools__label">${T.icon('speed')}<span>Speed</span></legend>
                    ${[['0.5', '0.5×'], ['0.75', '0.75×'], ['1', '1×']].map(([v, l]) => html`
                      <label class="segmented__option"><input type="radio" name="speed" value="${v}" ${v === '1' ? U.raw('checked') : ''}><span>${l}</span></label>`)}
                  </fieldset>
                  <label class="switch switch--sm"><input type="checkbox" data-loop checked><span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span><span class="switch__label">Loop</span></label>
                  <label class="switch switch--sm"><input type="checkbox" data-flip ${flipped ? U.raw('checked') : ''}><span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span><span class="switch__label">Flip</span></label>
                </div>` : ''}
              ${d.kind === 'image' && d.status !== 'test' ? html`
                <div class="media-tools"><label class="switch switch--sm"><input type="checkbox" data-flip ${flipped ? U.raw('checked') : ''}><span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span><span class="switch__label">Flip</span></label></div>` : ''}
            </div>

            <div class="sign-layout__info">
              <div class="sign-meta">
                <a class="chip chip--static" href="#/library?cat=${sign.cat}">${T.icon(cat.icon)}<span>${cat.label}</span></a>
                ${lesson ? html`<a class="chip chip--static" href="#/learn/${lesson.id}">${T.icon('path')}<span>Lesson: ${lesson.title}</span></a>` : ''}
              </div>

              ${provenance(sign, d)}

              ${d.status !== 'pending' && d.status !== 'test' && d.meta && d.meta.description ? html`
                <section class="sign-section">
                  <h2 class="sign-section__title">How it’s signed</h2>
                  <p>${d.meta.description}</p>
                  <p class="field__hint">Written by the verifier. Always compare with the demonstration.</p>
                </section>` : ''}

              ${d.status === 'verified' && Array.isArray(d.meta.variants) && d.meta.variants.length ? html`
                <section class="sign-section">
                  <h2 class="sign-section__title">Regional variants</h2>
                  <ul class="variant-list">${d.meta.variants.map((v) => html`<li><strong>${v.region || 'Variant'}</strong>${v.note ? html` — ${v.note}` : ''}</li>`)}</ul>
                </section>` : ''}

              ${sign.note ? html`
                <section class="sign-section">
                  <h2 class="sign-section__title">Language & culture note</h2>
                  <p class="sign-note">${T.icon('bulb')}<span>${sign.note}</span></p>
                </section>` : ''}

              <section class="sign-section">
                <h2 class="sign-section__title">Practice</h2>
                <div class="btn-row">
                  <a class="btn btn--primary" href="#/practice/mirror?sign=${encodeURIComponent(sign.id)}">${T.icon('practice')}<span>Practice in the mirror</span></a>
                  ${hasMedia
                    ? html`<span class="pill pill--ok">${T.icon('layers')}<span>In your review deck</span></span>`
                    : html`<button type="button" class="btn btn--secondary" data-deck aria-pressed="${String(inDeck)}">${T.icon(inDeck ? 'check' : 'plus')}<span>${inDeck ? 'In your review deck' : 'Add to review deck'}</span></button>`}
                  <button type="button" class="btn btn--ghost" data-copy>${T.icon('link')}<span>Copy link</span></button>
                </div>
                ${!hasMedia ? html`<p class="field__hint">Without a demonstration, this card shows a placeholder — useful if you learned the sign from your teacher.</p>` : ''}
              </section>
            </div>
          </div>

          <nav class="pager" aria-label="Browse ${cat.label}">
            ${prev ? html`<a class="pager__link" href="#/sign/${encodeURIComponent(prev.id)}">${T.icon('chevron-left')}<span><small>Previous</small>${C.signLabel(prev)}</span></a>` : html`<span></span>`}
            ${next ? html`<a class="pager__link pager__link--next" href="#/sign/${encodeURIComponent(next.id)}"><span><small>Next</small>${C.signLabel(next)}</span>${T.icon('chevron-right')}</a>` : html`<span></span>`}
          </nav>

          ${related.length ? html`
            <section class="related" aria-labelledby="related-title">
              <h2 class="section__title section__title--sm" id="related-title">More in ${cat.label}</h2>
              <div class="chip-row chip-row--wrap">
                ${related.map((s) => html`<a class="chip chip--link" href="#/sign/${encodeURIComponent(s.id)}">${C.signLabel(s)}</a>`)}
              </div>
            </section>` : ''}
        </div>`);

      C.hydrateMedia(el);
      const figure = el.querySelector('.media-frame');

      const mediaEl = () => el.querySelector('.media-frame__media');
      el.addEventListener('change', (e) => {
        const t = e.target;
        if (t.name === 'speed') { const v = mediaEl(); if (v && 'playbackRate' in v) v.playbackRate = Number(t.value); }
        if (t.matches('[data-loop]')) { const v = mediaEl(); if (v && 'loop' in v) v.loop = t.checked; }
        if (t.matches('[data-flip]')) figure.classList.toggle('is-flipped', t.checked);
      }, { signal });

      el.addEventListener('click', async (e) => {
        const deck = e.target.closest('[data-deck]');
        if (deck) {
          const on = deck.getAttribute('aria-pressed') !== 'true';
          T.srs.setAdded(sign.id, on);
          deck.setAttribute('aria-pressed', String(on));
          deck.innerHTML = String(html`${T.icon(on ? 'check' : 'plus')}<span>${on ? 'In your review deck' : 'Add to review deck'}</span>`);
          T.ui.toast(on ? 'Added to your review deck.' : 'Removed from your review deck.', { icon: 'layers' });
        }
        if (e.target.closest('[data-copy]')) {
          const ok = await U.copyText(window.location.href);
          T.ui.toast(ok ? 'Link copied.' : 'Could not copy — copy the address bar instead.', { icon: ok ? 'check-circle' : 'alert' });
        }
      }, { signal });
    },
  };
})();
