/* =========================================================================
   Tanaw — Practice Mirror (#/practice/mirror)
   Camera + MediaRecorder, entirely on-device. The camera starts only after
   an explicit click and stops automatically when leaving the page.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const MAX_SECONDS = 30;
  const CHECKS = [
    ['handshape', 'Handshape matches (fingers and thumb)'],
    ['orientation', 'Palm orientation matches at start and end'],
    ['location', 'Location matches, relative to my body'],
    ['movement', 'Movement matches (direction, size, repetitions)'],
    ['nms', 'Facial expression and body match'],
  ];

  const ERRORS = {
    NotAllowedError: 'Camera permission was blocked. Allow camera access for this page in your browser’s site settings, then try again.',
    SecurityError: 'Your browser blocked camera access for this page. Try Chrome or Edge, or run Tanaw from a local server (see the README).',
    NotFoundError: 'No camera was found on this device.',
    OverconstrainedError: 'Your camera could not provide a suitable video size.',
    NotReadableError: 'Your camera is busy — another app may be using it. Close that app and try again.',
    AbortError: 'Starting the camera was interrupted. Please try again.',
    unsupported: 'This browser cannot access a camera here. Use a recent Chrome, Edge, Firefox or Safari — and if you opened Tanaw as a file and it still fails, run it from a local server (see the README).',
  };

  function pickMime() {
    if (!window.MediaRecorder || typeof MediaRecorder.isTypeSupported !== 'function') return '';
    const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4'];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function signOptions(selectedId) {
    const cats = T.data.allCategories();
    return html`
      <option value="">— Free practice${T.config.demonstrations ? ' (no reference)' : ''} —</option>
      ${cats.map((c) => html`
        <optgroup label="${c.label}">
          ${T.data.signsIn(c.id).map((s) => {
            const st = T.media.describe(s.id).status;
            const mark = st === 'verified' ? ' ✓' : st === 'local' ? ' (on this device)' : st === 'test' ? ' (test)' : '';
            return html`<option value="${s.id}" ${s.id === selectedId ? U.raw('selected') : ''}>${C.signLabel(s)}${s.fil && s.fil !== s.en ? ` · ${s.fil}` : ''}${mark}</option>`;
          })}
        </optgroup>`)}`;
  }

  V.mirror = {
    title: 'Practice Mirror',
    world: 'learn',
    station: 'practice',
    render(el, params, query, { signal }) {
      let current = query.sign ? T.data.getSign(query.sign) : null;
      let stream = null;
      let recorder = null;
      let chunks = [];
      let recStartedAt = 0;
      let recTick = null;
      let countdownTimer = null;
      let autoStop = null;
      let lastLog = 0;
      const clips = [];
      const s = T.store.state.settings;
      let mirrorOn = !!s.mirrorCamera;
      let guideOn = true;
      const canRecord = !!pickMime() || !!window.MediaRecorder;

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            crumbs: [{ label: 'Practice', href: '#/practice' }, { label: 'Practice Mirror' }],
            title: 'Practice Mirror',
            lead: `${T.config.demonstrations ? 'Copy a demonstration while you watch yourself.' : 'Practice the signs from your class while you watch yourself.'} Your camera stays on this device — nothing is uploaded, and nothing is saved unless you download it.`,
          })}

          <div class="mirror">
            <section class="mirror__panel card" aria-labelledby="ref-title">
              <div class="panel-head">
                <h2 class="panel-head__title" id="ref-title">${T.config.demonstrations ? html`${T.icon('film')}<span>Reference</span>` : html`${T.icon('library')}<span>What you are practicing</span>`}</h2>
              </div>
              <label class="field__label" for="mirror-sign">Choose an entry</label>
              <select class="select" id="mirror-sign">${signOptions(current ? current.id : '')}</select>
              <div class="mirror__ref" data-ref></div>
            </section>

            <section class="mirror__panel card" aria-labelledby="cam-title">
              <div class="panel-head">
                <h2 class="panel-head__title" id="cam-title">${T.icon('practice')}<span>Your camera</span></h2>
                <div class="panel-head__tools">
                  <label class="switch switch--sm"><input type="checkbox" data-mirror ${mirrorOn ? U.raw('checked') : ''}><span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span><span class="switch__label">Mirror</span></label>
                  <label class="switch switch--sm"><input type="checkbox" data-guide checked><span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span><span class="switch__label">Guide</span></label>
                </div>
              </div>
              <div class="cam" data-state="off">
                <div class="cam__stage">
                  <video class="cam__video ${mirrorOn ? 'is-mirrored' : ''}" playsinline muted aria-label="Live camera preview"></video>
                  <div class="cam__guide ${guideOn ? '' : 'is-hidden'}" aria-hidden="true"><span>Keep head to waist inside the frame</span></div>
                  <div class="cam__overlay cam__overlay--off">
                    <span class="cam__icon">${T.icon('practice', { size: 36 })}</span>
                    <p class="cam__msg">Your camera is off.</p>
                    <button type="button" class="btn btn--primary" data-cam-start>${T.icon('play')}<span>Start camera</span></button>
                    <p class="cam__privacy">${T.icon('lock')}<span>On-device only. Tanaw never uploads video.</span></p>
                  </div>
                  <div class="cam__overlay cam__overlay--error" hidden>
                    <span class="cam__icon">${T.icon('alert', { size: 36 })}</span>
                    <p class="cam__msg" data-cam-error></p>
                    <button type="button" class="btn btn--secondary" data-cam-start>${T.icon('rotate')}<span>Try again</span></button>
                  </div>
                  <div class="cam__countdown" aria-live="assertive" hidden></div>
                  <div class="cam__rec" hidden><span class="cam__rec-dot" aria-hidden="true"></span><span>REC</span><span data-rec-time>0:00</span></div>
                </div>
                <div class="cam__controls">
                  <button type="button" class="btn btn--record" data-rec disabled>${T.icon('record')}<span>Record</span></button>
                  <button type="button" class="btn btn--ghost" data-cam-stop disabled>${T.icon('stop')}<span>Stop camera</span></button>
                </div>
                ${canRecord ? '' : html`<p class="field__hint">${T.icon('info')}<span>Recording is not supported in this browser, but the live mirror still works.</span></p>`}
              </div>
            </section>
          </div>

          <section class="clips" aria-labelledby="clips-title">
            <div class="section__head">
              <h2 class="section__title section__title--sm" id="clips-title">Your clips <span class="muted">(this visit only)</span></h2>
            </div>
            <p class="field__hint">${T.icon('info')}<span>Clips are kept in memory and disappear when you leave this page. Download any clip you want to keep or show your teacher. Recording stops automatically after ${MAX_SECONDS} seconds.</span></p>
            <ul class="clip-list" data-clips></ul>
          </section>

          <section class="card checklist-card" aria-labelledby="check-title">
            <h2 class="section__title section__title--sm" id="check-title">${T.icon('check-circle')}<span>Five-parameter self-check</span></h2>
            <p>${T.config.demonstrations
              ? 'Compare your clip with the demonstration — one parameter at a time. Be honest: anything unticked is what to practice next.'
              : 'Compare your clip with what your teacher showed you — one parameter at a time. Be honest: anything unticked is what to practice next, or to ask your teacher about.'}</p>
            <ul class="checklist-grid">
              ${CHECKS.map(([id, label]) => html`
                <li><label class="check"><input type="checkbox" value="${id}"><span class="check__box" aria-hidden="true">${T.icon('check')}</span><span class="check__text">${label}</span></label></li>`)}
            </ul>
            <div class="btn-row">
              <button type="button" class="btn btn--primary" data-log>${T.icon('star')}<span>Log this practice (+5 XP)</span></button>
              <span class="field__hint" data-log-hint></span>
            </div>
          </section>
        </div>`);

      const select = el.querySelector('#mirror-sign');
      const refHost = el.querySelector('[data-ref]');
      const cam = el.querySelector('.cam');
      const video = el.querySelector('.cam__video');
      const errorText = el.querySelector('[data-cam-error]');
      const offOverlay = el.querySelector('.cam__overlay--off');
      const errOverlay = el.querySelector('.cam__overlay--error');
      const recBtn = el.querySelector('[data-rec]');
      const stopBtn = el.querySelector('[data-cam-stop]');
      const countdown = el.querySelector('.cam__countdown');
      const recBadge = el.querySelector('.cam__rec');
      const recTime = el.querySelector('[data-rec-time]');
      const clipList = el.querySelector('[data-clips]');
      const guide = el.querySelector('.cam__guide');
      const logHint = el.querySelector('[data-log-hint]');

      let refHand = null;
      function renderRef() {
        if (refHand) { refHand.destroy(); refHand = null; }
        if (current && current.cat === 'alphabet' && T.config.hand3d) {
          // Letters: the experimental 3D hand as the reference, turned to the signer's own view.
          const sign = current;
          refHost.innerHTML = String(html`<p class="muted">${T.icon('cube')}<span>Loading the 3D hand…</span></p>`);
          T.router.ensureHand().then(() => {
            if (signal.aborted || current !== sign) return;
            const letter = T.data.handLetter(sign.en);
            if (!letter || letter.gap) {
              refHost.innerHTML = String(html`<div class="mirror__word"><p class="mirror__word-en">${C.signLabel(sign)}</p><p class="learn-note">${T.icon('people')}<span>${letter ? letter.desc : ''}</span></p></div>`);
              return;
            }
            refHost.innerHTML = String(html`
              ${C.handStage({ kind: 'Letter', name: letter.id, compact: true })}
              <p class="hand-note">${T.icon('flask')}<span>${letter.desc} Shown from your side, as you would make it. Experimental 3D.</span></p>`);
            refHand = C.mountHand(refHost.querySelector('[data-stage3d]'), { signal, label: `Experimental 3D hand showing the letter ${letter.id} from the signer's view` });
            if (refHand) { refHand.setView('signer'); refHand.show(letter.id); }
          }).catch((err) => { console.error('[Tanaw] 3D reference:', err); refHost.innerHTML = ''; });
          return;
        }
        if (!current) {
          refHost.innerHTML = String(html`
            <div class="mirror__free">
              ${U.raw(T.art.lesson('space'))}
              <p><strong>Free practice.</strong> Fingerspell your name, rehearse signs from your class, or check your framing and lighting.</p>
            </div>`);
          return;
        }
        if (!T.config.demonstrations) {
          refHost.innerHTML = String(html`
            <div class="mirror__word">
              <p class="mirror__word-en">${C.signLabel(current)}</p>
              ${current.fil && current.fil !== current.en ? html`<p class="mirror__word-fil" lang="fil">${current.fil}</p>` : ''}
              <p class="learn-note">${T.icon('people')}<span>Sign it the way your Deaf teacher showed you, then record a clip to show them for feedback.</span></p>
              <p><a href="#/sign/${encodeURIComponent(current.id)}">Open in Vocabulary</a></p>
            </div>`);
          return;
        }
        refHost.innerHTML = String(html`
          ${C.mediaFrame(current, { size: 'md', autoplay: true, loop: true })}
          <p class="mirror__ref-label"><a href="#/sign/${encodeURIComponent(current.id)}">${C.signLabel(current)}</a>${current.fil && current.fil !== current.en ? html` · <span lang="fil">${current.fil}</span>` : ''}</p>`);
        C.hydrateMedia(refHost);
      }

      function setState(state) {
        cam.dataset.state = state;
        offOverlay.hidden = state !== 'off';
        errOverlay.hidden = state !== 'error';
        recBtn.disabled = state !== 'live' || !window.MediaRecorder;
        stopBtn.disabled = state !== 'live';
      }

      async function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          errorText.textContent = ERRORS.unsupported;
          setState('error');
          return;
        }
        setState('starting');
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (signal.aborted) { stopCamera(); return; }
          video.srcObject = stream;
          await video.play().catch(() => {});
          setState('live');
          T.progress.logActivity();
        } catch (err) {
          errorText.textContent = ERRORS[err && err.name] || `${ERRORS.unsupported} (${err && err.name ? err.name : 'Unknown error'})`;
          setState('error');
        }
      }

      function stopRecording() {
        clearTimeout(autoStop);
        clearInterval(recTick);
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      }

      function stopCamera() {
        clearInterval(countdownTimer);
        countdown.hidden = true;
        stopRecording();
        if (stream) stream.getTracks().forEach((t) => t.stop());
        stream = null;
        video.srcObject = null;
        if (cam.dataset.state !== 'error') setState('off');
      }

      function addClip(blob, duration) {
        const url = URL.createObjectURL(blob);
        const clip = { id: U.uid('clip'), url, blob, duration, signId: current ? current.id : '', at: new Date() };
        clips.unshift(clip);
        renderClips();
        T.progress.bump('recordings');
        T.progress.addXP(5, { reason: 'recording' });
        T.ui.toast('Clip recorded. Review it below.', { icon: 'film' });
      }

      function renderClips() {
        if (!clips.length) {
          clipList.innerHTML = String(html`<li class="clip-list__empty">No clips yet. Start the camera and press Record.</li>`);
          return;
        }
        const refIsVideo = current && T.media.describe(current.id).kind === 'video';
        clipList.innerHTML = String(html`${clips.map((c) => {
          const sign = c.signId ? T.data.getSign(c.signId) : null;
          return html`
            <li class="clip" data-clip="${c.id}">
              <video class="clip__video ${mirrorOn ? 'is-mirrored' : ''}" src="${c.url}" controls playsinline preload="metadata" aria-label="Your practice clip${sign ? ' for ' + sign.en : ''}"></video>
              <div class="clip__meta">
                <strong>${sign ? C.signLabel(sign) : 'Free practice'}</strong>
                <span>${fmt(c.duration)} · ${c.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div class="clip__actions">
                ${refIsVideo && sign && current && sign.id === current.id ? html`<button type="button" class="btn btn--secondary btn--sm" data-compare>${T.icon('play')}<span>Play with reference</span></button>` : ''}
                <button type="button" class="btn btn--ghost btn--sm" data-download>${T.icon('download')}<span>Download</span></button>
                <button type="button" class="btn btn--ghost btn--sm" data-delete aria-label="Delete clip">${T.icon('trash')}</button>
              </div>
            </li>`;
        })}`);
      }

      function beginRecording() {
        const mime = pickMime();
        try {
          recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        } catch (err) {
          T.ui.toast('Recording could not start in this browser.', { icon: 'alert', tone: 'danger' });
          return;
        }
        chunks = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          const duration = (Date.now() - recStartedAt) / 1000;
          recBadge.hidden = true;
          recBtn.classList.remove('is-recording');
          recBtn.innerHTML = String(html`${T.icon('record')}<span>Record</span>`);
          if (!signal.aborted) {
            if (chunks.length) addClip(new Blob(chunks, { type: recorder.mimeType || mime || 'video/webm' }), duration);
            else T.ui.toast('Nothing was recorded: that was too short for the camera to catch. Try a little longer.', { icon: 'info' });
          }
          recorder = null;
        };
        recorder.start(250);
        recStartedAt = Date.now();
        recBadge.hidden = false;
        recTime.textContent = '0:00';
        recBtn.classList.add('is-recording');
        recBtn.innerHTML = String(html`${T.icon('stop')}<span>Stop recording</span>`);
        recTick = setInterval(() => { recTime.textContent = fmt((Date.now() - recStartedAt) / 1000); }, 250);
        autoStop = setTimeout(stopRecording, MAX_SECONDS * 1000);
        // Play the reference from the start so the learner can copy along.
        const ref = refHost.querySelector('video');
        if (ref) { try { ref.currentTime = 0; ref.play(); } catch (e) { /* ignore */ } }
      }

      function startCountdown() {
        let n = 3;
        countdown.hidden = false;
        countdown.textContent = String(n);
        recBtn.disabled = true;
        countdownTimer = setInterval(() => {
          n -= 1;
          if (n <= 0) {
            clearInterval(countdownTimer);
            countdown.hidden = true;
            recBtn.disabled = false;
            if (stream) beginRecording();
            return;
          }
          countdown.textContent = String(n);
        }, 1000);
      }

      // Events
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-cam-start]')) startCamera();
        if (e.target.closest('[data-cam-stop]')) stopCamera();
        if (e.target.closest('[data-rec]')) {
          if (recorder && recorder.state === 'recording') stopRecording();
          else if (stream) startCountdown();
        }
        const clipEl = e.target.closest('[data-clip]');
        if (clipEl) {
          const clip = clips.find((c) => c.id === clipEl.dataset.clip);
          if (!clip) return;
          if (e.target.closest('[data-download]')) {
            const sign = clip.signId || 'free-practice';
            const stamp = clip.at.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            U.download(`tanaw-practice-${sign}-${stamp}.${U.extensionForMime(clip.blob.type)}`, clip.blob);
          }
          if (e.target.closest('[data-delete]')) {
            URL.revokeObjectURL(clip.url);
            clips.splice(clips.indexOf(clip), 1);
            renderClips();
          }
          if (e.target.closest('[data-compare]')) {
            const ref = refHost.querySelector('video');
            const mine = clipEl.querySelector('video');
            if (ref && mine) {
              try { ref.currentTime = 0; mine.currentTime = 0; ref.play(); mine.play(); } catch (err) { /* ignore */ }
            }
          }
        }
        if (e.target.closest('[data-log]')) {
          const now = Date.now();
          if (now - lastLog < 10000) { logHint.textContent = 'Logged — practice a little more before logging again.'; return; }
          lastLog = now;
          const ticked = U.$$('.checklist-card input:checked', el).length;
          if (current) T.store.update((st) => { st.progress.practiced[current.id] = (Number(st.progress.practiced[current.id]) || 0) + 1; });
          T.progress.addXP(5, { reason: 'practice' });
          logHint.textContent = ticked === CHECKS.length ? 'Great match on all five parameters!' : `Practice logged. Focus next on the ${CHECKS.length - ticked} unticked parameter${CHECKS.length - ticked === 1 ? '' : 's'}.`;
          U.$$('.checklist-card input', el).forEach((i) => { i.checked = false; });
          T.ui.toast('Practice logged (+5 XP).', { icon: 'star', tone: 'gold' });
        }
      }, { signal });

      el.addEventListener('change', (e) => {
        if (e.target === select) {
          current = select.value ? T.data.getSign(select.value) : null;
          T.router.replaceQuery('/practice/mirror', { sign: current ? current.id : '' });
          renderRef();
          renderClips();
        }
        if (e.target.matches('[data-mirror]')) {
          mirrorOn = e.target.checked;
          video.classList.toggle('is-mirrored', mirrorOn);
          U.$$('.clip__video', el).forEach((v) => v.classList.toggle('is-mirrored', mirrorOn));
        }
        if (e.target.matches('[data-guide]')) {
          guideOn = e.target.checked;
          guide.classList.toggle('is-hidden', !guideOn);
        }
      }, { signal });

      renderRef();
      renderClips();

      // Cleanup: release the camera and free memory when leaving the page.
      return () => {
        stopCamera();
        clips.forEach((c) => URL.revokeObjectURL(c.url));
        clips.length = 0;
      };
    },
  };
})();
