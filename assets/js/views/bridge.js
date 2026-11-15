/* =========================================================================
   Tanaw — Conversation Bridge (#/bridge)
   Practical Deaf–hearing communication helpers:
     • Show text  — full-screen high-contrast message, can rotate 180°
     • Captions   — live speech-to-text via the browser's Web Speech API
     • Speak      — text-to-speech with the device's voices
     • Phrases    — ready-made Filipino/English phrases + your own
     • Emergency  — an on-device emergency card
   None of these translate sign language; they support conversation.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const TABS = [
    { id: 'show', label: 'Show text', icon: 'type' },
    { id: 'captions', label: 'Live captions', icon: 'captions' },
    { id: 'speak', label: 'Speak for me', icon: 'volume' },
    { id: 'phrases', label: 'Quick phrases', icon: 'chat' },
    { id: 'emergency', label: 'Emergency card', icon: 'alert' },
  ];

  const SR_ERRORS = {
    'not-allowed': 'Microphone access was blocked. Allow the microphone for this page in your browser settings. If you opened Tanaw as a file, some browsers require running it from a local server (see the README).',
    'service-not-allowed': 'Your browser’s speech service is not allowed here. Try Chrome or Edge, or run Tanaw from a local server.',
    'audio-capture': 'No microphone was found. Connect a microphone and try again.',
    network: 'Live captions in this browser need an internet connection to its speech service.',
    'language-not-supported': 'This language is not supported by your browser’s speech service. Try English (Philippines).',
    start: 'Live captions could not start. Please try again.',
  };

  const countUse = () => C.countBridgeUse();
  const showBig = (content, opts = {}) => C.showBig(content, Object.assign({ onShow: countUse }, opts));

  V.bridge = {
    title: 'Conversation Bridge',
    world: 'learn',
    station: 'bridge',
    render(el, params, query, { signal }) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const hasTTS = C.tts.available();
      const startTab = TABS.some((t) => t.id === query.tab) ? query.tab : 'show';
      const st = T.store.state;
      let recognition = null;
      let listening = false;
      let lines = [];
      let interim = '';
      let capSize = 2;
      let voices = [];

      el.innerHTML = String(html`
        <div class="container page">
          ${C.pageHead({
            eyebrow: 'Conversation Bridge', icon: 'bridge',
            title: 'Tools for real conversations',
            lead: 'Show big text, caption speech, speak typed words aloud and keep useful phrases ready. These tools support Deaf–hearing conversation — they do not translate FSL, and they are no substitute for a qualified FSL interpreter in important situations.',
          })}

          <div class="tabs tabs--page" data-bridge-tabs>
            <div class="tabs__list tabs__list--scroll" role="tablist" aria-label="Bridge tools">
              ${TABS.map((t) => html`
                <button type="button" role="tab" class="tabs__tab" id="tab-${t.id}" aria-controls="panel-${t.id}" data-tab="${t.id}"
                  aria-selected="${t.id === startTab ? 'true' : 'false'}" tabindex="${t.id === startTab ? '0' : '-1'}">${T.icon(t.icon)}<span>${t.label}</span></button>`)}
            </div>

            <section role="tabpanel" class="tabs__panel bridge-panel" id="panel-show" aria-labelledby="tab-show" ${startTab === 'show' ? '' : U.raw('hidden')}>
              <label class="field__label" for="show-text">Type a message to show someone</label>
              <textarea class="textarea textarea--big" id="show-text" rows="4" maxlength="500" placeholder="e.g. Hello! I am learning FSL. Can you show me the sign for this?"></textarea>
              <div class="btn-row">
                <button type="button" class="btn btn--primary btn--lg" data-show>${T.icon('maximize')}<span>Show full screen</span></button>
                ${hasTTS ? html`<button type="button" class="btn btn--secondary" data-speak-show>${T.icon('volume')}<span>Speak aloud</span></button>` : ''}
                <button type="button" class="btn btn--ghost" data-clear-show>${T.icon('close')}<span>Clear</span></button>
              </div>
              <p class="field__hint">${T.icon('bulb')}<span>Tip: use <strong>Rotate</strong> in the full-screen view so the person across the table can read it.</span></p>
            </section>

            <section role="tabpanel" class="tabs__panel bridge-panel" id="panel-captions" aria-labelledby="tab-captions" ${startTab === 'captions' ? '' : U.raw('hidden')}>
              ${SR ? html`
                <div class="captions-toolbar">
                  <label class="field__label" for="cap-lang">Spoken language</label>
                  <select class="select select--inline" id="cap-lang">
                    ${[['fil-PH', 'Filipino (Philippines)'], ['en-PH', 'English (Philippines)'], ['en-US', 'English (United States)']].map(([v, l]) => html`<option value="${v}" ${st.settings.captionLang === v ? U.raw('selected') : ''}>${l}</option>`)}
                  </select>
                  <button type="button" class="btn btn--primary" data-listen>${T.icon('mic')}<span>Start captions</span></button>
                  <div class="captions-toolbar__right">
                    <button type="button" class="icon-btn" data-cap-size="-1" aria-label="Smaller captions">${T.icon('minus')}</button>
                    <button type="button" class="icon-btn" data-cap-size="1" aria-label="Larger captions">${T.icon('plus')}</button>
                    <button type="button" class="btn btn--ghost btn--sm" data-cap-clear>${T.icon('trash')}<span>Clear</span></button>
                    <button type="button" class="btn btn--ghost btn--sm" data-cap-save>${T.icon('download')}<span>Save .txt</span></button>
                  </div>
                </div>
                <div class="captions" data-captions data-size="2" role="log" aria-label="Live captions transcript">
                  <p class="captions__empty">Captions will appear here. Press <strong>Start captions</strong> and allow the microphone.</p>
                </div>
                <p class="cap-status" data-cap-status aria-live="polite"></p>
                <p class="field__hint">${T.icon('info')}<span><strong>How it works:</strong> captions use your browser’s built-in speech recognition. In Chrome and Edge, audio is processed by the browser maker’s online speech service, so an internet connection is needed. Accuracy varies with noise, accents and Taglish — always confirm important details in writing.</span></p>`
              : C.notice('info', 'info', html`<p><strong>Live captions are not available in this browser.</strong> They rely on the Web Speech API, currently supported in Chrome, Edge and Safari. Try one of those, or use <em>Show text</em> to communicate in writing.</p>`)}
            </section>

            <section role="tabpanel" class="tabs__panel bridge-panel" id="panel-speak" aria-labelledby="tab-speak" ${startTab === 'speak' ? '' : U.raw('hidden')}>
              ${hasTTS ? html`
                <label class="field__label" for="speak-text">Type what you want your device to say</label>
                <textarea class="textarea textarea--big" id="speak-text" rows="3" maxlength="500" placeholder="e.g. Magandang umaga po! Ako ay Deaf."></textarea>
                <div class="speak-options">
                  <div>
                    <label class="field__label" for="tts-voice">Voice</label>
                    <select class="select" id="tts-voice"><option value="">Automatic</option></select>
                  </div>
                  <div>
                    <label class="field__label" for="tts-rate">Speed <output data-rate-out>${Number(st.settings.ttsRate || 1).toFixed(1)}×</output></label>
                    <input class="range" id="tts-rate" type="range" min="0.6" max="1.4" step="0.1" value="${Number(st.settings.ttsRate || 1)}">
                  </div>
                </div>
                <div class="btn-row">
                  <button type="button" class="btn btn--primary btn--lg" data-speak>${T.icon('volume')}<span>Speak</span></button>
                  <button type="button" class="btn btn--ghost" data-stop-speak>${T.icon('stop')}<span>Stop</span></button>
                </div>
                <p class="field__hint" data-voice-hint>${T.icon('info')}<span>Uses voices installed on your device. Filipino voices may not be available everywhere; English voices will be used instead.</span></p>`
              : C.notice('info', 'info', html`<p><strong>Text-to-speech is not available in this browser.</strong> Use <em>Show text</em> instead.</p>`)}
            </section>

            <section role="tabpanel" class="tabs__panel bridge-panel" id="panel-phrases" aria-labelledby="tab-phrases" ${startTab === 'phrases' ? '' : U.raw('hidden')}>
              <div data-phrases></div>
              <form class="card phrase-form" data-phrase-form>
                <h2 class="phrase-form__title">${T.icon('plus')}<span>Add your own phrase</span></h2>
                <div class="form-grid">
                  <div><label class="field__label" for="ph-fil">Filipino</label><input class="input" id="ph-fil" maxlength="200" lang="fil" placeholder="e.g. Saan po ang klinika?"></div>
                  <div><label class="field__label" for="ph-en">English</label><input class="input" id="ph-en" maxlength="200" placeholder="e.g. Where is the clinic?"></div>
                </div>
                <div class="btn-row"><button type="submit" class="btn btn--secondary">${T.icon('plus')}<span>Save phrase</span></button><span class="field__hint">Saved in this browser only.</span></div>
              </form>
            </section>

            <section role="tabpanel" class="tabs__panel bridge-panel" id="panel-emergency" aria-labelledby="tab-emergency" ${startTab === 'emergency' ? '' : U.raw('hidden')}>
              ${C.notice('warn', 'phone', html`<p><strong>In an emergency, call or have someone call 911</strong> — the national emergency hotline in the Philippines. This card helps you explain your needs quickly; it does not contact anyone.</p>`)}
              <form class="emergency-form" data-emergency-form>
                <div class="form-grid">
                  <div><label class="field__label" for="em-name">Name</label><input class="input" id="em-name" name="name" maxlength="80" autocomplete="name"></div>
                  <div><label class="field__label" for="em-comms">How to communicate with me</label><input class="input" id="em-comms" name="comms" maxlength="160" placeholder="e.g. FSL, writing or typing on my phone"></div>
                  <div class="form-grid__wide"><label class="field__label" for="em-message">Message</label><textarea class="textarea" id="em-message" name="message" rows="2" maxlength="300" placeholder="Ako ay Deaf. Pakisulat o paki-type po. / I am Deaf. Please write or type."></textarea></div>
                  <div><label class="field__label" for="em-cname">Emergency contact</label><input class="input" id="em-cname" name="contactName" maxlength="80"></div>
                  <div><label class="field__label" for="em-cphone">Contact number</label><input class="input" id="em-cphone" name="contactPhone" maxlength="30" inputmode="tel" autocomplete="tel"></div>
                  <div class="form-grid__wide"><label class="field__label" for="em-medical">Medical notes (optional)</label><textarea class="textarea" id="em-medical" name="medical" rows="2" maxlength="300" placeholder="e.g. Allergies, medication, conditions"></textarea></div>
                </div>
                <p class="field__hint">${T.icon('lock')}<span>Saved automatically in this browser only. Anyone using this device can see it — leave out anything you are not comfortable storing.</span></p>
                <div class="btn-row">
                  <button type="button" class="btn btn--primary btn--lg" data-show-card>${T.icon('maximize')}<span>Show emergency card</span></button>
                  <button type="button" class="btn btn--ghost" data-clear-card>${T.icon('trash')}<span>Clear card</span></button>
                </div>
              </form>
            </section>
          </div>
        </div>`);

      C.bindTabs(el.querySelector('[data-bridge-tabs]'), signal, (tab) => {
        T.router.replaceQuery('/bridge', { tab: tab.dataset.tab === 'show' ? '' : tab.dataset.tab });
      });

      /* ----- Text-to-speech ----- */
      const voiceSelect = el.querySelector('#tts-voice');
      function loadVoices() {
        if (!hasTTS || !voiceSelect) return;
        voices = window.speechSynthesis.getVoices() || [];
        const rank = (v) => {
          const l = (v.lang || '').toLowerCase();
          if (l.startsWith('fil') || l.startsWith('tl')) return 0;
          if (l === 'en-ph' || l === 'en_ph') return 1;
          if (l.startsWith('en')) return 2;
          return 3;
        };
        const sorted = voices.slice().sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
        const saved = st.settings.ttsVoice;
        voiceSelect.innerHTML = String(html`<option value="">Automatic (best match)</option>${sorted.map((v) => html`<option value="${v.voiceURI}" ${v.voiceURI === saved ? U.raw('selected') : ''}>${v.name} (${v.lang})</option>`)}`);
      }

      function speak(text, langHint) {
        if (C.tts.speak(text, langHint, voiceSelect ? voiceSelect.value : '')) countUse();
      }

      if (hasTTS) {
        loadVoices();
        if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { signal });
      }

      /* ----- Live captions ----- */
      const capBox = el.querySelector('[data-captions]');
      const capStatus = el.querySelector('[data-cap-status]');
      const listenBtn = el.querySelector('[data-listen]');
      const langSelect = el.querySelector('#cap-lang');

      function renderCaptions() {
        if (!capBox) return;
        if (!lines.length && !interim) {
          capBox.innerHTML = String(html`<p class="captions__empty">${listening ? 'Listening… start speaking.' : 'Captions will appear here.'}</p>`);
          return;
        }
        capBox.innerHTML = String(html`${lines.slice(-60).map((l) => html`<p class="captions__line">${l}</p>`)}${interim ? html`<p class="captions__line captions__line--interim">${interim}</p>` : ''}`);
        capBox.scrollTop = capBox.scrollHeight;
      }

      function setListening(on) {
        listening = on;
        if (!listenBtn) return;
        listenBtn.innerHTML = String(on ? html`${T.icon('mic-off')}<span>Stop captions</span>` : html`${T.icon('mic')}<span>Start captions</span>`);
        listenBtn.classList.toggle('btn--danger', on);
        listenBtn.classList.toggle('btn--primary', !on);
        capBox.classList.toggle('is-live', on);
      }

      function startListening() {
        if (!SR) return;
        try {
          recognition = new SR();
        } catch (err) {
          capStatus.textContent = SR_ERRORS.start;
          return;
        }
        recognition.lang = langSelect.value;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (e) => {
          interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            const text = (r[0] && r[0].transcript ? r[0].transcript : '').trim();
            if (!text) continue;
            if (r.isFinal) lines.push(text);
            else interim += (interim ? ' ' : '') + text;
          }
          renderCaptions();
        };
        recognition.onerror = (e) => {
          if (e.error === 'no-speech' || e.error === 'aborted') return;
          capStatus.textContent = SR_ERRORS[e.error] || `Live captions stopped (${e.error}).`;
          setListening(false);
        };
        recognition.onend = () => {
          if (listening && !signal.aborted) {
            try { recognition.start(); } catch (err) { setListening(false); }
          } else {
            interim = '';
            renderCaptions();
          }
        };
        try {
          recognition.start();
          setListening(true);
          capStatus.textContent = 'Listening…';
          countUse();
          T.progress.logActivity();
          renderCaptions();
        } catch (err) {
          capStatus.textContent = SR_ERRORS.start;
          setListening(false);
        }
      }

      function stopListening() {
        setListening(false);
        if (recognition) { try { recognition.stop(); } catch (err) { /* ignore */ } }
        capStatus.textContent = lines.length ? 'Captions stopped.' : '';
      }

      /* ----- Phrases ----- */
      const phraseHost = el.querySelector('[data-phrases]');
      function phraseItem(p, custom) {
        return html`
          <li class="phrase">
            ${p.fil ? html`<p class="phrase__fil" lang="fil">${p.fil}</p>` : ''}
            ${p.en ? html`<p class="phrase__en">${p.en}</p>` : ''}
            <div class="phrase__actions">
              <button type="button" class="btn btn--secondary btn--sm" data-ph-show>${T.icon('maximize')}<span>Show</span></button>
              ${hasTTS && p.fil ? html`<button type="button" class="btn btn--ghost btn--sm" data-ph-speak="fil">${T.icon('volume')}<span>Filipino</span></button>` : ''}
              ${hasTTS && p.en ? html`<button type="button" class="btn btn--ghost btn--sm" data-ph-speak="en">${T.icon('volume')}<span>English</span></button>` : ''}
              ${custom ? html`<button type="button" class="icon-btn" data-ph-delete="${p.id}" aria-label="Delete this phrase">${T.icon('trash')}</button>` : ''}
            </div>
          </li>`;
      }
      function renderPhrases() {
        const custom = T.store.state.bridge.phrases || [];
        phraseHost.innerHTML = String(html`
          ${custom.length ? html`
            <section class="phrase-group">
              <h2 class="phrase-group__title">${T.icon('sparkles')}<span>My phrases</span></h2>
              <ul class="phrase-list" data-group="custom">${custom.map((p) => phraseItem(p, true))}</ul>
            </section>` : ''}
          ${T.data.phraseGroups.map((g) => html`
            <section class="phrase-group">
              <h2 class="phrase-group__title">${g.label}</h2>
              <ul class="phrase-list" data-group="${g.id}">${g.phrases.map((p) => phraseItem(p, false))}</ul>
            </section>`)}`);
      }
      function phraseFrom(btn) {
        const li = btn.closest('.phrase');
        const fil = li.querySelector('.phrase__fil');
        const en = li.querySelector('.phrase__en');
        return { fil: fil ? fil.textContent : '', en: en ? en.textContent : '' };
      }

      /* ----- Emergency card ----- */
      const emForm = el.querySelector('[data-emergency-form]');
      const em = T.store.state.bridge.emergency;
      ['name', 'comms', 'message', 'contactName', 'contactPhone', 'medical'].forEach((k) => {
        const field = emForm.elements[k];
        if (field) field.value = em[k] || '';
      });
      const saveCardNow = () => {
        T.store.update((s) => {
          ['name', 'comms', 'message', 'contactName', 'contactPhone', 'medical'].forEach((k) => {
            s.bridge.emergency[k] = String(emForm.elements[k].value || '').slice(0, 300);
          });
        }, { silent: true });
      };
      const saveCard = U.debounce(saveCardNow, 300);
      emForm.addEventListener('input', saveCard, { signal });
      emForm.addEventListener('submit', (e) => e.preventDefault(), { signal });

      function showCard() {
        saveCard.cancel();
        saveCardNow();
        const v = (k) => String(emForm.elements[k].value || '').trim();
        const phone = v('contactPhone').replace(/[^0-9+]/g, '');
        showBig(html`
          <div class="em-card">
            <p class="em-card__title"><span lang="fil">Ako ay Deaf</span> · I am Deaf</p>
            <p class="em-card__msg">${v('message') || 'Pakisulat o paki-type po. · Please write or type to communicate with me.'}</p>
            ${v('name') ? html`<p class="em-card__row"><strong>Name:</strong> ${v('name')}</p>` : ''}
            ${v('comms') ? html`<p class="em-card__row"><strong>Communicate by:</strong> ${v('comms')}</p>` : ''}
            ${v('contactName') || phone ? html`<p class="em-card__row"><strong>Emergency contact:</strong> ${v('contactName')} ${phone ? html`<a href="tel:${phone}">${v('contactPhone')}</a>` : ''}</p>` : ''}
            ${v('medical') ? html`<p class="em-card__row"><strong>Medical:</strong> ${v('medical')}</p>` : ''}
            <p class="em-card__row em-card__hotline">Emergency hotline: <strong>911</strong></p>
          </div>`, { tone: 'emergency', label: 'Emergency card' });
      }

      /* ----- Events ----- */
      el.addEventListener('click', (e) => {
        const t = e.target;
        if (t.closest('[data-show]')) {
          const text = el.querySelector('#show-text').value.trim();
          if (!text) { T.ui.toast('Type a message first.', { icon: 'info' }); el.querySelector('#show-text').focus(); return; }
          showBig(html`${text}`);
        }
        if (t.closest('[data-speak-show]')) speak(el.querySelector('#show-text').value, 'fil');
        if (t.closest('[data-clear-show]')) { const ta = el.querySelector('#show-text'); ta.value = ''; ta.focus(); }
        if (t.closest('[data-speak]')) speak(el.querySelector('#speak-text').value, 'fil');
        if (t.closest('[data-stop-speak]') && hasTTS) window.speechSynthesis.cancel();
        if (t.closest('[data-listen]')) { if (listening) stopListening(); else startListening(); }
        const size = t.closest('[data-cap-size]');
        if (size && capBox) { capSize = U.clamp(capSize + Number(size.dataset.capSize), 1, 4); capBox.dataset.size = String(capSize); }
        if (t.closest('[data-cap-clear]')) { lines = []; interim = ''; renderCaptions(); }
        if (t.closest('[data-cap-save]')) {
          if (!lines.length) { T.ui.toast('No captions to save yet.', { icon: 'info' }); return; }
          U.download(`tanaw-captions-${U.dateKey()}.txt`, lines.join('\n'), 'text/plain;charset=utf-8');
        }
        const phShow = t.closest('[data-ph-show]');
        if (phShow) {
          const p = phraseFrom(phShow);
          showBig(html`${p.fil ? html`<span class="bigtext__primary" lang="fil">${p.fil}</span>` : ''}${p.en ? html`<span class="bigtext__secondary">${p.en}</span>` : ''}`);
        }
        const phSpeak = t.closest('[data-ph-speak]');
        if (phSpeak) {
          const p = phraseFrom(phSpeak);
          speak(phSpeak.dataset.phSpeak === 'en' ? p.en : p.fil, phSpeak.dataset.phSpeak);
        }
        const phDel = t.closest('[data-ph-delete]');
        if (phDel) {
          T.store.update((s) => { s.bridge.phrases = (s.bridge.phrases || []).filter((p) => p.id !== phDel.dataset.phDelete); });
          renderPhrases();
          T.ui.toast('Phrase deleted.', { icon: 'trash' });
        }
        if (t.closest('[data-show-card]')) showCard();
        if (t.closest('[data-clear-card]')) {
          T.ui.confirm({ title: 'Clear emergency card?', message: 'This removes the saved name, contact and medical notes from this browser.', confirmLabel: 'Clear card', danger: true }).then((ok) => {
            if (!ok) return;
            ['name', 'comms', 'message', 'contactName', 'contactPhone', 'medical'].forEach((k) => { emForm.elements[k].value = ''; });
            T.store.update((s) => { s.bridge.emergency = { name: '', message: '', contactName: '', contactPhone: '', medical: '', comms: '' }; });
            T.ui.toast('Emergency card cleared.', { icon: 'trash' });
          });
        }
      }, { signal });

      el.addEventListener('change', (e) => {
        if (e.target.id === 'cap-lang') {
          T.settings.set('captionLang', e.target.value);
          if (listening) { stopListening(); setTimeout(startListening, 300); }
        }
        if (e.target.id === 'tts-voice') T.settings.set('ttsVoice', e.target.value);
      }, { signal });

      el.addEventListener('input', (e) => {
        if (e.target.id === 'tts-rate') {
          const r = Number(e.target.value);
          el.querySelector('[data-rate-out]').textContent = `${r.toFixed(1)}×`;
          T.store.update((s) => { s.settings.ttsRate = r; }, { silent: true });
        }
      }, { signal });

      el.addEventListener('submit', (e) => {
        if (!e.target.matches('[data-phrase-form]')) return;
        e.preventDefault();
        const fil = el.querySelector('#ph-fil').value.trim();
        const en = el.querySelector('#ph-en').value.trim();
        if (!fil && !en) { T.ui.toast('Type a phrase in Filipino, English or both.', { icon: 'info' }); return; }
        T.store.update((s) => { s.bridge.phrases = [{ id: U.uid('ph'), fil, en }].concat(s.bridge.phrases || []).slice(0, 100); });
        el.querySelector('#ph-fil').value = '';
        el.querySelector('#ph-en').value = '';
        renderPhrases();
        T.ui.toast('Phrase saved.', { icon: 'check-circle' });
      }, { signal });

      renderPhrases();
      renderCaptions();

      return () => {
        listening = false;
        if (recognition) { try { recognition.abort(); } catch (err) { /* ignore */ } }
        if (hasTTS) window.speechSynthesis.cancel();
        saveCard.cancel();
        saveCardNow(); // never lose what was typed in the last moments
      };
    },
  };
})();
