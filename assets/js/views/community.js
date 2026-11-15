/* =========================================================================
   Tanaw — Deaf Community world: hub (#/community), Calendar and Connect.
   Content in this world is drawn from Deaf-led organizations and primary
   sources (culture.js). It has not yet been reviewed by Deaf partners, and
   every page says so.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html, raw } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const EXHIBITS = [
    { id: 'identity', href: '#/community/identity', icon: 'people', tone: 'coral', fil: 'Pagkakakilanlan',
      title: 'Identity & culture', text: 'deaf, Deaf and hard of hearing; a visual way of life; the words that respect people; myths and facts.' },
    { id: 'stories', href: '#/community/stories', icon: 'story', tone: 'gold', fil: 'Kuwento',
      title: 'Stories', text: () => `${T.data.storyList ? T.data.storyList.length : 'Six'} documented moments from Filipino Deaf history, told in short chapters with their sources.` },
    { id: 'history', href: '#/community/history', icon: 'compass', tone: 'teal', fil: 'Kasaysayan',
      title: 'History', text: () => `A journey in ${T.data.timeline.length} stops, from the first school for the Deaf in 1907 to the FSL Act.` },
    { id: 'rights', href: '#/community/rights', icon: 'scale', tone: 'indigo', fil: 'Karapatan',
      title: 'Rights', text: () => `${T.data.rights.length} areas of RA 11106, from the classroom and the clinic to TV news.` },
    { id: 'calendar', href: '#/community/calendar', icon: 'calendar', tone: 'coral', fil: 'Kalendaryo',
      title: 'Calendar', text: 'Observances to remember, with a countdown and calendar files you can save.' },
    { id: 'connect', href: '#/community/connect', icon: 'link', tone: 'teal', fil: 'Ugnayan',
      title: 'Connect', text: 'Deaf-led organizations, FSL programs, and every source behind this section.' },
  ].filter((x) => T.progress.COMMUNITY_EXHIBITS.includes(x.id));

  /** Where this section's content comes from (shown on every Deaf Community page). */
  C.reviewNotice = () => html`
    <p class="review-note">${T.icon('book')}<span><strong>Sources &amp; status.</strong> Written by the Tanaw student team from published sources, listed in <a href="#/community/connect?s=sources">Connect → Sources</a>. Not reviewed by Deaf organizations.</span></p>`;

  /** Mark an exhibit explored when the visitor reaches its end. */
  C.exhibitEnd = (el, id, signal) => {
    const end = el.querySelector('[data-exhibit-end]');
    T.fx.onceVisible(end, () => {
      if (T.progress.markExplored(`exhibit:${id}`, { xp: 5 })) {
        T.ui.toast('Exhibit explored (+5 XP).', { icon: 'weave', tone: 'gold' });
        if (end) end.classList.add('is-done');
      }
    }, signal, 0.5);
  };

  C.exhibitFooter = (id) => {
    const i = EXHIBITS.findIndex((x) => x.id === id);
    const next = EXHIBITS[(i + 1) % EXHIBITS.length];
    const done = T.progress.explored(`exhibit:${id}`);
    return html`
      <footer class="exhibit-end ${done ? 'is-done' : ''}" data-exhibit-end>
        <p class="exhibit-end__mark">${T.icon('check-circle')}<span>${done ? 'You have explored this exhibit.' : 'End of the exhibit.'}</span></p>
        <a class="crossing crossing--next" href="${next.href}">
          <span class="crossing__art" aria-hidden="true">${T.icon(next.icon, { size: 28 })}</span>
          <span class="crossing__text"><span class="crossing__kicker">Next exhibit</span><span class="crossing__title">${next.title}</span></span>
          <span class="crossing__go" aria-hidden="true">${T.icon('arrow-right')}</span>
        </a>
      </footer>`;
  };

  C.EXHIBITS = EXHIBITS;

  /* ===================== Hub ===================== */
  V.community = {
    title: 'Deaf Community',
    world: 'community',
    station: 'community',
    render(el, params, query, { signal }) {
      const explored = EXHIBITS.filter((x) => T.progress.explored(`exhibit:${x.id}`)).length;
      const n = C.nextObservances()[0];

      el.innerHTML = String(html`
        <section class="hub-hero hub-hero--community" aria-labelledby="hub-title">
          <div class="hub-hero__scene" aria-hidden="true"><div class="realm__weave"></div><div class="hub-hero__gathering">${raw(T.art.gathering())}</div></div>
          <div class="container hub-hero__inner">
            <div class="hub-hero__copy">
              <p class="hub-hero__eyebrow"><span lang="fil">Pamayanan</span> · Deaf Community</p>
              <h1 class="hub-hero__title" id="hub-title">A community, a culture, a history</h1>
              <p class="hub-hero__lead">Filipino Sign Language belongs to the Filipino Deaf community. Explore Deaf identity and culture, the history of FSL, the rights in the FSL Act, and the Deaf-led organizations to learn from.</p>
              <a class="hub-hero__count" href="#/community/calendar">
                <span class="hub-hero__count-big">${n.ongoing ? 'Now' : n.days}</span>
                <span class="hub-hero__count-text">${n.ongoing ? 'happening now' : n.days === 1 ? 'day until' : 'days until'}<strong>${n.o.name}</strong>${C.observanceRange(n)}</span>
              </a>
            </div>
          </div>
        </section>

        <div class="container page page--hub">
          ${C.reviewNotice()}
          <div class="hub-section-head">
            <h2 class="section__title hub-section-title">Exhibits</h2>
            <p class="weave-progress" aria-label="${explored} of ${EXHIBITS.length} exhibits explored">
              ${EXHIBITS.map((x) => html`<span class="weave-progress__strand weave-progress__strand--${x.tone} ${T.progress.explored(`exhibit:${x.id}`) ? 'is-on' : ''}" aria-hidden="true"></span>`)}
              <span class="weave-progress__label">${explored}/${EXHIBITS.length} explored</span>
            </p>
          </div>
          <div class="strands" data-tilt-root>
            ${EXHIBITS.map((x, i) => {
              const done = T.progress.explored(`exhibit:${x.id}`);
              return html`
                <a class="strand strand--${x.tone} ${done ? 'is-explored' : ''}" href="${x.href}" data-tilt data-reveal style="--d:${i}">
                  <span class="strand__band" aria-hidden="true"></span>
                  <span class="strand__icon">${T.icon(x.icon, { size: 26 })}</span>
                  <span class="strand__fil" lang="fil">${x.fil}</span>
                  <span class="strand__title">${x.title}</span>
                  <span class="strand__text">${typeof x.text === 'function' ? x.text() : x.text}</span>
                  <span class="strand__state">${done ? html`${T.icon('check-circle')}<span>Explored</span>` : html`${T.icon('eye')}<span>Not yet explored</span>`}</span>
                </a>`;
            })}
          </div>

          <a class="crossing crossing--to-learn" href="#/learn" data-reveal>
            <span class="crossing__art" aria-hidden="true">${T.icon('window', { size: 30 })}</span>
            <span class="crossing__text">
              <span class="crossing__kicker">The other side of the horizon</span>
              <span class="crossing__title">Learn FSL basics, etiquette and respectful communication</span>
            </span>
            <span class="crossing__go" aria-hidden="true">${T.icon('arrow-right')}</span>
          </a>
        </div>`);

      T.fx.tilt(el.querySelector('[data-tilt-root]'), signal);
      T.fx.reveal(el, signal);
      T.fx.pauseOffscreen(el.querySelector('.hub-hero'), signal);
    },
  };

  /* ===================== Calendar ===================== */
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

  /** iCalendar file for one observance (all-day; repeats yearly when the date is fixed). */
  function ics(n) {
    const o = n.o;
    const endExclusive = new Date(n.end);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tanaw//Deaf community calendar//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${o.id}-${n.start.getFullYear()}@tanaw`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(n.start)}`,
      `DTEND;VALUE=DATE:${ymd(endExclusive)}`,
      o.kind === 'last-full-week-september' ? '' : 'RRULE:FREQ=YEARLY',
      `SUMMARY:${esc(o.name)}`,
      `DESCRIPTION:${esc(`${o.text} (${o.by})`)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean);
    return lines.join('\r\n') + '\r\n';
  }

  /** A year wheel: months around a circle, observances as marks, today as a pointer. */
  function wheel(list) {
    const cx = 160;
    const cy = 160;
    const R = 122;
    const angleOf = (d) => {
      const day = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 1)) / 86400000);
      return -Math.PI / 2 + (day / 365) * 2 * Math.PI;
    };
    const pt = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const f = (n) => n.toFixed(1);
    const monthMarks = months.map((m, i) => {
      const a = -Math.PI / 2 + ((i + 0.5) / 12) * 2 * Math.PI;
      const [x, y] = pt(a, R + 22);
      const [x1, y1] = pt(-Math.PI / 2 + (i / 12) * 2 * Math.PI, R - 8);
      const [x2, y2] = pt(-Math.PI / 2 + (i / 12) * 2 * Math.PI, R + 8);
      return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" class="wheel__tick"/><text x="${f(x)}" y="${f(y + 5)}" text-anchor="middle" class="wheel__month">${m}</text>`;
    }).join('');
    // Observances close together on the wheel get their number labels stepped inward.
    const placed = [];
    const marks = list.map((n, i) => {
      const a1 = angleOf(n.start);
      let a2 = angleOf(n.end);
      if (a2 <= a1) a2 = a1 + 0.035;
      const mid = (a1 + a2) / 2;
      const crowd = placed.filter((a) => Math.abs(a - mid) < 0.16).length;
      placed.push(mid);
      const [x1, y1] = pt(a1, R);
      const [x2, y2] = pt(a2 + 0.02, R);
      const [lx, ly] = pt(mid, R - 30 - crowd * 24);
      return `<path d="M${f(x1)} ${f(y1)} A${R} ${R} 0 0 1 ${f(x2)} ${f(y2)}" class="wheel__mark wheel__mark--${i}"/><circle cx="${f(lx)}" cy="${f(ly)}" r="11" class="wheel__dot wheel__dot--${i}"/><text x="${f(lx)}" y="${f(ly + 4.5)}" text-anchor="middle" class="wheel__num">${i + 1}</text>`;
    }).join('');
    const ta = angleOf(new Date());
    const [tx, ty] = pt(ta, R - 52);
    const [hx, hy] = pt(ta, R - 14);
    return `
      <svg class="wheel" viewBox="0 0 320 320" aria-hidden="true" focusable="false">
        <circle cx="${cx}" cy="${cy}" r="${R}" class="wheel__ring"/>
        <circle cx="${cx}" cy="${cy}" r="${R - 44}" class="wheel__inner"/>
        ${monthMarks}
        ${marks}
        <line x1="${cx}" y1="${cy}" x2="${f(hx)}" y2="${f(hy)}" class="wheel__hand"/>
        <circle cx="${cx}" cy="${cy}" r="6" class="wheel__hub"/>
        <text x="${f(tx)}" y="${f(ty + 4)}" text-anchor="middle" class="wheel__today">today</text>
        <text x="${cx}" y="${cy + 34}" text-anchor="middle" class="wheel__year">every year</text>
      </svg>`;
  }

  V.calendar = {
    title: 'Deaf community calendar',
    world: 'community',
    station: 'calendar',
    render(el, params, query, { signal }) {
      const list = C.nextObservances();
      el.innerHTML = String(html`
        <div class="container page exhibit">
          ${C.pageHead({
            eyebrow: 'Calendar · Kalendaryo', icon: 'calendar',
            title: 'Observances to remember',
            lead: 'Dates that matter to Deaf communities in the Philippines and worldwide, sorted by what comes next. They are good moments to join Deaf-led events near you, respectfully.',
          })}
          ${C.reviewNotice()}
          <div class="calendar-layout">
            <figure class="calendar-wheel" data-reveal>
              ${raw(wheel(list))}
              <figcaption>The year at a glance. Numbers match the list.</figcaption>
            </figure>
            <ol class="observance-list">
              ${list.map((n, i) => html`
                <li class="observance ${n.ongoing ? 'is-now' : ''}" data-reveal style="--d:${i}">
                  <div class="observance__date">
                    <span class="observance__num" aria-hidden="true">${i + 1}</span>
                    <span class="observance__month">${U.formatDate(n.start, { month: 'short' })}</span>
                    <span class="observance__day">${n.start.getDate()}</span>
                  </div>
                  <div class="observance__body">
                    <h2 class="observance__name">${n.o.name}</h2>
                    <p class="observance__when"><strong>${C.observanceWhen(n)}</strong> · ${C.observanceRange(n, true)}</p>
                    <p>${n.o.text}</p>
                    <p class="observance__by">${T.icon('book')}<span>${n.o.by}</span></p>
                    <button type="button" class="btn btn--secondary btn--sm" data-ics="${n.o.id}">${T.icon('download')}<span>Add to calendar (.ics)</span></button>
                  </div>
                </li>`)}
            </ol>
          </div>
          <p class="field__hint">${T.icon('lock')}<span>Calendar files are created on this device. Nothing is sent anywhere.</span></p>
          ${C.exhibitFooter('calendar')}
        </div>`);

      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ics]');
        if (!b) return;
        const n = list.find((x) => x.o.id === b.dataset.ics);
        if (!n) return;
        U.download(`tanaw-${n.o.id}.ics`, ics(n), 'text/calendar;charset=utf-8');
        T.progress.markExplored('calendar:saved');
        T.ui.toast(`Calendar file for “${n.o.name}” downloaded.`, { icon: 'calendar' });
      }, { signal });

      T.fx.reveal(el, signal);
      C.exhibitEnd(el, 'calendar', signal);
    },
  };

  /* ===================== Connect ===================== */
  V.connect = {
    title: 'Connect with the Deaf community',
    world: 'community',
    station: 'connect',
    render(el, params, query, { signal }) {
      const D = T.data;
      const resources = D.resources.slice().sort((a, b) => (a.kind === 'Deaf-led organization' ? -1 : 0) - (b.kind === 'Deaf-led organization' ? -1 : 0));
      el.innerHTML = String(html`
        <div class="container page exhibit">
          ${C.pageHead({
            eyebrow: 'Connect · Ugnayan', icon: 'link',
            title: 'Learn with, and from, the Deaf community',
            lead: 'The best FSL teachers are Deaf people. Start with these organizations and programs, and look for Deaf associations in your own city or province.',
          })}
          ${C.reviewNotice()}

          <section class="exhibit-section" aria-labelledby="h-orgs">
            <h2 class="section__title" id="h-orgs">Organizations and programs</h2>
            <div class="resource-grid">
              ${resources.map((r, i) => html`
                <a class="resource ${r.kind === 'Deaf-led organization' ? 'resource--deaf-led' : ''}" href="${r.url}" target="_blank" rel="noopener noreferrer" data-reveal style="--d:${i % 4}">
                  <span class="resource__kind">${r.kind}</span>
                  <span class="resource__name">${r.name}</span>
                  <span class="resource__text">${r.text}</span>
                  <span class="resource__url">${T.icon('external')}<span>${r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span><span class="visually-hidden"> (opens in a new tab)</span></span>
                </a>`)}
            </div>
            <p class="field__hint">${T.icon('info')}<span>External links open in a new tab and need an internet connection. Tanaw is not affiliated with these organizations, and listing them does not mean they endorse Tanaw.</span></p>
          </section>

          <section class="exhibit-section card" aria-labelledby="h-local">
            <h2 class="section__title section__title--sm" id="h-local">${T.icon('map')}<span>Finding your local Deaf community</span></h2>
            <ul class="checklist">
              <li>Ask a national Deaf-led organization, such as the Philippine Federation of the Deaf, about Deaf associations near you.</li>
              <li>Join Deaf-led events during Deaf Awareness Week (November 10–16) and on the International Day of Sign Languages (September 23).</li>
              <li>Choose FSL classes taught by Deaf teachers, and pay Deaf teachers and interpreters fairly.</li>
              <li>Before you post sign language content, ask: is it accurate, is it respectful, and does it credit Deaf signers?</li>
            </ul>
          </section>

          <section class="exhibit-section" id="sources" aria-labelledby="h-sources">
            <h2 class="section__title section__title--sm" id="h-sources">${T.icon('book')}<span>Sources</span></h2>
            <p class="section__lead">Factual statements in Tanaw’s lessons, games and community exhibits are based on these sources (checked October 2026).</p>
            <ol class="source-list">
              ${D.sources.map((s) => html`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`)}
            </ol>
          </section>
          ${C.exhibitFooter('connect')}
        </div>`);

      T.fx.reveal(el, signal);
      C.exhibitEnd(el, 'connect', signal);
      if (query.s === 'sources') {
        const target = el.querySelector('#sources');
        if (target) setTimeout(() => target.scrollIntoView({ block: 'start' }), 60);
      }
    },
  };
})();
