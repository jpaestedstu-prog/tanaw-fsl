/* =========================================================================
   Tanaw — Stories exhibit (#/community/stories, #/community/stories/:id)
   Documented moments from Filipino Deaf history, read chapter by chapter.
   Every chapter links to its source; each story ends with a question and a
   private reflection for the journal. No personal testimonies are invented.
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const readKey = (id) => `story:${id}`;

  function sourceLink(id) {
    const s = T.data.getSource(id);
    if (!s) return '';
    return html`<a class="chapter__source" href="${s.url}" target="_blank" rel="noopener noreferrer">${T.icon('book')}<span>Source</span><span class="visually-hidden">: ${s.label} (opens in a new tab)</span></a>`;
  }

  /* ===================== Hub ===================== */
  V.stories = {
    title: 'Stories',
    world: 'community',
    station: 'stories',
    render(el, params, query, { signal }) {
      const list = T.data.storyList;
      const read = list.filter((s) => T.progress.explored(readKey(s.id))).length;
      el.innerHTML = String(html`
        <div class="container page exhibit">
          ${C.pageHead({
            eyebrow: 'Stories · Kuwento', icon: 'story',
            title: 'Stories from Filipino Deaf history',
            lead: `${list.length} documented moments, told in short chapters — from the first school for the Deaf to interpreters on the evening news. Every chapter links to its source.`,
          })}
          ${C.reviewNotice()}

          <div class="section__head">
            <h2 class="section__title section__title--sm">${T.icon('layers')}<span>Choose a story</span></h2>
            <p class="muted">${read} of ${list.length} read</p>
          </div>
          <ol class="story-grid">
            ${list.map((s, i) => {
              const done = T.progress.explored(readKey(s.id));
              return html`
                <li data-reveal style="--d:${i % 3}">
                  <a class="story-card story-card--${s.tone} ${done ? 'is-read' : ''}" href="#/community/stories/${s.id}">
                    <span class="story-card__era">${s.era}</span>
                    <span class="story-card__icon" aria-hidden="true">${T.icon(s.icon, { size: 26 })}</span>
                    <span class="story-card__title">${s.title}</span>
                    <span class="story-card__fil" lang="fil">${s.fil}</span>
                    <span class="story-card__text">${s.summary}</span>
                    <span class="story-card__meta">${s.chapters.length} chapters${done ? html` · ${T.icon('check-circle')}<span>Read</span>` : ''}</span>
                  </a>
                </li>`;
            })}
          </ol>
          <p class="field__hint">${T.icon('info')}<span>These are histories drawn from published records, not personal testimonies. Stories told by Deaf Filipinos themselves would need their informed consent.</span></p>

          ${C.exhibitFooter('stories')}
        </div>`);
      T.fx.reveal(el, signal);
      C.exhibitEnd(el, 'stories', signal);
    },
  };

  /* ===================== Reader ===================== */
  V.story = {
    world: 'community',
    station: 'stories',
    title: (params) => { const s = T.data.getStory(params.id); return s ? `${s.title} — Stories` : 'Story not found'; },
    render(el, params, query, { signal }) {
      const story = T.data.getStory(params.id);
      if (!story) {
        el.innerHTML = String(html`<div class="container page">${C.emptyState({ icon: 'story', title: 'Story not found', body: 'That story does not exist.', action: html`<a class="btn btn--primary" href="#/community/stories">All stories</a>`, page: true })}</div>`);
        return;
      }
      const list = T.data.storyList;
      const idx = list.indexOf(story);
      const next = list[(idx + 1) % list.length];
      const total = story.chapters.length + 1; // chapters, then the checkpoint
      let at = U.clamp(Number(query.ch) || 0, 0, total - 1);
      let answered = false;

      el.innerHTML = String(html`
        <div class="container page story-reader story-reader--${story.tone}">
          ${C.pageHead({
            crumbs: [{ label: 'Stories', href: '#/community/stories' }, { label: story.title }],
            eyebrow: html`<span lang="fil">${story.fil}</span> · ${story.era}`, icon: story.icon,
            title: story.title,
            lead: story.summary,
          })}
          <div class="story-progress" aria-hidden="true">
            ${Array.from({ length: total }, (_, i) => html`<span class="story-progress__dot" data-dot="${i}"></span>`)}
          </div>
          <div class="chapter-stage" data-stage></div>
          <div class="story-nav">
            <button type="button" class="btn btn--ghost" data-prev>${T.icon('arrow-left')}<span>Previous</span></button>
            <p class="story-nav__count" data-count aria-live="polite"></p>
            <button type="button" class="btn btn--primary" data-next><span>Next</span>${T.icon('arrow-right')}</button>
          </div>
          <p class="field__hint story-reader__keys">${T.icon('keyboard')}<span>Use ← and → to move between chapters.</span></p>
        </div>`);

      const stageEl = el.querySelector('[data-stage]');
      const prevBtn = el.querySelector('[data-prev]');
      const nextBtn = el.querySelector('[data-next]');
      const count = el.querySelector('[data-count]');

      function chapterView(i) {
        const ch = story.chapters[i];
        return html`
          <article class="chapter" aria-labelledby="ch-title">
            <p class="chapter__kicker">${ch.kicker}</p>
            <h2 class="chapter__title" id="ch-title" tabindex="-1">${ch.title}</h2>
            <p class="chapter__text">${ch.text}</p>
            ${sourceLink(ch.src)}
          </article>`;
      }

      function checkpointView() {
        const c = story.check;
        return html`
          <article class="chapter chapter--check" aria-labelledby="ch-title">
            <p class="chapter__kicker">${T.icon('target')}<span>Check what you learned</span></p>
            <h2 class="chapter__title" id="ch-title" tabindex="-1">${c.prompt}</h2>
            <div class="answer-list" role="group" aria-label="Answers">
              ${c.options.map((o, k) => html`<button type="button" class="answer" data-answer="${k}"><span class="answer__key" aria-hidden="true">${k + 1}</span><span class="answer__text">${o}</span></button>`)}
            </div>
            <div data-check-feedback></div>
            <form class="story-reflect" data-reflect hidden>
              <label class="field__label" for="story-reflect">${story.reflect}</label>
              <textarea class="textarea" id="story-reflect" rows="3" maxlength="600" placeholder="A private note for your journal (optional)"></textarea>
              <div class="btn-row">
                <button type="submit" class="btn btn--secondary">${T.icon('edit')}<span>Save to my journal</span></button>
                <a class="btn btn--primary" href="#/community/stories/${next.id}">Next story: ${next.title} ${T.icon('arrow-right')}</a>
              </div>
            </form>
          </article>`;
      }

      function show(i, focus) {
        at = U.clamp(i, 0, total - 1);
        const isCheck = at === total - 1;
        stageEl.innerHTML = String(isCheck ? checkpointView() : chapterView(at));
        answered = false;
        U.$$('[data-dot]', el).forEach((d) => {
          const k = Number(d.dataset.dot);
          d.classList.toggle('is-done', k < at);
          d.classList.toggle('is-current', k === at);
        });
        prevBtn.disabled = at === 0;
        nextBtn.hidden = isCheck;
        count.textContent = isCheck ? 'Last step: a question' : `Chapter ${at + 1} of ${story.chapters.length}`;
        T.router.replaceQuery(`/community/stories/${story.id}`, { ch: at ? String(at) : '' });
        if (focus) { const h = stageEl.querySelector('#ch-title'); if (h) h.focus({ preventScroll: true }); }
        if (isCheck && T.progress.markExplored(readKey(story.id), { xp: 5 })) {
          T.ui.toast('Story read (+5 XP).', { icon: 'story', tone: 'gold' });
          T.progress.markExplored('exhibit:stories', { xp: 5 });
        }
      }

      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-prev]')) show(at - 1, true);
        if (e.target.closest('[data-next]')) show(at + 1, true);
        const a = e.target.closest('[data-answer]');
        if (a && !answered) {
          answered = true;
          const k = Number(a.dataset.answer);
          const ok = k === story.check.answer;
          U.$$('[data-answer]', el).forEach((b) => {
            b.disabled = true;
            if (Number(b.dataset.answer) === story.check.answer) b.classList.add('is-correct');
          });
          if (!ok) a.classList.add('is-wrong');
          if (ok) T.progress.addXP(5, { reason: 'story' }); else T.progress.logActivity();
          const fb = el.querySelector('[data-check-feedback]');
          fb.innerHTML = String(html`
            <div class="feedback ${ok ? 'feedback--correct' : 'feedback--wrong'}">
              <span class="feedback__icon">${T.icon(ok ? 'check-circle' : 'x-circle', { size: 28 })}</span>
              <div class="feedback__body"><p class="feedback__title">${ok ? 'Correct!' : 'Not quite.'}</p><p>${story.check.explain}</p></div>
            </div>`);
          T.ui.announce(fb.textContent.replace(/\s+/g, ' ').trim());
          el.querySelector('[data-reflect]').hidden = false;
        }
      }, { signal });

      el.addEventListener('submit', (e) => {
        if (!e.target.matches('[data-reflect]')) return;
        e.preventDefault();
        const ta = el.querySelector('#story-reflect');
        const text = ta.value.trim();
        if (!text) { ta.focus(); return; }
        T.progress.addJournal({ prompt: story.reflect, text });
        ta.value = '';
        T.ui.toast('Saved to your journal.', { icon: 'edit' });
      }, { signal });

      document.addEventListener('keydown', (e) => {
        if (U.isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
        if (e.key === 'ArrowRight' && at < total - 1) { e.preventDefault(); show(at + 1, true); }
        if (e.key === 'ArrowLeft' && at > 0) { e.preventDefault(); show(at - 1, true); }
        if (/^[1-9]$/.test(e.key) && at === total - 1) {
          const b = el.querySelector(`[data-answer="${Number(e.key) - 1}"]`);
          if (b && !b.disabled) b.click();
        }
      }, { signal });

      show(at, false);
    },
  };
})();
