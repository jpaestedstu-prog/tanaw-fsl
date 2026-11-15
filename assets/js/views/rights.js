/* =========================================================================
   Tanaw — Rights exhibit (#/community/rights)
   RA 11106 as a map of daily life: each place opens the section of the FSL
   Act that applies there. Section summaries come from culture.js and cite
   the law's full text.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const LAW_URL = 'https://www.officialgazette.gov.ph/2018/10/30/republic-act-no-11106/';

  function skyline() {
    return `
      <svg class="skyline" viewBox="0 0 640 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <path class="skyline__far" d="M0 120V78h40V60h30v18h26V46h44v32h30V66h34v12h40V40l30-16 30 16v38h36V58h40v20h30V50h46v28h34V64h40v14h40V56h40v64z"/>
        <path class="skyline__near" d="M0 120V96h56V84h48v12h36V90h60l20-14 20 14h52V80h44v16h40V86h56v10h44V82h48v14h56v24z"/>
      </svg>`;
  }

  V.rights = {
    title: 'Rights under RA 11106',
    world: 'community',
    station: 'rights',
    render(el, params, query, { signal }) {
      const rights = T.data.rights;
      const count = () => rights.filter((r) => T.progress.explored(`rights:${r.sec}`)).length;

      el.innerHTML = String(html`
        <div class="container page exhibit">
          ${C.pageHead({
            eyebrow: 'Rights · Karapatan', icon: 'scale',
            title: 'Where the law meets daily life',
            lead: 'Republic Act No. 11106, the Filipino Sign Language Act, was approved on October 30, 2018. Choose a place to see what the law says there.',
          })}
          ${C.reviewNotice()}

          <div class="town">
            <div class="town__map">
              ${U.raw(skyline())}
              <p class="town__status" aria-live="polite" data-rights-count>${count()} of ${rights.length} places explored</p>
              <ul class="town__grid" role="list">
                ${rights.map((r) => html`
                  <li>
                    <button type="button" class="place ${T.progress.explored(`rights:${r.sec}`) ? 'is-explored' : ''}" data-sec="${r.sec}" aria-controls="rights-panel" aria-expanded="false">
                      <span class="place__icon">${T.icon(r.icon, { size: 26 })}</span>
                      <span class="place__name">${r.place}</span>
                      <span class="place__fil" lang="fil">${r.placeFil}</span>
                      <span class="place__sec">Sec. ${r.sec}</span>
                      <span class="place__check" aria-hidden="true">${T.icon('check')}</span>
                    </button>
                  </li>`)}
              </ul>
            </div>
            <section class="town__panel card" id="rights-panel" aria-live="polite" tabindex="-1" data-panel>
              <p class="town__hint">${T.icon('pin')}<span>Choose a place on the map to see the section of the law that applies there.</span></p>
            </section>
          </div>

          <section class="exhibit-section split" aria-labelledby="h-use">
            <div class="prose">
              <h2 class="section__title" id="h-use">Using the law</h2>
              <p>Laws matter when people use them. If you are organizing a school event, a barangay meeting or a hospital visit with a Deaf person, you can point to RA 11106 when requesting qualified FSL interpreters and accessible materials.</p>
              <p>The law’s Implementing Rules and Regulations were completed by the Komisyon sa Wikang Filipino with the Deaf community and other stakeholders (dated December 6, 2021).</p>
              <p class="btn-row">
                <a class="btn btn--secondary" href="${LAW_URL}" target="_blank" rel="noopener noreferrer">${T.icon('external')}<span>Read the full text of RA 11106</span><span class="visually-hidden"> (opens in a new tab)</span></a>
                <a class="btn btn--ghost" href="#/play/rights-match">${T.icon('dice')}<span>Play Rights Match</span></a>
              </p>
            </div>
            <div class="split__art">${U.raw(T.art.lesson('law'))}</div>
          </section>
          <p class="field__hint">${T.icon('info')}<span>These are plain-language summaries for learning. They are not legal advice; the full text of the law is the authority.</span></p>

          ${C.exhibitFooter('rights')}
        </div>`);

      const panel = el.querySelector('[data-panel]');
      const counter = el.querySelector('[data-rights-count]');

      function open(sec, focusPanel) {
        const r = rights.find((x) => x.sec === sec);
        if (!r) return;
        U.$$('.place', el).forEach((b) => {
          const on = b.dataset.sec === sec;
          b.setAttribute('aria-expanded', on ? 'true' : 'false');
          b.classList.toggle('is-open', on);
        });
        panel.innerHTML = String(html`
          <p class="town__sec">Section ${r.sec} · ${r.place}</p>
          <h2 class="town__title">${T.icon(r.icon)}<span>${r.area}</span></h2>
          <p class="town__text">${r.text}</p>
          <p class="town__source">${T.icon('book')}<span>Source: Republic Act No. 11106, Section ${r.sec}.</span></p>`);
        if (T.progress.markExplored(`rights:${r.sec}`, { xp: 2 })) {
          const b = el.querySelector(`.place[data-sec="${r.sec}"]`);
          if (b) b.classList.add('is-explored');
          counter.textContent = `${count()} of ${rights.length} places explored`;
          if (count() === rights.length) T.ui.toast('You have explored every area of the FSL Act.', { icon: 'scale', tone: 'gold' });
        }
        if (focusPanel && window.matchMedia('(max-width: 899px)').matches) {
          panel.scrollIntoView({ block: 'nearest', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
        }
      }

      el.addEventListener('click', (e) => {
        const b = e.target.closest('.place[data-sec]');
        if (b) open(b.dataset.sec, true);
      }, { signal });

      if (query.sec && rights.some((r) => r.sec === query.sec)) open(query.sec, false);
      C.exhibitEnd(el, 'rights', signal);
    },
  };
})();
