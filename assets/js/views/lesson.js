/* =========================================================================
   Tanaw — lesson player (#/learn/:id)
   Expands dynamic steps (vocabulary galleries, recognition checks), resumes
   where the learner left off and records completion.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  /** Turn data steps into runnable steps (media-aware). */
  function buildSteps(lesson) {
    const signIds = T.data.lessonSignIds(lesson);
    const out = [];
    lesson.steps.forEach((step) => {
      if (step.type === 'hand3d' && !T.config.hand3d) return;
      if (step.type === 'signs') {
        out.push(Object.assign({}, step, { signIds }));
      } else if (step.type === 'signcheck') {
        const withMedia = signIds.filter((id) => T.media.hasMedia(id));
        if (withMedia.length >= 4) {
          U.sample(withMedia, Math.min(5, withMedia.length)).forEach((id) => {
            const distractors = U.sample(signIds.filter((x) => x !== id), 3);
            out.push({ type: 'recognize', signId: id, options: U.shuffle([id].concat(distractors)) });
          });
        } else {
          out.push({ type: 'selfcheck', signIds, withMedia: withMedia.length });
        }
      } else {
        out.push(step);
      }
    });
    return out;
  }

  function completion(lesson, stats, host) {
    const firstTime = T.progress.completeLesson(lesson.id, stats.correct, stats.total);
    const order = T.data.lessonOrder();
    const nextId = order.slice(order.indexOf(lesson.id) + 1).find((id) => !T.progress.lessonDone(id)) || order.find((id) => !T.progress.lessonDone(id));
    const next = nextId ? T.data.getLesson(nextId) : null;
    const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 100;
    const lessonXP = stats.xp + (firstTime ? 20 : 5);
    host.innerHTML = String(html`
      <section class="complete" aria-labelledby="complete-title">
        <div class="complete__burst" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => html`<span style="--i:${i}"></span>`)}</div>
        <span class="complete__icon">${T.icon('trophy', { size: 44 })}</span>
        <p class="eyebrow">Lesson complete</p>
        <h1 class="complete__title" id="complete-title" tabindex="-1">${!stats.total ? 'Lesson complete — mahusay!' : pct === 100 ? 'Mahusay! Perfect lesson.' : pct >= 60 ? 'Well done!' : 'Lesson finished — keep practicing.'}</h1>
        <p class="complete__lesson">${lesson.title}</p>
        <div class="complete__stats">
          ${stats.total ? C.statTile({ icon: 'target', value: `${stats.correct}/${stats.total}`, label: 'First-try answers', tone: 'teal' }) : ''}
          ${C.statTile({ icon: 'star', value: `+${lessonXP}`, label: 'XP earned', tone: 'gold' })}
          ${C.statTile({ icon: 'flame', value: String(T.progress.streak().current), label: 'Day streak', tone: 'coral' })}
        </div>
        <div class="complete__actions">
          ${next ? html`<a class="btn btn--primary btn--lg" href="#/learn/${nextId}">Next: ${next.title} ${T.icon('arrow-right')}</a>` : html`<a class="btn btn--primary btn--lg" href="#/practice">Go to Practice ${T.icon('arrow-right')}</a>`}
          <a class="btn btn--secondary" href="#/learn/path">${T.icon('path')}<span>Learning path</span></a>
          <a class="btn btn--ghost" href="#/practice/review">${T.icon('layers')}<span>Review concepts</span></a>
        </div>
      </section>`);
    const title = host.querySelector('#complete-title');
    if (title) title.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    T.ui.announce('Lesson complete.');
  }

  V.lesson = {
    focusMode: true,
    world: 'learn',
    station: 'path',
    title: (params) => {
      const l = T.data.getLesson(params.id);
      return l ? l.title : 'Lesson not found';
    },
    render(el, params, query, { signal }) {
      const lesson = T.data.getLesson(params.id);
      if (!lesson) {
        el.innerHTML = String(html`<div class="container page">${C.emptyState({ icon: 'help', title: 'Lesson not found', body: 'This lesson does not exist. It may have been renamed.', action: html`<a class="btn btn--primary" href="#/learn/path">Back to the learning path</a>`, page: true })}</div>`);
        return;
      }
      const unit = T.data.unitOf(lesson.id);
      const steps = buildSteps(lesson);
      const saved = T.store.state.progress.lessonState[lesson.id];
      const restart = query.restart === '1' || T.progress.lessonDone(lesson.id);
      const startIndex = !restart && saved ? U.clamp(Number(saved.index) || 0, 0, steps.length - 1) : 0;

      // Activity (for the streak) is recorded by the runner once the learner actually moves on,
      // not merely for opening the lesson.
      C.runner(el, {
        title: lesson.title,
        eyebrow: `Unit ${unit.num} · ${unit.title}`,
        steps,
        startIndex,
        startStats: !restart && saved ? saved : null,
        exitHref: '#/learn/path',
        exitLabel: 'Exit lesson (your place is saved)',
        requeueMissed: true,
        xpPerCorrect: 10,
        lessonId: lesson.id,
        signal,
        onProgress: (p) => {
          T.store.update((st) => { st.progress.lessonState[lesson.id] = { index: p.index, correct: p.correct, answered: p.answered }; }, { silent: true });
        },
        onFinish: (stats, host) => completion(lesson, stats, host),
      });
    },
  };
})();
