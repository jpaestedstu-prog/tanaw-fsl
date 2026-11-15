/* =========================================================================
   Tanaw — History exhibit (#/community/history)
   The FSL timeline as a voyage: one stop per moment, sailed with swipes,
   the arrow buttons, the keyboard, or read as a plain list. Each stop is
   marked visited when most of it has been in view.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const LIST_KEY = 'tanaw.history.list';

  function readListPref() {
    try { return window.localStorage.getItem(LIST_KEY) === '1'; } catch (e) { return false; }
  }

  function writeListPref(on) {
    try { window.localStorage.setItem(LIST_KEY, on ? '1' : '0'); } catch (e) { /* per-visit only */ }
  }

  V.history = {
    title: 'History of FSL',
    world: 'community',
    station: 'history',
    render(el, params, query, { signal }) {
      const stops = T.data.timeline;
      const visitedCount = () => stops.filter((t) => T.progress.explored(`history:${t.year}`)).length;
      let asList = readListPref();

      el.innerHTML = String(html`
        <div class="container page exhibit">
          ${C.pageHead({
            eyebrow: 'History · Kasaysayan', icon: 'compass',
            title: 'A voyage through FSL history',
            lead: 'From the first school for the Deaf in Manila to the law that names FSL the national sign language of the Filipino Deaf. Sail from stop to stop.',
          })}
          ${C.reviewNotice()}

          <div class="voyage-bar">
            <div class="voyage-bar__nav">
              <button type="button" class="icon-btn icon-btn--lg" data-prev aria-label="Previous stop">${T.icon('chevron-left')}</button>
              <button type="button" class="icon-btn icon-btn--lg" data-next aria-label="Next stop">${T.icon('chevron-right')}</button>
            </div>
            <p class="voyage-bar__status"><span data-status></span></p>
            <p class="visually-hidden" aria-live="polite" data-announce></p>
            <label class="switch switch--sm"><input type="checkbox" data-list ${asList ? U.raw('checked') : ''}><span class="switch__track" aria-hidden="true"><span class="switch__thumb"></span></span><span class="switch__label">Show as a list</span></label>
          </div>

          <ol class="voyage ${asList ? 'voyage--list' : ''}" tabindex="0" aria-label="FSL history, oldest first" data-voyage>
            ${stops.map((t, i) => {
              const src = t.src ? T.data.getSource(t.src) : null;
              const visited = T.progress.explored(`history:${t.year}`);
              return html`
                <li class="voyage__stop ${t.future ? 'voyage__stop--future' : ''} ${visited ? 'is-visited' : ''}" data-stop="${i}" data-year="${t.year}">
                  <span class="voyage__year">${t.year}</span>
                  <div class="voyage__card">
                    <h2 class="voyage__title">${t.title}</h2>
                    <p>${t.text}</p>
                    ${src ? html`<a class="voyage__source" href="${src.url}" target="_blank" rel="noopener noreferrer">${T.icon('book')}<span>Source</span><span class="visually-hidden">: ${src.label} (opens in a new tab)</span></a>` : ''}
                    ${t.future ? html`<div class="btn-row"><a class="btn btn--primary btn--sm" href="#/learn/path">Start learning</a><a class="btn btn--secondary btn--sm" href="#/community/calendar">Join an observance</a></div>` : ''}
                  </div>
                  <span class="voyage__visited" aria-hidden="true">${T.icon('check')}</span>
                </li>`;
            })}
          </ol>
          <p class="field__hint">${T.icon('info')}<span>Stops without a source link draw on the full list of sources in the Connect exhibit. Dates and descriptions will be reviewed with Deaf partners.</span></p>

          ${C.exhibitFooter('history')}
        </div>`);

      const track = el.querySelector('[data-voyage]');
      const items = U.$$('[data-stop]', track);
      const status = el.querySelector('[data-status]');
      const announce = el.querySelector('[data-announce]');
      let currentIndex = 0;

      const updateStatus = () => {
        status.textContent = asList
          ? `${stops.length} stops · ${visitedCount()} visited`
          : `Stop ${currentIndex + 1} of ${stops.length}: ${stops[currentIndex].year} · ${visitedCount()} visited`;
      };

      const visit = (i) => {
        const t = stops[i];
        if (!t) return;
        if (T.progress.markExplored(`history:${t.year}`, { xp: 2 })) items[i].classList.add('is-visited');
      };

      // Which stop is in view: the one nearest the track's center.
      const nearest = () => {
        const r = track.getBoundingClientRect();
        const mid = r.left + r.width / 2;
        let best = 0;
        let bestDist = Infinity;
        items.forEach((li, i) => {
          const b = li.getBoundingClientRect();
          const d = Math.abs(b.left + b.width / 2 - mid);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        return best;
      };

      const go = (i) => {
        currentIndex = U.clamp(i, 0, items.length - 1);
        const li = items[currentIndex];
        if (asList) {
          li.scrollIntoView({ block: 'center', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
        } else {
          const left = li.offsetLeft - (track.clientWidth - li.offsetWidth) / 2;
          track.scrollTo({ left, behavior: U.reducedMotion() ? 'auto' : 'smooth' });
        }
        updateStatus();
        // Announce only deliberate moves (buttons, keys), with the stop's title; scrolling stays quiet.
        const t = stops[currentIndex];
        announce.textContent = `Stop ${currentIndex + 1} of ${stops.length}: ${t.year}. ${t.title}.`;
      };

      // A stop counts as visited once most of it has stayed in view for a moment.
      items.forEach((li, i) => T.fx.onceVisible(li, () => visit(i), signal, 0.75, 1500));

      track.addEventListener('scroll', U.rafThrottle(() => {
        if (asList) return;
        const i = nearest();
        if (i !== currentIndex) { currentIndex = i; updateStatus(); }
      }), { signal, passive: true });

      track.addEventListener('keydown', (e) => {
        if (asList || e.target !== track) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); go(currentIndex + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(currentIndex - 1); }
        if (e.key === 'Home') { e.preventDefault(); go(0); }
        if (e.key === 'End') { e.preventDefault(); go(items.length - 1); }
      }, { signal });

      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-prev]')) go(currentIndex - 1);
        if (e.target.closest('[data-next]')) go(currentIndex + 1);
      }, { signal });

      el.addEventListener('change', (e) => {
        if (!e.target.matches('[data-list]')) return;
        asList = e.target.checked;
        writeListPref(asList);
        track.classList.toggle('voyage--list', asList);
        updateStatus();
      }, { signal });

      T.bus.on('explore', () => updateStatus(), signal);
      updateStatus();
      C.exhibitEnd(el, 'history', signal);
    },
  };
})();
