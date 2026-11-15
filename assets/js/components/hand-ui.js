/* =========================================================================
   Tanaw — shared interface for the experimental 3D hand
   The stage frame, its toolbar, the spelling strip and the notice that goes
   with every 3D view. Loaded on demand with components/hand3d.js and
   data/hands.js (see VIEW_FILES in core/router.js).
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = (T.components = T.components || {});

  C.HAND_NOTE = 'Experimental 3D prototype. The handshapes follow the one-handed manual alphabet that FSL shares with ASL, modeled by the Tanaw team. FSL’s T is formed differently and is not modeled. Not validated by Deaf FSL experts: learn signs from Deaf teachers.';

  /** The futuristic frame a hand is mounted in. */
  C.handStage = (o = {}) => html`
    <div class="stage3d ${o.compact ? 'stage3d--compact' : ''} ${o.className || ''}" data-stage3d>
      <div class="stage3d__hud">
        <p class="stage3d__label"><span class="stage3d__kind" data-hud-kind>${o.kind || ''}</span><strong class="stage3d__name" data-hud-name>${o.name || ''}</strong></p>
        <span class="exp-badge">Experimental</span>
      </div>
      <p class="stage3d__caption" data-caption aria-live="polite" aria-atomic="true"></p>
      ${o.hint === false ? '' : html`<p class="stage3d__hint" aria-hidden="true">Drag to turn · double-click to reset</p>`}
    </div>`;

  /** Toolbar for a stage: turning, views, mirror, x-ray, style and speed. */
  C.handToolbar = (o = {}) => {
    const s = T.store.state.settings;
    const styles = Object.entries(T.hand3d.STYLES);
    return html`
      <div class="hand-tools" role="toolbar" aria-label="3D view controls" data-hand-tools>
        <div class="hand-tools__group">
          <button type="button" class="icon-btn" data-turn="-30" aria-label="Turn left">${T.icon('rotate')}</button>
          <button type="button" class="icon-btn hand-tools__mirror-icon" data-turn="30" aria-label="Turn right">${T.icon('rotate')}</button>
          <button type="button" class="btn btn--ghost btn--sm" data-reset>${T.icon('frame')}<span>Reset</span></button>
        </div>
        <div class="hand-tools__group">
          <button type="button" class="chip" data-view-toggle aria-pressed="false">${T.icon('eye')}<span>Signer’s view</span></button>
          <button type="button" class="chip" data-mirror-toggle aria-pressed="${String(!!s.handMirror)}">${T.icon('flip')}<span>Left hand</span></button>
          <button type="button" class="chip" data-xray-toggle aria-pressed="false">${T.icon('grid')}<span>X-ray</span></button>
        </div>
        <fieldset class="hand-tools__group hand-tools__styles">
          <legend class="visually-hidden">Hand style</legend>
          ${styles.map(([id, st]) => html`
            <label class="swatch" title="${st.label}">
              <input type="radio" name="hand-style-${o.id || 'main'}" value="${id}" ${(s.handStyle || 'kayumanggi') === id ? U.raw('checked') : ''}>
              <span class="swatch__dot swatch__dot--${id}" aria-hidden="true"></span>
              <span class="visually-hidden">${st.label}</span>
            </label>`)}
        </fieldset>
        ${o.speed === false ? '' : html`
          <label class="hand-tools__speed">
            <span>${T.icon('speed')}<span class="visually-hidden">Speed</span></span>
            <input class="range" type="range" min="0.5" max="1.5" step="0.25" value="1" data-speed aria-label="Animation speed">
            <output data-speed-out>1×</output>
          </label>`}
      </div>`;
  };

  /**
   * Mount a hand into a .stage3d element and wire its toolbar (if given).
   * Returns the stage API, or null when 3D is unavailable (a note is shown instead).
   */
  C.mountHand = (stageEl, o = {}) => {
    if (!stageEl || !T.hand3d) return null;
    const s = T.store.state.settings;
    const stage = T.hand3d.create(stageEl, {
      label: o.label || '3D hand',
      style: s.handStyle || 'kayumanggi',
      mirror: !!s.handMirror,
      signal: o.signal,
      interactive: o.interactive !== false,
    });
    if (!stage.supported) stageEl.classList.add('is-unsupported');
    stage.on('fallback', () => stageEl.classList.add('is-unsupported'));
    const tools = o.toolbar;
    if (tools) {
      tools.addEventListener('click', (e) => {
        const turn = e.target.closest('[data-turn]');
        if (turn) stage.turn(Number(turn.dataset.turn));
        if (e.target.closest('[data-reset]')) stage.resetView();
        const vt = e.target.closest('[data-view-toggle]');
        if (vt) {
          const on = vt.getAttribute('aria-pressed') !== 'true';
          vt.setAttribute('aria-pressed', String(on));
          stage.setView(on ? 'signer' : 'front');
        }
        const mt = e.target.closest('[data-mirror-toggle]');
        if (mt) {
          const on = mt.getAttribute('aria-pressed') !== 'true';
          mt.setAttribute('aria-pressed', String(on));
          T.settings.set('handMirror', on);
        }
        const xt = e.target.closest('[data-xray-toggle]');
        if (xt) {
          const on = xt.getAttribute('aria-pressed') !== 'true';
          xt.setAttribute('aria-pressed', String(on));
          stage.setXray(on);
        }
      }, { signal: o.signal });
      tools.addEventListener('change', (e) => {
        if (e.target.matches('.hand-tools__styles input')) T.settings.set('handStyle', e.target.value);
      }, { signal: o.signal });
      tools.addEventListener('input', (e) => {
        if (!e.target.matches('[data-speed]')) return;
        const v = Number(e.target.value);
        stage.setSpeed(v);
        const out = tools.querySelector('[data-speed-out]');
        if (out) out.textContent = `${v}×`;
      }, { signal: o.signal });
    }
    // Follow the shared preferences (they can also change from the settings dialog).
    T.bus.on('settings:applied', () => {
      const st = T.store.state.settings;
      stage.setStyle(st.handStyle || 'kayumanggi');
      stage.setMirror(!!st.handMirror);
      if (tools) {
        const mt = tools.querySelector('[data-mirror-toggle]');
        if (mt) mt.setAttribute('aria-pressed', String(!!st.handMirror));
        const radio = tools.querySelector(`.hand-tools__styles input[value="${st.handStyle || 'kayumanggi'}"]`);
        if (radio) radio.checked = true;
      }
    }, o.signal);
    return stage;
  };

  /** Update the stage heads-up display. */
  C.handHud = (stageEl, kind, name) => {
    const k = stageEl.querySelector('[data-hud-kind]');
    const n = stageEl.querySelector('[data-hud-name]');
    if (k) k.textContent = kind || '';
    if (n) n.textContent = name || '';
  };

  /** Letter strip for a fingerspelled word (tokens from T.data.spellTokens). */
  C.spellStrip = (tokens, current = -1) => html`
    <ol class="spell-strip" aria-label="Letters">
      ${tokens.map((t, i) => (t.space
        ? html`<li class="spell-strip__space" aria-hidden="true"></li>`
        : html`<li class="spell-strip__tile ${t.gap ? 'is-gap' : ''} ${i === current ? 'is-current' : ''}" data-token="${i}" ${i === current ? U.raw('aria-current="step"') : ''}>${t.char}${t.gap ? html`<span class="visually-hidden"> (not modeled)</span>` : ''}</li>`))}
    </ol>`;

  /** The standard notice for 3D views. */
  C.handNotice = (o = {}) => html`
    <p class="hand-note ${o.compact ? 'hand-note--compact' : ''}">${T.icon('flask')}<span>${C.HAND_NOTE} <a href="#/about?s=3d">About the 3D hand</a></span></p>`;
})();
