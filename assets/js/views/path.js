/* =========================================================================
   Tanaw — Learning path (#/learn/path)
   Units are islands; lessons are stops on one route. The route line is
   drawn through the stops after layout (decorative; the lessons themselves
   are ordinary ordered lists of links).
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const KIND = {
    concept: { label: 'Concepts', icon: 'layers' },
    culture: { label: 'Culture', icon: 'culture' },
    practice: { label: 'Practice', icon: 'practice' },
    signs: { label: 'Vocabulary', icon: 'library' },
  };

  function stop(id, n, currentId) {
    const lesson = T.data.getLesson(id);
    const done = T.progress.lessonDone(id);
    const state = T.store.state.progress.lessonState[id];
    const kind = KIND[lesson.kind] || KIND.concept;
    const result = T.store.state.progress.lessons[id];
    const status = done ? 'done' : id === currentId ? 'current' : state ? 'progress' : 'todo';
    let mediaInfo = '';
    if (lesson.kind === 'signs' && T.config.demonstrations) {
      const c = T.media.counts(T.data.lessonSignIds(lesson));
      mediaInfo = html`<span>${T.icon(c.withMedia ? 'film' : 'hourglass')}<span>${c.withMedia}/${c.total} demonstrations</span></span>`;
    } else if (lesson.kind === 'signs') {
      const ids = T.data.lessonSignIds(lesson);
      const learned = ids.filter(C.isLearned).length;
      mediaInfo = html`<span>${T.icon('check-circle')}<span>${learned}/${ids.length} learned</span></span>`;
    }
    const cta = done ? 'Review' : state ? 'Resume' : 'Start';
    const spoken = { done: 'completed', current: state ? 'in progress, next up' : 'next up', progress: 'in progress', todo: 'not started' }[status];
    return html`
      <li class="stop is-${status}" data-stop>
        <span class="stop__node" aria-hidden="true">${done ? T.icon('check') : n}</span>
        <div class="stop__card">
          ${status === 'current' ? html`<p class="stop__here" aria-hidden="true">${T.icon('pin')}<span>You are here</span></p>` : ''}
          <h3 class="stop__title"><a href="#/learn/${id}">${lesson.title}<span class="visually-hidden"> (lesson ${n}, ${spoken})</span></a></h3>
          <p class="stop__summary">${lesson.summary}</p>
          <p class="stop__meta">
            <span>${T.icon(kind.icon)}<span>${kind.label}</span></span>
            <span>${T.icon('clock')}<span>${lesson.minutes} min</span></span>
            ${mediaInfo}
            ${result && result.total ? html`<span>${T.icon('target')}<span>Best ${result.bestScore}/${result.total}</span></span>` : ''}
          </p>
          <span class="btn btn--sm ${status === 'current' || status === 'progress' ? 'btn--primary' : done ? 'btn--ghost' : 'btn--secondary'} stop__cta" aria-hidden="true">${cta}</span>
        </div>
      </li>`;
  }

  /** Smooth curve through points (Catmull–Rom converted to cubic Béziers). */
  function smooth(pts) {
    if (pts.length < 2) return '';
    const f = (n) => n.toFixed(1);
    let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      d += ` C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
    }
    return d;
  }

  V.path = {
    title: 'Learning path',
    world: 'learn',
    station: 'path',
    render(el, params, query, { signal }) {
      const order = T.data.lessonOrder();
      const done = order.filter(T.progress.lessonDone).length;
      const next = T.progress.nextLesson();
      let n = 0;

      el.innerHTML = String(html`
        <div class="container page path-page">
          ${C.pageHead({
            eyebrow: 'Learning path', icon: 'path',
            title: 'Four islands, one route',
            lead: `Short lessons with interactive checks, in order. Foundations comes first: the culture and structure that make every sign meaningful. ${T.config.demonstrations
              ? 'Vocabulary stops light up as verified demonstrations are added.'
              : 'Vocabulary stops list the words to learn with a Deaf teacher, and keep track of the ones you can sign.'}`,
          })}

          <div class="path-summary card">
            ${C.ring(order.length ? (done / order.length) * 100 : 0, { size: 84, stroke: 9, label: `${done}/${order.length}` })}
            <div class="path-summary__text">
              <p class="path-summary__title">${done === order.length ? 'Route complete — mahusay!' : `${order.length - done} stop${order.length - done === 1 ? '' : 's'} to go`}</p>
              <p class="path-summary__meta">${T.icon('star')} ${T.store.state.progress.xp} XP · ${T.icon('flame')} ${T.progress.streak().current}-day streak</p>
            </div>
            ${next ? html`<a class="btn btn--primary" href="#/learn/${next}">${T.store.state.progress.lessonState[next] ? 'Resume' : 'Next'}: ${T.data.getLesson(next).title} ${T.icon('arrow-right')}</a>` : ''}
          </div>

          <div class="route" data-route>
            <svg class="route__line" aria-hidden="true" focusable="false"><path class="route__trail" d=""/><path class="route__done" d=""/></svg>
            <ol class="route__isles">
              ${T.data.units.map((unit) => {
                const unitDone = unit.lessons.filter(T.progress.lessonDone).length;
                return html`
                  <li class="isle isle--${unit.tone}">
                    <section aria-labelledby="isle-${unit.id}">
                      <header class="isle__head">
                        <span class="isle__icon">${T.icon(unit.icon, { size: 28 })}</span>
                        <div class="isle__text">
                          <p class="isle__eyebrow">Island ${unit.num} · <span lang="fil">${unit.fil}</span></p>
                          <h2 class="isle__title" id="isle-${unit.id}">${unit.title}</h2>
                          <p class="isle__desc">${unit.description}</p>
                        </div>
                        <div class="isle__progress">
                          <span class="isle__count">${unitDone}/${unit.lessons.length}</span>
                          ${C.bar((unitDone / unit.lessons.length) * 100, `${unit.title} progress`, unit.tone)}
                        </div>
                      </header>
                      <ol class="stops">${unit.lessons.map((id) => stop(id, ++n, next))}</ol>
                    </section>
                  </li>`;
              })}
            </ol>
          </div>

          <div class="callout callout--note path-note" role="note">
            ${T.icon('info')}
            <div>
              ${T.config.demonstrations ? html`
                <p class="callout__title">Why are some vocabulary stops waiting for demonstrations?</p>
                <p>Tanaw only shows FSL signs recorded by Deaf signers and reviewed by qualified FSL educators. Until those arrive, vocabulary lessons teach context and let you self-check what you learn from a Deaf teacher. <a href="#/about">Read the content policy</a>.</p>` : html`
                <p class="callout__title">Where are the signs?</p>
                <p>Tanaw does not show how to make whole signs: a sign shown wrongly teaches a mistake. Vocabulary lessons give each word’s meaning and culture notes, and help you keep track of the signs you learn from a Deaf teacher.${T.config.hand3d ? html` The letters and handshapes signs are built from are in the experimental <a href="#/lab">3D Hand Lab</a>.` : ''} <a href="#/about">Read why</a>.</p>`}
            </div>
          </div>
        </div>`);

      // Draw the route through the stop nodes.
      const route = el.querySelector('[data-route]');
      const svgEl = route.querySelector('.route__line');
      const trail = route.querySelector('.route__trail');
      const doneEl = route.querySelector('.route__done');
      const draw = () => {
        const box = route.getBoundingClientRect();
        if (!box.width) return;
        const nodes = U.$$('[data-stop]', route);
        const pts = nodes.map((li) => {
          const r = li.querySelector('.stop__node').getBoundingClientRect();
          return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
        });
        svgEl.setAttribute('viewBox', `0 0 ${box.width.toFixed(0)} ${box.height.toFixed(0)}`);
        svgEl.setAttribute('width', box.width.toFixed(0));
        svgEl.setAttribute('height', box.height.toFixed(0));
        trail.setAttribute('d', smooth(pts));
        const reached = nodes.reduce((last, li, i) => (li.classList.contains('is-done') || li.classList.contains('is-current') ? i : last), -1);
        doneEl.setAttribute('d', reached > 0 ? smooth(pts.slice(0, reached + 1)) : '');
      };
      draw();
      const redraw = U.rafThrottle(draw);
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(redraw);
        ro.observe(route);
        signal.addEventListener('abort', () => ro.disconnect(), { once: true });
      } else {
        window.addEventListener('resize', redraw, { signal });
      }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!signal.aborted) draw(); });

      // Bring "You are here" into view on arrival.
      const here = route.querySelector('.stop.is-current');
      if (here && done > 0) setTimeout(() => { if (!signal.aborted) here.scrollIntoView({ block: 'center', behavior: U.reducedMotion() ? 'auto' : 'smooth' }); }, 350);
    },
  };
})();
