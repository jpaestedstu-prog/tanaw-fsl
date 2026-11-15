/* =========================================================================
   Tanaw — step runner (used by lessons and quizzes)
   Shows one step at a time with a progress bar, Check/Continue flow,
   feedback, Back navigation, keyboard support and optional re-asking of
   missed questions at the end (retrieval practice).
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;

  /**
   * opts: {
   *   title, eyebrow, steps, startIndex, startStats: { correct, answered },
   *   exitHref, exitLabel, requeueMissed, xpPerCorrect, lessonId,
   *   signal, onProgress(stats), onFinish(stats, host)
   * }
   */
  C.runner = (el, opts) => {
    const steps = opts.steps.slice();
    const baseLength = steps.length; // missed questions re-asked at the end are added after this
    const questionTotal = steps.filter((s) => T.steps[s.type] && T.steps[s.type].question).length;
    let movedOn = false;
    const xpPer = opts.xpPerCorrect == null ? 10 : opts.xpPerCorrect;
    const stats = {
      correct: (opts.startStats && Number(opts.startStats.correct)) || 0,
      answered: (opts.startStats && Number(opts.startStats.answered)) || 0,
      total: questionTotal,
      xp: 0,
    };
    let index = U.clamp(opts.startIndex || 0, 0, Math.max(0, steps.length - 1));
    let controller = null;
    let stepCtl = null;      // per-step AbortController
    let submitted = false;
    let finished = false;
    const results = {};      // step index -> { correct }
    const ctxCache = {};     // step index -> render ctx (keeps shuffled order on Back)

    el.innerHTML = String(html`
      <div class="player">
        <header class="player__top">
          <a class="icon-btn player__exit" href="${opts.exitHref}" aria-label="${opts.exitLabel || 'Exit'}">${T.icon('close')}</a>
          <div class="player__meta">
            ${opts.eyebrow ? html`<p class="player__eyebrow">${opts.eyebrow}</p>` : ''}
            <h1 class="player__title">${opts.title}</h1>
          </div>
          <div class="player__progress-wrap">
            <div class="player__progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${index}">
              <span class="player__progress-fill"></span>
            </div>
            <span class="player__count" aria-hidden="true"></span>
          </div>
        </header>
        <div class="player__body">
          <div class="player__step" data-step-host></div>
          <div class="feedback" data-feedback hidden></div>
        </div>
        <footer class="player__bar">
          <div class="player__bar-inner">
            <button type="button" class="btn btn--ghost" data-back>${T.icon('arrow-left')}<span>Back</span></button>
            <button type="button" class="btn btn--primary btn--lg" data-primary><span>Continue</span>${T.icon('arrow-right')}</button>
          </div>
        </footer>
      </div>`);

    const host = el.querySelector('[data-step-host]');
    const feedback = el.querySelector('[data-feedback]');
    const primary = el.querySelector('[data-primary]');
    const back = el.querySelector('[data-back]');
    const fill = el.querySelector('.player__progress-fill');
    const bar = el.querySelector('.player__progress');
    const count = el.querySelector('.player__count');

    const typeOf = (step) => T.steps[step.type] || T.steps.content;
    const isQuestion = (step) => !!typeOf(step).question;

    function setPrimary(label, enabled, icon = 'arrow-right') {
      primary.innerHTML = String(html`<span>${label}</span>${T.icon(icon)}`);
      primary.disabled = !enabled;
    }

    // Progress is measured against the lesson's own steps, so re-asked questions never
    // make the bar move backwards; they are shown as a short review round instead.
    function updateProgress() {
      const inReview = index >= baseLength;
      const pct = inReview ? 100 : Math.round((index / baseLength) * 100);
      fill.style.width = `${pct}%`;
      bar.setAttribute('aria-valuemax', String(baseLength));
      bar.setAttribute('aria-valuenow', String(Math.min(index, baseLength)));
      if (inReview) {
        const n = index - baseLength + 1;
        const of = steps.length - baseLength;
        bar.setAttribute('aria-valuetext', `Review round: question ${n} of ${of}`);
        count.textContent = `Review ${n} / ${of}`;
      } else {
        bar.setAttribute('aria-valuetext', `Step ${index + 1} of ${baseLength}`);
        count.textContent = `${index + 1} / ${baseLength}`;
      }
    }

    function hideFeedback() {
      feedback.hidden = true;
      feedback.className = 'feedback';
      feedback.innerHTML = '';
    }

    function showFeedback(res) {
      feedback.hidden = false;
      feedback.className = `feedback ${res.correct ? 'feedback--correct' : 'feedback--wrong'}`;
      feedback.innerHTML = String(html`
        <span class="feedback__icon">${T.icon(res.correct ? 'check-circle' : 'x-circle', { size: 28 })}</span>
        <div class="feedback__body">
          <p class="feedback__title">${res.correct ? pick(['Correct!', 'Tama! Well done.', 'Exactly right.', 'Mahusay!']) : 'Not quite.'}</p>
          ${res.correctText ? html`<p class="feedback__answer"><strong>Answer:</strong> ${res.correctText}</p>` : ''}
          ${res.explain ? html`<p>${res.explain}</p>` : ''}
        </div>`);
    }

    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    if (opts.signal) opts.signal.addEventListener('abort', () => { if (stepCtl) stepCtl.abort(); }, { once: true });

    function render(focus) {
      if (stepCtl) stepCtl.abort();
      stepCtl = new AbortController();
      hideFeedback();
      submitted = false;
      const step = steps[index];
      const type = typeOf(step);
      const ctx = ctxCache[index] || (ctxCache[index] = {});
      ctx.signal = stepCtl.signal;
      ctx.lessonId = opts.lessonId || '';
      ctx.changed = () => {
        if (isQuestion(step) && !submitted && controller && controller.canSubmit) primary.disabled = !controller.canSubmit();
      };
      host.innerHTML = String(type.render(step, ctx));
      controller = type.mount ? type.mount(host, step, ctx) || null : null;
      C.hydrateMedia(host);
      back.hidden = index === 0;
      updateProgress();

      if (isQuestion(step)) {
        if (results[index]) {
          // Revisiting an answered question: show it resolved.
          if (controller && controller.reveal) controller.reveal();
          submitted = true;
          setPrimary('Continue', true);
        } else {
          setPrimary('Check', false, 'check');
        }
      } else {
        setPrimary(index === steps.length - 1 ? 'Finish' : 'Continue', true, index === steps.length - 1 ? 'check' : 'arrow-right');
      }

      if (focus) {
        const title = host.querySelector('.step__title');
        if (title) {
          title.setAttribute('tabindex', '-1');
          title.focus({ preventScroll: true });
        }
        const top = el.getBoundingClientRect().top + window.scrollY - 8;
        if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: U.reducedMotion() ? 'auto' : 'smooth' });
      }
    }

    function submit() {
      const step = steps[index];
      if (!controller || !controller.canSubmit || !controller.canSubmit()) return;
      const res = controller.submit();
      submitted = true;
      results[index] = { correct: res.correct };
      if (!step.retry) {
        stats.answered += 1;
        if (res.correct) {
          stats.correct += 1;
          stats.xp += xpPer;
          if (xpPer) {
            T.progress.addXP(xpPer, { reason: 'answer' });
            T.ui.xpBurst(xpPer, primary);
          }
        } else if (opts.requeueMissed) {
          steps.push(Object.assign({}, step, { retry: true }));
        }
      } else {
        T.progress.logActivity();
      }
      showFeedback(res);
      // One announcement with the whole message; the panel itself is not a live region.
      T.ui.announce(feedback.querySelector('.feedback__body').textContent.replace(/\s+/g, ' ').trim());
      setPrimary(index === steps.length - 1 ? 'Finish' : 'Continue', true, index === steps.length - 1 ? 'check' : 'arrow-right');
      primary.focus({ preventScroll: true });
      feedback.scrollIntoView({ block: 'nearest', behavior: U.reducedMotion() ? 'auto' : 'smooth' });
      // Resume after this question next time, so it is never scored twice.
      if (opts.onProgress) opts.onProgress({ index: Math.min(index + 1, steps.length - 1), correct: stats.correct, answered: stats.answered });
    }

    function next() {
      if (controller && controller.beforeNext) {
        try { controller.beforeNext(); } catch (err) { console.error(err); }
      }
      if (!movedOn) {
        movedOn = true;
        T.progress.logActivity();
      }
      if (index >= steps.length - 1) { finish(); return; }
      index += 1;
      if (opts.onProgress) opts.onProgress({ index, correct: stats.correct, answered: stats.answered });
      render(true);
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (stepCtl) stepCtl.abort();
      fill.style.width = '100%';
      if (opts.onFinish) opts.onFinish(stats, el);
    }

    primary.addEventListener('click', () => {
      const step = steps[index];
      if (isQuestion(step) && !submitted) submit();
      else next();
    }, { signal: opts.signal });

    back.addEventListener('click', () => {
      if (index === 0) return;
      index -= 1;
      render(true);
    }, { signal: opts.signal });

    document.addEventListener('keydown', (e) => {
      if (finished || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'TEXTAREA' || (tag === 'INPUT' && !['radio', 'checkbox'].includes(t.type))) return;
      if (e.key === 'Enter') {
        if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return;
        if (!primary.disabled) { e.preventDefault(); primary.click(); }
        return;
      }
      if (/^[1-9]$/.test(e.key) && controller && controller.onKey && !submitted) {
        if (controller.onKey(e)) e.preventDefault();
      }
    }, { signal: opts.signal });

    render(false);

    return {
      get stats() { return stats; },
      get index() { return index; },
    };
  };
})();
