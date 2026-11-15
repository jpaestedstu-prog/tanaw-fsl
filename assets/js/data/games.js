/* =========================================================================
   Tanaw — games (Laro): metadata and round content

   Games teach awareness, etiquette, respectful language, rights, history and
   sign structure. None of them shows or quizzes FSL vocabulary signs; the
   experimental Read the Hand game uses the 3D manual alphabet (data/hands.js)
   and is kept out of the daily challenge. Sign-recognition games stay locked
   until verified demonstrations exist (see D.lockedGames). Statements reuse
   the sourced lesson and culture content (lessons.js, culture.js).
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.games = [
    { id: 'sightlines', title: 'Sightlines', fil: 'Paano kumuha ng pansin?', icon: 'eye', tone: 'indigo', minutes: 4,
      blurb: 'Eight everyday moments. Choose the respectful way to get attention and keep a conversation visual, and watch the scene respond.',
      skill: 'Deaf etiquette', related: { href: '#/learn/etiquette', label: 'Lesson: Etiquette' } },
    { id: 'myth-fact', title: 'Myth or Fact?', fil: 'Mito o totoo?', icon: 'help', tone: 'coral', minutes: 3,
      blurb: 'Swipe through common beliefs about sign language and Deaf people, and sort myth from fact.',
      skill: 'Awareness', related: { href: '#/community/identity', label: 'Exhibit: Identity & culture' } },
    { id: 'word-lens', title: 'Word Lens', fil: 'Salitang may paggalang', icon: 'search', tone: 'teal', minutes: 3,
      blurb: 'Spot the outdated or hurtful word in each sentence, then choose a respectful one.',
      skill: 'Respectful language', related: { href: '#/community/identity', label: 'Exhibit: Words matter' } },
    { id: 'rights-match', title: 'Rights Match', fil: 'Alamin ang karapatan', icon: 'scale', tone: 'gold', minutes: 4,
      blurb: 'Match everyday situations to the part of the FSL Act (RA 11106) that covers them.',
      skill: 'Rights', related: { href: '#/community/rights', label: 'Exhibit: Rights' } },
    { id: 'timeline', title: 'Timeline', fil: 'Ayusin ang kasaysayan', icon: 'compass', tone: 'teal', minutes: 3,
      blurb: 'Put moments from the history of FSL and Deaf education in order, from 1907 onward.',
      skill: 'History', related: { href: '#/community/history', label: 'Exhibit: History' } },
    { id: 'read-hand', title: 'Read the Hand', fil: 'Basahin ang kamay', icon: 'cube', tone: 'teal', minutes: 3, experimental: true,
      blurb: 'An experimental 3D hand fingerspells letters and short words. Read each one and choose what it shows.',
      skill: 'Reading fingerspelling', related: { href: '#/lab', label: '3D Hand Lab' } },
    { id: 'five-parts', title: 'Five Parts', fil: 'Limang bahagi ng senyas', icon: 'layers', tone: 'indigo', minutes: 2,
      blurb: 'Quick-fire: which of the five parameters of a sign is each clue about?',
      skill: 'How signs are built', related: { href: '#/learn/sign-parameters', label: 'Lesson: How signs are built' } },
  ].filter((g) => !g.experimental || T.config.hand3d);

  /* Games that need verified FSL demonstrations. They unlock on their own when media exists. */
  D.lockedGames = [
    { id: 'recognize', title: 'Sign Recognition', icon: 'film', href: '#/practice/quiz',
      needs: 'A category with at least 4 verified demonstrations.',
      ready: () => T.data.allCategories().some((c) => T.data.signsIn(c.id).filter((s) => T.media.hasMedia(s.id)).length >= 4) },
    { id: 'fs-reading', title: 'Fingerspelling Reading', icon: 'type', href: '#/practice/fingerspell',
      needs: 'Verified demonstrations of every letter in at least 3 practice words.',
      ready: () => D.fsDrillWords().length >= 3 },
  ];

  /* Fingerspelling reading drill: Philippine places and everyday Filipino words without Ñ or NG. */
  D.fsWords = ['CEBU', 'DAVAO', 'ILOILO', 'BOHOL', 'TAAL', 'MAYON', 'LUZON', 'MANILA', 'BAGUIO', 'PALAWAN', 'SAMAR', 'LEYTE',
    'BICOL', 'TARLAC', 'PASAY', 'QUEZON', 'MARIA', 'JOSE', 'ANA', 'LUIS', 'PEDRO', 'ROSA', 'TUBIG', 'BAHAY', 'ARAW', 'GABI',
    'PUSO', 'MESA', 'KAIN', 'ULAN', 'DAGAT', 'ISDA', 'BIGAS', 'ATIS', 'SABA', 'IBON', 'PUTO', 'TABO'];

  /** Words whose every letter has a demonstration (verified, on this device or test media). */
  D.fsDrillWords = () => {
    const has = {};
    T.data.signsIn('alphabet').forEach((s) => { has[s.letter] = T.media.hasMedia(s.id); });
    return D.fsWords.filter((w) => w.split('').every((ch) => has[ch]));
  };

  D.getGame = (id) => D.games.find((g) => g.id === id) || null;

  /* ---------- Sightlines: getting attention and keeping a conversation visual ---------- */
  D.sightlines = [
    { id: 'back', layout: 'back', effect: 'tap',
      prompt: 'Your Deaf classmate is reading with their back to you. How do you get their attention?',
      options: [
        { text: 'Gently tap their shoulder', ok: true },
        { text: 'Shout their name louder', why: 'Volume does not help, and shouting can startle people around you.' },
        { text: 'Throw a crumpled paper at them', why: 'Throwing things is startling and disrespectful.' },
        { text: 'Shine your phone light in their eyes', why: 'A light in someone’s eyes hurts. There is a gentler way.' },
      ],
      explain: 'A gentle tap on the shoulder is a common, polite way to get a Deaf person’s attention when they cannot see you.' },
    { id: 'room', layout: 'room', effect: 'lights',
      prompt: 'You are leading a barangay meeting and need everyone, Deaf and hearing, to look up.',
      options: [
        { text: 'Flick the lights once', ok: true },
        { text: 'Clap loudly until people notice', why: 'Sound reaches only part of the room.' },
        { text: 'Shout “Excuse me!”', why: 'Shouting reaches hearing people only.' },
        { text: 'Tap people one by one from behind', why: 'It is slow, and people who cannot see you coming may be startled.' },
      ],
      explain: 'In a room, flicking the lights once is a common visual way to call everyone’s attention.' },
    { id: 'across', layout: 'across', effect: 'wave',
      prompt: 'A Deaf friend is across the room, facing your way. You want to say hello.',
      options: [
        { text: 'Wave within their line of sight', ok: true },
        { text: 'Walk over and grab their arm', why: 'Grabbing is startling. They can already see you.' },
        { text: 'Shout their name across the room', why: 'Volume does not help, and it draws everyone else’s attention.' },
        { text: 'Toss something to catch their eye', why: 'Throwing things can startle or hurt someone.' },
      ],
      explain: 'A wave where the person can see it is the simplest way to get attention across a room.' },
    { id: 'table', layout: 'table', effect: 'table',
      prompt: 'You are eating with Deaf friends. One is looking away, and you want to say something.',
      options: [
        { text: 'Tap the table gently so they feel it', ok: true },
        { text: 'Wave right in their face', why: 'Waving right in someone’s face is rude. Stay where they can see you, or tap the table.' },
        { text: 'Shout across the table', why: 'Shouting does not help, and it can embarrass everyone.' },
        { text: 'Snap your fingers by their ear', why: 'That relies on sound, and it is rude up close.' },
      ],
      explain: 'At a table, a gentle tap on the table is felt as a vibration. It is a polite way to ask for attention.' },
    { id: 'hallway', layout: 'hallway', effect: 'pass',
      prompt: 'Two people are signing to each other in a narrow hallway, and you need to get past.',
      options: [
        { text: 'Pass between them quickly without stopping', ok: true },
        { text: 'Wait between them until they finish', why: 'Standing between signers blocks their conversation.' },
        { text: 'Squeeze through slowly and carefully', why: 'Going slowly blocks their view for longer.' },
        { text: 'Ask them to stop signing so you can pass', why: 'There is no need. Just pass quickly.' },
      ],
      explain: 'If you must pass between two people signing, go through quickly. Don’t linger between them.' },
    { id: 'clinic', layout: 'clinic', effect: 'face',
      prompt: 'You are a nurse. A Deaf patient arrives with an FSL interpreter. Whom do you face and talk to?',
      options: [
        { text: 'The patient, directly', ok: true },
        { text: 'The interpreter: “What does she want?”', why: 'The conversation is with the patient. The interpreter conveys it.' },
        { text: 'Whoever came with the patient', why: 'The patient can speak for themself, through the interpreter.' },
        { text: 'Anyone, but speak extra fast to save time', why: 'A natural pace, with a moment for interpreting, works best.' },
      ],
      explain: 'With an interpreter present, talk directly to the Deaf person. Say “How are you?”, not “Ask her how she is.”' },
    { id: 'group', layout: 'group', effect: 'write',
      prompt: 'Your group just laughed at a joke. A Deaf co-worker missed it and asks what happened.',
      options: [
        { text: 'Rephrase it, or write it down for them', ok: true },
        { text: 'Say “never mind, it’s not important”', why: '“Never mind” leaves a Deaf person out of the conversation.' },
        { text: 'Repeat the same words, louder', why: 'Volume does not help. Rephrase, write or type instead.' },
        { text: 'Laugh along and change the topic', why: 'That still leaves them out. Take the moment to share it.' },
      ],
      explain: 'Never say “never mind” to a Deaf person. Rephrase, write or type instead.' },
    { id: 'call', layout: 'call', effect: 'light',
      prompt: 'You are about to video-call a Deaf friend to practice FSL. How do you set up?',
      options: [
        { text: 'Face a light, with your face and upper body in frame', ok: true },
        { text: 'Sit with a bright window behind you', why: 'A bright window behind you turns you into a silhouette.' },
        { text: 'Hold the phone close, so only your face shows', why: 'Your friend needs to see your face and your signing space, from head to waist.' },
        { text: 'Turn your camera off and only type', why: 'Typing is fine at times, but to practice FSL your friend needs to see you.' },
      ],
      explain: 'Light in front of you makes your face and hands easy to see. Frame yourself from above the head to the waist.' },
  ];

  /* ---------- Word Lens: [bracketed] text is the term to change. term = index in D.terms ---------- */
  D.wordLens = [
    { text: 'My neighbor’s son is [deaf-mute].', options: ['Deaf', 'hearing impaired', 'pipi'], term: 0 },
    { text: 'Please stop calling him [deaf and dumb].', options: ['Deaf', 'mute', 'slow'], term: 1 },
    { text: 'Our new classmate is [pipi].', options: ['Deaf', 'deaf-mute', 'dumb'], term: 2 },
    { text: 'The front row is reserved for [hearing impaired] guests.', options: ['Deaf and hard of hearing', 'deaf-mute', 'pipi'], term: 3 },
    { text: 'My tita is learning [sign language] at the barangay hall.', options: ['Filipino Sign Language (FSL)', 'hand language', 'mute language'], term: 4 },
    { text: 'Lolo [suffers from deafness], so we text him.', options: ['is deaf', 'is deaf and dumb', 'is a mute'], term: 5 },
  ];

  /* ---------- Rights Match: which section of RA 11106 covers each situation ---------- */
  D.rightsMatch = [
    { text: 'A Deaf patient at a state hospital asks for an interpreter.', sec: '8' },
    { text: 'A Deaf person is asked to give a statement at a police station.', sec: '6' },
    { text: 'A TV station airs its evening news program.', sec: '10' },
    { text: 'A Deaf learner takes FSL as a separate subject at school.', sec: '4' },
    { text: 'A Deaf employee joins a government agency.', sec: '7' },
    { text: 'A government agency holds a public forum, and Deaf residents attend.', sec: '9' },
    { text: 'A new FSL interpreter wants to be accredited under national standards.', sec: '5' },
    { text: 'A Deaf person prefers writing to signing — and the law respects that choice.', sec: '3' },
  ];

  /* ---------- Five Parts: clues about each sign parameter (from "How signs are built") ---------- */
  D.fiveParts = {
    bins: ['Handshape', 'Palm orientation', 'Location', 'Movement', 'Non-manual signals'],
    clues: [
      { text: 'Which fingers are extended, bent, spread or closed', bin: 0 },
      { text: 'The exact position of the thumb', bin: 0 },
      { text: 'Whether the palm faces you, away from you, up or down', bin: 1 },
      { text: 'Where the palm points at the start and at the end', bin: 1 },
      { text: 'On or near the head, face, chest or arm', bin: 2 },
      { text: 'Where the sign starts and ends, relative to the body', bin: 2 },
      { text: 'Straight, arcing, circling, twisting or holding still', bin: 3 },
      { text: 'The number of repetitions, and the speed', bin: 3 },
      { text: 'The eyebrows, the mouth and the eye gaze', bin: 4 },
      { text: 'Head and body movements that carry meaning', bin: 4 },
    ],
  };
})();
