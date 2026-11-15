/* =========================================================================
   Tanaw — About: content policy, review status, the 3D prototype, roadmap (#/about)
   ========================================================================= */
(function () {
  'use strict';

  const T = window.Tanaw;
  const U = T.util;
  const { html } = U;
  const C = T.components;
  const V = (T.views = T.views || {});

  const DEMOS = T.config.demonstrations;
  const HAND = T.config.hand3d;
  const STORIES = T.config.stories;

  const WORKING = [
    ['eye', 'Two connected worlds', `A split-screen landing where looking toward a world opens it, with the everyday scenes where the two worlds meet along the seam${HAND ? ', followed by a second landing where an experimental 3D hand fingerspells a greeting, or your name' : ''}; Awareness & Learning and Deaf Community, each with its own hub, stations and look; transitions that follow you between them.`],
    ...(HAND ? [['cube', '3D Hand Lab (experimental)', 'A jointed 3D hand drawn with WebGL by Tanaw’s own code: 25 letters of the manual alphabet, 15 handshapes, 5 palm orientations and 6 movement types. Fingerspell any word, turn the hand, see it from the signer’s side, mirror it for left-handers, and switch between skin tones, styles and an x-ray view.']] : []),
    ['path', 'Learning path', `${T.data.lessonOrder().length} lessons on ${T.data.units.length} “islands” with multiple choice, true/false, matching and sorting checks, instant feedback, missed questions asked again${HAND ? ', and 3D steps for the alphabet, orientation and movement' : ''}.`],
    ['dice', `${T.data.games.length} games and a daily challenge`, `${T.data.games.map((g) => g.title).join(', ')}, with stars, personal bests and a date-based daily challenge.`],
    ['pin', 'Everyday scenes', `${T.data.scenes.length} situations that combine ${DEMOS ? 'vocabulary (with honest media status)' : 'words to learn with a Deaf teacher'}, written phrases, etiquette and rights.`],
    ['weave', 'Deaf Community exhibits', `Identity & culture, ${STORIES ? 'six stories from documented Deaf Filipino history, ' : ''}a history voyage, a rights map of daily life, a calendar with .ics files, and Deaf-led organizations.`],
    DEMOS
      ? ['library', 'Sign Library', 'Search in English and Filipino, category and status filters, provenance records, playback speed, loop and flip controls.']
      : ['library', 'Vocabulary', `${T.data.allSigns().length} words and phrases in English and Filipino, with search, topic filters, culture notes and an “I can sign this” mark for each word you have learned.`],
    ['practice', 'Practice tools', DEMOS
      ? 'Practice Mirror with on-device recording, spaced review, quizzes and fingerspelling tools.'
      : `Practice Mirror with on-device recording${HAND ? ' and a 3D letter reference' : ''}, spaced review of concepts and of your words, a concept quiz, and fingerspelling${HAND ? ' with the 3D hand and a reading drill' : ' pacer'}.`],
    ['search', 'Search everywhere', 'Ctrl K (⌘ K on a Mac) or the Search button opens one search across pages, lessons, games, scenes, words, history, rights and stories, with quick actions such as “fingerspell this in 3D”.'],
    ['bridge', 'Conversation Bridge', 'Full-screen text with 180° rotation, live captions (Web Speech API), text-to-speech, quick phrases and an Emergency Card.'],
    ['sparkles', 'Your journey', `XP, daily goals, streaks, ${T.progress.BADGES.length} achievements drawn as a constellation, an activity heatmap, a journal, and export/import.`],
    DEMOS
      ? ['studio', 'Contributor Studio', 'On-device media with verification records, custom vocabulary, offline class packs and a manifest generator for permanent publishing.']
      : ['studio', 'Class vocabulary', 'Teachers add the words their class needs and share them as a small offline file. Words only — no media.'],
    ['people', 'Accounts and an administrator console (demonstrations)', 'Log in, register and log out, with each account’s progress kept apart, and a separate administrator page (admin.html) for people, a content review ledger, activity and site controls. Both run only in this browser and are not secure: see the limits below.'],
  ];

  const STATUS = [
    ...(HAND ? [['3D hand (alphabet and handshapes)', 'Experimental, not validated', 'Modeled by the student team from published descriptions of the manual alphabet and checked by the team from several angles. Not validated by Deaf FSL experts. Labeled experimental wherever it appears.']] : []),
    ['FSL vocabulary signs', DEMOS ? 'None verified yet' : 'Not shown', DEMOS
      ? 'Every vocabulary entry shows a labeled placeholder until a Deaf signer’s demonstration is verified.'
      : 'Whole signs need a location on the body, movement and facial expression, which a hands-only model cannot show accurately. Tanaw lists the words; learners learn the signs from Deaf teachers.'],
    STORIES
      ? ['Stories', 'Sourced, not reviewed', 'Six stories retell documented events from Deaf Filipino history, with a source for every chapter. They are not personal testimonies and do not speak for anyone.']
      : ['Community stories', 'Switched off', 'The Stories exhibit is switched off.'],
    ['Culture, history and rights text', 'Sourced, not reviewed', 'Written by the student team from published sources (Connect → Sources); law and history statements were rechecked against those sources in October 2026. Not reviewed by Deaf organizations.'],
    ['Lessons and game statements', 'Sourced, not reviewed', 'They reuse the same sourced statements. Not reviewed by Deaf FSL educators.'],
    ['Accounts and administrator console', 'Frontend demonstration', 'Everything runs in this browser with no server behind it, so nothing here is secure sign-in. It shows the experience a real system would give; connecting a real backend is planned work.'],
    ['Visual design and names', 'Team choices', 'The metaphors (the horizon, capiz light, banig weave, the eye) and the Filipino labels were chosen by the team. See below.'],
    ['Accessibility and usability', 'Team-tested', 'Checked with automated tools (axe-core and Lighthouse), scripted keyboard, screen-size, theme and offline tests, and WebGL tests of the 3D hand, including its no-WebGL fallback. Not tested with Deaf users or screen-reader users.'],
  ];

  /* The 3D hand: what it shows, how it was made, and the research behind its limits. */
  const HAND_FACTS = [
    ['cube', 'What it shows', 'The one-handed manual alphabet that FSL shares with American Sign Language, except T: FSL forms T differently, so the prototype leaves it out instead of guessing. Also 15 handshapes signs are built from, 5 palm orientations and 6 movement types.', 'verafiles-2015'],
    ['code', 'How it was made', 'A hand with a palm, five jointed fingers and a forearm, drawn with WebGL by Tanaw’s own code — no 3D libraries or downloaded models. Each pose sets 21 joint angles; thumb positions were fitted by a small optimizer that keeps the thumb clear of the fingers and palm.', ''],
    ['search', 'What research says', 'The only published evaluation of 3D FSL animation the team found (Cueto and colleagues, De La Salle University, 2020) asked five Deaf FSL signers to rate an animated fable. They rated accuracy and naturalness 3.4 out of 6 and understanding 3.0 out of 6: handshapes were sometimes wrong and the avatar had no facial expressions. Yet they gave 5.2 out of 6 to “I would use this video as learning reference”.', 'cueto2020'],
    ['people', 'Why hands only', 'The World Federation of the Deaf and the World Association of Sign Language Interpreters caution against avatars replacing human signers. So the prototype sticks to building blocks — letters and handshapes — and never stands in for a Deaf teacher or for whole FSL signs, which need a face and a body.', 'wfd-avatars'],
  ];

  const VALIDATION = [
    ...(HAND ? ['The 3D hand: every letter, handshape and movement checked by qualified Deaf FSL users, and FSL’s own T, Ñ and NG added with their guidance.'] : []),
    'Any whole-sign demonstrations — 3D or video — validated sign by sign by qualified Deaf FSL users, with the region or variant shown.',
    `Deaf-led review of every culture, history, rights and identity statement${STORIES ? ', and of the six stories' : ''}, with authority to change or remove anything.`,
    'Personal stories, images and videos, each with informed consent explained in FSL, Deaf-led review and the right to withdraw.',
    'Usability and accessibility testing with Deaf people, hard of hearing people, FSL learners, screen-reader users and people on low-end phones.',
    'A privacy assessment before adding real accounts, cloud sync, analytics or any upload of video.',
  ];

  const DESIGN_CHOICES = [
    ['A horizon, split in two', `The start page opens on two worlds meeting at a seam. “Tanaw” means to look toward, so looking toward a world opens it, and the everyday scenes where the worlds meet sit along the seam.${HAND ? ' Below it is a second landing, under a night sky, with the experimental 3D hand.' : ''} A dark “Gabi” theme is the default; a light “Araw” theme and a high-contrast theme are one tap away in Settings.`],
    ['The eye', 'Tanaw’s mark is an eye that looks toward the world you explore, because Deaf culture is visual and eye contact matters in signed conversation. On the account pages it looks away while you type a password.'],
    ['Capiz light and banig weave', 'Learning is drawn as light through a capiz window; community as a woven banig mat seen from above, with people in a circle keeping clear sightlines. Both are Filipino crafts, chosen to avoid sound-based metaphors.'],
    ['Filipino labels', '“Matuto” (to learn) and “Pamayanan” (community) are the team’s choices. The Deaf community may prefer other names.'],
    ['Hands only where labeled', `Illustrations draw people as head-and-shoulder shapes, so no drawing can be mistaken for an FSL sign.${HAND ? ' Hands appear only in the 3D prototype, which is always labeled experimental.' : ''}`],
    ['No deafness simulations', 'Tanaw does not try to make hearing visitors “experience deafness”. The team judged that simulations center loss rather than Deaf language and culture.'],
  ];

  const PLANNED = [
    ...(HAND ? [['FSL’s own letters in 3D', 'Model FSL’s T, and the Filipino letters Ñ and NG, from Deaf FSL teachers’ guidance, and check every letter and handshape with them.']] : []),
    ['Whole signs in 3D', 'The step after the hands-only prototype: arms, body and facial expression, animated from Deaf signers’ references and published only after qualified Deaf FSL users validate each sign.'],
    ['Personal stories in FSL', `Stories told by Deaf storytellers in FSL, with informed consent explained in FSL, Deaf-led review and the right to withdraw.${STORIES ? ' Today’s Stories retell documented history only.' : ''}`],
    ['On-device sign feedback', 'Hand and face landmark tracking in the browser to give gentle feedback on practice — trained and evaluated only on consented FSL data, governed with the Deaf community, and never used to judge Deaf signers.'],
    ['FSL-first lessons', 'Lesson instructions in FSL, by Deaf teachers, so Deaf learners can use Tanaw in their first language.'],
    ['Real accounts, sync and shared verification', 'Accounts on a server, cloud sync, and a review ledger shared with Deaf verifiers. This build demonstrates the interfaces in one browser; making them real requires a backend, so it is outside this front-end build.'],
    ['Regional variant map', 'A map of documented regional variants, built with Deaf-led organizations.'],
    ['More languages', 'A Filipino-language interface, and glosses in Cebuano, Ilocano, Hiligaynon and other Philippine languages.'],
  ];

  const LIMITS = [
    ...(HAND ? [
      'The 3D hand is an experimental prototype. It shows the manual alphabet without FSL’s T, Ñ and NG, and handshapes — not whole FSL signs — and has not been validated by Deaf FSL experts.',
      'The 3D hand needs WebGL. Without it, Tanaw shows the letters as text and everything else works normally.',
    ] : []),
    DEMOS ? 'No verified FSL demonstrations ship with this version.' : 'Tanaw does not show whole FSL signs: learn them from Deaf teachers.',
    ...(STORIES ? ['Stories retell documented history from published sources. They are not personal testimonies.'] : []),
    'Progress lives in this browser only (localStorage). It does not sync between devices; clearing site data or some private windows erase it. Use Export / Import.',
    'Accounts and the administrator console are frontend demonstrations, not secure sign-in. There is no server: anyone using this browser could read or change the stored data or give themselves any role, and a separate administrator page protects nothing by itself. Do not reuse a real password.',
    ...(DEMOS ? ['Contributor media is stored in this browser (IndexedDB). Some browsers limit storage for pages opened as files — a local server fixes this.'] : []),
    'Live captions depend on the browser’s Web Speech API (Chrome, Edge, Safari). In Chrome and Edge, audio is processed by the browser maker’s online service.',
    'Tanaw does not recognize or translate signing, and does not replace qualified FSL interpreters or Deaf teachers.',
    'Text-to-speech uses voices installed on the device; Filipino voices are not available everywhere.',
    'Page transitions use the View Transitions API where the browser supports it; elsewhere pages change instantly.',
  ];

  const SHORTCUTS = [
    ['Ctrl K', 'Search Tanaw and run quick actions (⌘ K on a Mac)'],
    ['/', `Jump to the ${DEMOS ? 'Sign Library' : 'Vocabulary'} search`],
    ...(HAND ? [['← → ↑ ↓', '3D hand: turn it (focus the hand first) · Home resets the view'], ['A – Z', '3D Hand Lab, Alphabet tab: show that letter']] : []),
    ['1 – 9', 'Choose an answer in lessons, quizzes and games'],
    ['← →', `Myth or Fact: choose Myth or Fact · History: sail between stops${STORIES ? ' · Stories: turn the page' : ''}`],
    ['Enter', 'Check / continue in lessons and quizzes'],
    ['Space', 'Reveal the answer in spaced review'],
    ['1 – 4', 'Rate a flashcard (Again, Hard, Good, Easy)'],
    ['Esc', 'Close dialogs and full-screen text'],
  ];

  V.about = {
    title: 'About Tanaw',
    station: 'about',
    render(el, params, query) {
      el.innerHTML = String(html`
        <div class="container page about">
          ${C.pageHead({
            eyebrow: 'About Tanaw', icon: 'info',
            title: 'Learning FSL with eyes open',
            lead: html`<strong lang="fil">Tanaw</strong> is Filipino for <em>to view</em> or <em>to look toward</em>. Its root also gives <em lang="fil">pananaw</em>: perspective. Tanaw has two worlds — Awareness &amp; Learning, and Deaf Community — joined at one horizon.`,
          })}

          <section class="about-section split">
            <div class="prose">
              <h2>Mission</h2>
              <p>Make learning about Filipino Sign Language accessible, accurate and respectful — and help hearing Filipinos meet the Deaf community halfway.</p>
              <p>Tanaw is a <strong>companion to learning from Deaf people</strong>, not a replacement. ${DEMOS
                ? 'It teaches the culture and structure behind FSL, offers honest practice tools, and gives Deaf contributors a way to bring verified demonstrations and their own stories to learners anywhere — even without internet access.'
                : `It teaches the culture and structure behind FSL, ${HAND ? 'lets you study the manual alphabet and handshapes on an experimental 3D hand, ' : ''}and offers honest practice tools for the signs you learn from Deaf teachers — even without internet access.`}</p>
              <p>Tanaw is a student project for the course <em>I.S. Innovation and New Technologies</em>. Its experimental features are labeled as such: nothing in Tanaw is an officially approved FSL learning resource.</p>
            </div>
            <div class="split__art">${U.raw(T.art.lesson('eye'))}</div>
          </section>

          <section class="about-section card policy" aria-labelledby="h-status">
            <h2 class="section__title section__title--sm" id="h-status">${T.icon('hourglass')}<span>Status of the content</span></h2>
            <div class="table-wrap" tabindex="0" role="region" aria-label="Content status table (scrolls sideways on small screens)">
              <table class="table">
                <caption class="visually-hidden">What has and has not been reviewed or validated</caption>
                <thead><tr><th scope="col">Content</th><th scope="col">Status</th><th scope="col">Details</th></tr></thead>
                <tbody>${STATUS.map(([a, b, c]) => html`<tr><th scope="row">${a}</th><td><span class="pill pill--planned">${b}</span></td><td>${c}</td></tr>`)}</tbody>
              </table>
            </div>
          </section>

          ${HAND ? html`
          <section class="about-section" id="about-3d" aria-labelledby="h-hand">
            <h2 class="section__title" id="h-hand">About the experimental 3D hand <span class="exp-badge">Experimental</span></h2>
            <p class="section__lead">A hands-only prototype for studying the building blocks of signing — letters, handshapes, palm orientation and movement — from every side.</p>
            <div class="planned-grid planned-grid--pairs">
              ${HAND_FACTS.map(([icon, title, text, src]) => {
                const source = src ? T.data.getSource(src) : null;
                return html`
                  <article class="planned-item">
                    <h3 class="planned-item__title">${T.icon(icon)}<span>${title}</span></h3>
                    <p>${text}</p>
                    ${source ? html`<p class="planned-item__source"><a href="${source.url}" target="_blank" rel="noopener noreferrer">${T.icon('book')}<span>Source</span><span class="visually-hidden">: ${source.label} (opens in a new tab)</span></a></p>` : ''}
                  </article>`;
              })}
            </div>
            <p><strong>How to use it:</strong> as a study aid next to a Deaf teacher, not instead of one. Handshapes vary between signers and regions, and the prototype has not been validated by Deaf FSL experts.</p>
            <p><a class="btn btn--primary" href="#/lab">${T.icon('cube')}<span>Open the 3D Hand Lab</span></a></p>
          </section>` : ''}

          <section class="about-section card policy" aria-labelledby="h-policy">
            <h2 class="section__title section__title--sm" id="h-policy">${T.icon('shield')}<span>Content principles</span></h2>
            <ol class="policy__list">
              <li><strong>Deaf people decide.</strong> Decisions about how FSL, Deaf culture, stories and identities are shown belong to Deaf contributors and Deaf-led partners. Their corrections take priority.</li>
              <li><strong>FSL only.</strong> Signs from other sign languages are never presented as FSL. ${HAND ? 'The 3D hand shows only the part of the manual alphabet that FSL and ASL share, and leaves out FSL’s T rather than borrow the American one.' : 'Tanaw never assumes signs are equivalent across sign languages.'}</li>
              <li><strong>No invented or generated signs.</strong> Tanaw does not invent or AI-generate FSL signs.${HAND ? ' The 3D hand follows published descriptions of the manual alphabet and handshapes, and is labeled experimental and not validated.' : ''}${DEMOS ? ' Written descriptions of a sign appear only when its verifier supplies them.' : ''}</li>
              <li><strong>Honest labels.</strong> ${DEMOS
                ? 'Each clip records the signer, the verifier, the region or variant and the signer’s consent. Statuses are always visible: Verified, On this device, Test media, or Awaiting verification.'
                : 'Experimental features say so where they appear. If validated demonstrations are added, each will record who signed or animated it, who validated it, the region or variant, and consent.'}</li>
              <li><strong>Consent first.</strong> Stories, images and videos of people appear only with informed consent, explained in FSL, with the right to change or withdraw them at any time.</li>
              <li><strong>No invented voices.</strong> Tanaw does not write testimonials, endorsements or personal stories on behalf of Deaf people or organizations.${STORIES ? ' Its Stories retell documented events and cite their sources.' : ''}</li>
              <li><strong>Regional variation is respected.</strong> A different sign is a variant to learn about, not an error.</li>
              <li><strong>Sourced facts.</strong> Statements about law and history cite primary or reputable sources, listed in the Connect exhibit.</li>
            </ol>
          </section>

          <section class="about-section" aria-labelledby="h-validate">
            <h2 class="section__title" id="h-validate">Before wider use</h2>
            <p class="section__lead">This academic version was built without formal review by Deaf organizations. Before Tanaw is used beyond the classroom, these need Deaf-led validation.</p>
            <ul class="checklist checklist--planned">${VALIDATION.map((v) => html`<li>${v}</li>`)}</ul>
          </section>

          <section class="about-section" aria-labelledby="h-design">
            <h2 class="section__title" id="h-design">Design choices</h2>
            <div class="planned-grid">
              ${DESIGN_CHOICES.map(([title, text]) => html`
                <article class="planned-item">
                  <h3 class="planned-item__title">${T.icon('eye')}<span>${title}</span></h3>
                  <p>${text}</p>
                </article>`)}
            </div>
          </section>

          <section class="about-section" aria-labelledby="h-working">
            <h2 class="section__title" id="h-working">What works today</h2>
            <div class="works-grid">
              ${WORKING.map(([icon, title, text]) => html`
                <article class="work-item">
                  <span class="work-item__icon">${T.icon(icon)}</span>
                  <div><h3 class="work-item__title">${title}</h3><p>${text}</p></div>
                </article>`)}
            </div>
          </section>

          <section class="about-section" aria-labelledby="h-planned">
            <h2 class="section__title" id="h-planned">Planned enhancements <span class="pill pill--planned">Not implemented</span></h2>
            <p class="section__lead">Ideas for future versions. None of these is active in this build.</p>
            <div class="planned-grid planned-grid--pairs">
              ${PLANNED.map(([title, text]) => html`
                <article class="planned-item">
                  <h3 class="planned-item__title">${T.icon('clock')}<span>${title}</span></h3>
                  <p>${text}</p>
                </article>`)}
            </div>
          </section>

          <section class="about-section card" aria-labelledby="h-limits">
            <h2 class="section__title section__title--sm" id="h-limits">${T.icon('info')}<span>Known limitations</span></h2>
            <ul class="checklist checklist--info">${LIMITS.map((l) => html`<li>${l}</li>`)}</ul>
          </section>

          <div class="about-section split-grid">
            <section class="card" aria-labelledby="h-privacy">
              <h2 class="section__title section__title--sm" id="h-privacy">${T.icon('lock')}<span>Privacy</span></h2>
              <ul class="checklist">
                <li>No cookies, analytics or trackers. Accounts are optional and stay in this browser.</li>
                <li>The camera starts only when you press Start, and video is never uploaded.</li>
                <li>Practice clips stay in memory until you leave the page, unless you download them.</li>
                <li>Progress, journal, phrases and the emergency card stay in this browser.</li>
                <li>External links (organizations, sources) open other websites in a new tab.</li>
              </ul>
            </section>
            <section class="card" aria-labelledby="h-a11y">
              <h2 class="section__title section__title--sm" id="h-a11y">${T.icon('eye')}<span>Accessibility</span></h2>
              <ul class="checklist">
                <li>Designed toward WCAG 2.2 AA: keyboard support, visible focus, labeled controls and live announcements.</li>
                <li>Every game works with a keyboard; swipes and drags are optional shortcuts.</li>
                ${HAND ? html`<li>The 3D hand turns with the arrow keys, and every pose has a written description.</li>` : ''}
                <li>Dark, light and high-contrast themes; adjustable text size and spacing; reduced motion turns off page transitions and parallax${HAND ? ', and the 3D hand steps from pose to pose instead of gliding' : ''}.</li>
                <li>Visual-first: no feature depends on hearing. Audio features (speech) are always optional.</li>
              </ul>
              <button type="button" class="btn btn--secondary btn--sm" data-open-settings-global>${T.icon('sliders')}<span>Open accessibility settings</span></button>
            </section>
          </div>

          <section class="about-section card" aria-labelledby="h-keys">
            <h2 class="section__title section__title--sm" id="h-keys">${T.icon('keyboard')}<span>Keyboard shortcuts</span></h2>
            <dl class="shortcut-list">
              ${SHORTCUTS.map(([k, d]) => html`<div><dt><kbd>${k}</kbd></dt><dd>${d}</dd></div>`)}
            </dl>
          </section>

          <section class="about-section prose credits" aria-labelledby="h-credits">
            <h2 id="h-credits">Technology &amp; credits</h2>
            <p>Built with <strong>HTML5, CSS3, vanilla JavaScript${HAND ? ' and WebGL' : ''}</strong> only — no frameworks, no libraries, no backend, no paid APIs. Illustrations are inline SVG, ${HAND ? 'the 3D hand is rendered by Tanaw’s own WebGL code, ' : ''}effects are CSS, and everything runs in the browser, even offline from a folder.</p>
            <p>Typefaces: <strong>Atkinson Hyperlegible Next</strong> (Braille Institute) and <strong>Space Grotesk</strong> (The Space Grotesk Project Authors), both under the SIL Open Font License, bundled locally. Icons and illustrations are original to Tanaw and contain no handshapes.</p>
            <p>Tanaw is a student technology-innovation project. It is <strong>not affiliated</strong> with the organizations, schools or agencies it references, it has not been endorsed by them, and it is not a substitute for qualified FSL interpreters or Deaf teachers.</p>
            <p><a class="link-arrow" href="#/community/connect?s=sources">See all sources ${T.icon('arrow-right')}</a></p>
          </section>
        </div>`);

      // #/about?s=3d opens at the section about the 3D hand.
      const target = query.s === '3d' ? el.querySelector('#about-3d') : null;
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    },
  };
})();
