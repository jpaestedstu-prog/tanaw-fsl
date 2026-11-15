/* =========================================================================
   Tanaw — Identity & culture exhibit (#/community/identity)
   One community, many experiences. The facet explorer, etiquette, terms and
   myths all reuse statements from the sourced lessons and culture data.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const BEAM_TONES = ['coral', 'gold', 'teal', 'indigo', 'coral', 'teal'];

  /** A beam of light split into one ray per facet; the selected ray glows. */
  function prism(n) {
    const rays = Array.from({ length: n }, (_, i) => {
      const y = 30 + (i * 140) / (n - 1);
      return `<path class="prism__ray prism__ray--${BEAM_TONES[i % BEAM_TONES.length]}" data-ray="${i}" d="M150 100 L300 ${y.toFixed(1)} L300 ${(y + 10).toFixed(1)} Z"/>`;
    }).join('');
    return `
      <svg class="prism" viewBox="0 0 300 200" aria-hidden="true" focusable="false">
        <path class="prism__beam" d="M0 94 L130 98 L130 102 L0 106 Z"/>
        ${rays}
        <path class="prism__glass" d="M118 150 L150 40 L182 150 Z"/>
      </svg>`;
  }

  V.identity = {
    title: 'Identity & culture',
    world: 'community',
    station: 'identity',
    render(el, params, query, { signal }) {
      const D = T.data;
      el.innerHTML = String(html`
        <div class="container page exhibit">
          ${C.pageHead({
            eyebrow: 'Identity & culture · Pagkakakilanlan', icon: 'people',
            title: 'Many ways of being Deaf',
            lead: 'There is no single Deaf experience. Identity, communication, family and place all differ from person to person. As a learner you are a guest in this community: learn from Deaf people, credit them, and follow each person’s lead.',
          })}
          ${C.reviewNotice()}

          <section class="exhibit-section facets" aria-labelledby="h-facets">
            <h2 class="section__title" id="h-facets">One community, many experiences</h2>
            <div class="facets__layout">
              <div class="facets__visual" aria-hidden="true">${U.raw(prism(D.facets.length))}</div>
              <div class="tabs tabs--vertical" data-facets>
                <div class="tabs__list" role="tablist" aria-label="Facets of Deaf experience" aria-orientation="vertical">
                  ${D.facets.map((f, i) => html`
                    <button type="button" role="tab" class="tabs__tab facet-tab facet-tab--${BEAM_TONES[i % BEAM_TONES.length]}" id="facet-t${i}" aria-controls="facet-p${i}" data-index="${i}"
                      aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}">${T.icon(f.icon)}<span>${f.title}</span></button>`)}
                </div>
                ${D.facets.map((f, i) => html`
                  <div role="tabpanel" class="tabs__panel facet-panel" id="facet-p${i}" aria-labelledby="facet-t${i}" tabindex="0" ${i === 0 ? '' : U.raw('hidden')}>
                    <p class="facet-panel__title">${f.title}</p>
                    <p>${f.text}</p>
                  </div>`)}
              </div>
            </div>
          </section>

          <section class="exhibit-section" aria-labelledby="h-etiquette">
            <div class="section__head">
              <h2 class="section__title" id="h-etiquette">A visual way of life</h2>
              <a class="link-arrow" href="#/play/sightlines">Practice it: play Sightlines ${T.icon('arrow-right')}</a>
            </div>
            <p class="section__lead">Everyday habits that keep communication visual and respectful.</p>
            <div class="dodont">
              <div class="dodont__col dodont__col--do">
                <h3 class="dodont__title">${T.icon('check-circle')}<span>Do</span></h3>
                <ul>${D.etiquette.dos.map((x) => html`<li data-reveal><strong>${x.title}.</strong> ${x.text}</li>`)}</ul>
              </div>
              <div class="dodont__col dodont__col--dont">
                <h3 class="dodont__title">${T.icon('x-circle')}<span>Don’t</span></h3>
                <ul>${D.etiquette.donts.map((x) => html`<li data-reveal><strong>${x.title}.</strong> ${x.text}</li>`)}</ul>
              </div>
            </div>
          </section>

          <section class="exhibit-section" id="words" aria-labelledby="h-words">
            <div class="section__head">
              <h2 class="section__title" id="h-words">Words matter</h2>
              <a class="link-arrow" href="#/play/word-lens">Practice it: play Word Lens ${T.icon('arrow-right')}</a>
            </div>
            <p class="section__lead">Respectful language follows how Deaf people describe themselves. When unsure, ask.</p>
            <ul class="terms">
              ${D.terms.map((t, i) => html`
                <li class="term" data-reveal style="--d:${i % 3}">
                  <p class="term__say"><span class="term__label">Say</span><strong>${t.use}</strong></p>
                  <p class="term__avoid"><span class="term__label">Instead of</span><s>${t.avoid}</s></p>
                  <p class="term__why">${t.why}</p>
                </li>`)}
            </ul>
          </section>

          <section class="exhibit-section split" aria-labelledby="h-names">
            <div class="prose">
              <h2 class="section__title" id="h-names">Sign names</h2>
              <p>Many Deaf communities use <strong>sign names</strong>: a sign that stands for a particular person. In many communities, a sign name is <strong>given by Deaf people</strong> who know you, rather than invented by a learner.</p>
              <p>Until you receive one, <strong>fingerspell your name</strong>. Ask your Deaf teacher how sign names work in your local community.</p>
            </div>
            <div class="split__art">${U.raw(T.art.lesson('community'))}</div>
          </section>

          <section class="exhibit-section" id="myths" aria-labelledby="h-myths">
            <div class="section__head">
              <h2 class="section__title" id="h-myths">Myths &amp; facts</h2>
              <a class="link-arrow" href="#/play/myth-fact">Test yourself: Myth or Fact? ${T.icon('arrow-right')}</a>
            </div>
            <p class="section__lead">Select a card to reveal the fact.</p>
            <div class="myth-grid">
              ${D.myths.map((m, i) => html`
                <article class="myth" data-flipped="false" data-reveal style="--d:${i % 3}">
                  <div class="myth__face myth__face--front">
                    <p class="myth__tag">${T.icon('help')}<span>Myth</span></p>
                    <p class="myth__text">${m.myth}</p>
                    <button type="button" class="btn btn--secondary btn--sm" data-flip-myth aria-expanded="false" aria-controls="myth-${i}">Reveal the fact</button>
                  </div>
                  <div class="myth__face myth__face--back" id="myth-${i}" hidden>
                    <p class="myth__tag myth__tag--fact">${T.icon('check-circle')}<span>Fact</span></p>
                    <p class="myth__text">${m.fact}</p>
                    <button type="button" class="btn btn--ghost btn--sm" data-unflip-myth>Show the myth again</button>
                  </div>
                </article>`)}
            </div>
          </section>

          ${C.exhibitFooter('identity')}
        </div>`);

      // Facets: accessible tabs; the matching ray of light glows.
      const rays = U.$$('[data-ray]', el);
      const glow = (i) => rays.forEach((r) => r.classList.toggle('is-on', Number(r.dataset.ray) === i));
      glow(0);
      C.bindTabs(el.querySelector('[data-facets]'), signal, (tab) => glow(Number(tab.dataset.index)));

      el.addEventListener('click', (e) => {
        const flip = e.target.closest('[data-flip-myth]');
        if (flip) {
          const card = flip.closest('.myth');
          card.dataset.flipped = 'true';
          card.querySelector('.myth__face--back').hidden = false;
          card.querySelector('.myth__face--front').hidden = true;
          flip.setAttribute('aria-expanded', 'true');
          const back = card.querySelector('[data-unflip-myth]');
          if (back) back.focus({ preventScroll: true });
        }
        const unflip = e.target.closest('[data-unflip-myth]');
        if (unflip) {
          const card = unflip.closest('.myth');
          card.dataset.flipped = 'false';
          card.querySelector('.myth__face--back').hidden = true;
          card.querySelector('.myth__face--front').hidden = false;
          const front = card.querySelector('[data-flip-myth]');
          front.setAttribute('aria-expanded', 'false');
          front.focus({ preventScroll: true });
        }
      }, { signal });

      T.fx.reveal(el, signal);
      C.exhibitEnd(el, 'identity', signal);
      const anchor = ['words', 'myths'].includes(query.s) ? el.querySelector(`#${query.s}`) : null;
      if (anchor) setTimeout(() => anchor.scrollIntoView({ block: 'start' }), 60);
    },
  };
})();
