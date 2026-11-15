/* =========================================================================
   Tanaw — learning path (units, lessons and lesson steps)

   Step types (rendered by assets/js/components/steps.js):
     content    title + trusted HTML body (+ optional art, callout, cta, source)
     tabs       tabbed explainer
     mcq        multiple choice (answer = index into options)
     truefalse  statement + boolean answer
     match      pair terms with descriptions
     sort       place items into bins
     signs      gallery of vocabulary entries (word cards; verified media
                only when demonstrations are switched on in core/config.js)
     signcheck  becomes a recognition quiz when >= 4 entries have media,
                otherwise a self-check list (no unverified content is shown)

   Copy that depends on whether sign demonstrations are shown uses DEMOS.
     reflect    private learning-journal prompt

   Factual statements about law and history are drawn from primary or
   reputable sources listed in assets/js/data/culture.js (D.sources).
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});
  const DEMOS = !!(T.config && T.config.demonstrations);
  const gallery = (what) => (DEMOS
    ? `Open any ${what} to see its demonstration or placeholder.`
    : `Select any ${what} to open its card. When your teacher has shown you the sign and you can sign it confidently, mark it “I can sign this”.`);

  D.units = [
    {
      id: 'u1', num: 1, title: 'Foundations', fil: 'Simula', tone: 'indigo', icon: 'compass',
      description: 'What FSL is, the community it belongs to, and how signs are built. Start here.',
      lessons: ['what-is-fsl', 'deaf-culture', 'etiquette', 'sign-parameters', 'faces-and-space', 'practice-setup'],
    },
    {
      id: 'u2', num: 2, title: 'Fingerspelling & Numbers', fil: 'Baybay at Bilang', tone: 'teal', icon: 'type',
      description: DEMOS
        ? 'The manual alphabet and number signs. Demonstrations unlock as they are verified.'
        : 'What fingerspelling is for, and the letters and numbers to learn with your teacher.',
      lessons: ['fingerspelling', 'numbers'],
    },
    {
      id: 'u3', num: 3, title: 'Everyday Signs', fil: 'Araw-araw', tone: 'gold', icon: 'home',
      description: 'Vocabulary for daily life in the Philippines, with culture notes for each theme.',
      lessons: ['greetings', 'family', 'daily-life', 'time', 'feelings-questions', 'safety-health'],
    },
    {
      id: 'u4', num: 4, title: 'Being an Ally', fil: 'Kakampi', tone: 'coral', icon: 'heart',
      description: 'Rights under the FSL Act, working with interpreters, and everyday allyship.',
      lessons: ['fsl-act', 'interpreters', 'allyship'],
    },
  ];

  const L = {};

  /* =====================================================================
     UNIT 1 — FOUNDATIONS
     ===================================================================== */
  L['what-is-fsl'] = {
    title: 'What is Filipino Sign Language?', minutes: 6, kind: 'concept',
    summary: 'Meet the national sign language of the Filipino Deaf — and why it is a language of its own.',
    steps: [
      {
        type: 'content', title: 'Meet FSL', art: 'emblem',
        body: `<p><strong>Filipino Sign Language (FSL)</strong> is the visual language of the Filipino Deaf community. It is produced with the hands, face, head and body — and understood through the eyes.</p>
<p>FSL is a complete, natural language with its own vocabulary and its own grammar. It is <em>not</em> Filipino or English spelled out on the hands, and it is not mime.</p>`,
        callout: { tone: 'tip', title: 'A language, not a set of gestures', body: '<p>Deaf Filipinos use FSL to talk about anything — school, work, jokes, faith, feelings and the news.</p>' },
      },
      {
        type: 'content', title: 'Recognized by law', art: 'law',
        body: `<p>On <strong>October 30, 2018</strong>, <strong>Republic Act No. 11106 — the Filipino Sign Language Act</strong> — was approved. It declares FSL the national sign language of the Filipino Deaf and the official sign language of government in all transactions involving the Deaf.</p>
<p>The law reaches many parts of daily life:</p>
<ul>
<li><strong>Schools</strong> — FSL as the medium of instruction in Deaf education, and taught as its own subject for Deaf learners.</li>
<li><strong>Justice</strong> — qualified sign language interpreters in proceedings involving Deaf people, including police stations and barangay conciliation.</li>
<li><strong>Health</strong> — state hospitals and health facilities provide FSL interpreters free of charge when Deaf patients request them.</li>
<li><strong>Media</strong> — FSL interpreter insets in TV news and public affairs programs.</li>
<li><strong>Workplaces and public services</strong> — FSL in government workplaces and public transactions involving the Deaf.</li>
</ul>`,
        source: 'Republic Act No. 11106, Sections 3–10.',
      },
      {
        type: 'mcq', prompt: 'According to RA 11106, what is FSL?',
        options: [
          'The national sign language of the Filipino Deaf',
          'A regional version of American Sign Language',
          'A code for spelling Filipino words with the hands',
          'An optional set of gestures used only in schools',
        ],
        answer: 0,
        explain: 'RA 11106 declares FSL the national sign language of the Filipino Deaf and the official sign language of government in all transactions involving the Deaf.',
      },
      {
        type: 'content', title: 'Not universal, not identical', art: 'globe',
        body: `<p>There is no single universal sign language. Deaf communities around the world have their own sign languages — Japanese Sign Language, British Sign Language and American Sign Language (ASL) are all different languages.</p>
<p>FSL has a history of contact with ASL, which arrived with American-run Deaf education in the early 1900s. Linguists describe today's FSL vocabulary as a mix of <strong>traditional and regional Filipino signs</strong>, <strong>signs borrowed from ASL</strong> (often changed over time) and some signs from <strong>manually coded English</strong>. The result is a language of its own.</p>
<p>That is why Tanaw never assumes that a sign from another sign language means the same thing in FSL.</p>`,
      },
      {
        type: 'truefalse',
        statement: 'If you know a sign in American Sign Language, you can assume it means the same thing in FSL.',
        answer: false,
        explain: 'FSL and ASL share some history, but they are different languages. Some signs look alike and many do not — and look-alikes can differ in meaning or use. Learn the FSL sign from a Deaf FSL teacher.',
      },
      {
        type: 'content', title: 'One language, many places', art: 'islands',
        body: `<p>Like spoken languages, FSL has <strong>regional variation</strong>. A sign used in Cebu may differ from the one used in Metro Manila or Davao. Deaf organizations have documented this — for example, the Philippine Federation of the Deaf published a two-part compilation of signs from regions of the Philippines (2005 and 2007).</p>
<p>When you meet Deaf signers who use a different sign from the one you learned, you have not found a "mistake". You have found variation. Ask, observe and adapt.</p>`,
      },
      {
        type: 'content', title: 'Learn from the source', art: 'community',
        body: `<p>FSL belongs to the Filipino Deaf community. The best way to learn it is <strong>from Deaf teachers</strong>, in Deaf-led programs, and by spending time with Deaf signers.</p>
${DEMOS
    ? '<p>Tanaw is a companion for that journey. Every sign demonstration here shows <strong>who signed it and who verified it</strong>. When a verified demonstration is not available yet, you will see a clearly labeled placeholder — never a guess.</p>'
    : '<p>Tanaw is a companion for that journey, not a replacement for it. Its <strong>experimental 3D hand</strong> shows the manual alphabet and the handshapes signs are built from — but whole signs, with their location, movement and facial expression, come from your Deaf teacher. Tanaw helps with everything around them: understanding the language and culture, keeping track of the words you learn, reviewing them and practicing.</p>'}`,
      },
      {
        type: 'reflect', prompt: 'Why do you want to learn FSL? Write one sentence for your future self.',
        placeholder: 'I want to learn FSL because…',
      },
    ],
  };

  L['deaf-culture'] = {
    title: 'Deaf culture and identity', minutes: 6, kind: 'culture',
    summary: 'Understand the community behind the language — and the words that respect it.',
    steps: [
      {
        type: 'content', title: 'deaf, Deaf and hard of hearing', art: 'community',
        body: `<p>Many people use lowercase <strong>deaf</strong> to describe not hearing, and capital-D <strong>Deaf</strong> for people who identify with the Deaf community — its sign language, culture and shared experience.</p>
<p><strong>Hard of hearing</strong> usually describes people with some hearing. Not every deaf or hard of hearing person uses FSL, and people choose how they identify. When in doubt, <strong>ask — and respect the answer</strong>.</p>`,
      },
      {
        type: 'content', title: 'A community and a culture',
        body: `<p>Deaf communities share a language, history, values, humor, art and social life — Deaf schools, churches, sports, clubs and organizations.</p>
<p>In the Philippines, Deaf-led organizations such as the <strong>Philippine Federation of the Deaf (PFD)</strong> work to represent Deaf Filipinos, preserve FSL and promote Deaf identity. Supporting Deaf-led spaces is one of the most useful things a learner can do.</p>`,
      },
      {
        type: 'sort', title: 'Words matter',
        prompt: 'Sort these terms: which are respectful, and which should you avoid?',
        bins: ['Respectful', 'Avoid'],
        items: [
          { text: 'Deaf', bin: 0 },
          { text: 'hard of hearing', bin: 0 },
          { text: 'Deaf community', bin: 0 },
          { text: 'deaf-mute', bin: 1 },
          { text: 'deaf and dumb', bin: 1 },
          { text: 'pipi', bin: 1 },
          { text: 'hearing impaired', bin: 1 },
        ],
        explain: 'Terms like "deaf-mute", "deaf and dumb" and "pipi" suggest Deaf people have no voice or language — but Deaf people communicate fully in FSL. The World Federation of the Deaf also advises against "hearing impaired", which frames people only by what is "impaired". Use "Deaf", "deaf" or "hard of hearing" — or whatever term a person uses for themself.',
      },
      {
        type: 'content', title: 'Sign names',
        body: `<p>Many Deaf communities use <strong>sign names</strong> — a sign that stands for a particular person. In many communities, a sign name is <strong>given by Deaf people</strong> who know you, rather than invented by a learner.</p>
<p>Until you receive one, <strong>fingerspell your name</strong>. Ask your Deaf teacher how sign names work in your local community.</p>`,
      },
      {
        type: 'mcq', prompt: 'You have just started learning FSL and want a sign name. What is the respectful approach?',
        options: [
          'Invent a sign name that looks cool',
          'Copy a sign name you saw in a video',
          'Fingerspell your name for now, and let Deaf community members give you a sign name',
          'Ask a hearing friend to make one up for you',
        ],
        answer: 2,
        explain: 'Sign names are part of Deaf culture. Fingerspelling your name is always fine; a sign name usually comes from Deaf people who know you.',
      },
      {
        type: 'content', title: 'A visual way of life', art: 'eye',
        body: `<p>Deaf culture is visual. People wave or tap to get attention, flick the lights to call a room, keep clear sightlines when they talk, and value eye contact.</p>
<p>Deaf Filipinos are teachers, artists, athletes, engineers, entrepreneurs, parents and leaders. Many Deaf people see being Deaf as an identity and a culture — not as a loss.</p>`,
      },
      {
        type: 'truefalse',
        statement: 'Every deaf or hard of hearing person uses FSL and identifies as culturally Deaf.',
        answer: false,
        explain: 'Experiences differ. Some people use FSL, some use spoken language, and many use both. Respect how each person communicates and identifies.',
      },
    ],
  };

  L['etiquette'] = {
    title: 'Etiquette: communicating with respect', minutes: 7, kind: 'culture',
    summary: 'Practical habits for getting attention, keeping eye contact and working with interpreters.',
    steps: [
      {
        type: 'content', title: 'Getting attention', art: 'attention',
        body: `<ul class="checklist">
<li><strong>Wave</strong> your hand within the person's line of sight.</li>
<li><strong>Tap gently</strong> on the shoulder or upper arm.</li>
<li>In a room, <strong>flick the lights</strong> once, or tap the table so people feel the vibration.</li>
</ul>
<p>Avoid shouting, grabbing, or waving right in someone's face.</p>`,
      },
      {
        type: 'mcq', prompt: 'A Deaf classmate is reading with their back to you. How do you get their attention?',
        options: ['Shout their name louder', 'Gently tap their shoulder', 'Throw a crumpled paper at them', 'Shine your phone light in their eyes'],
        answer: 1,
        explain: 'A gentle tap on the shoulder is a common, polite way to get a Deaf person’s attention when they cannot see you.',
      },
      {
        type: 'content', title: 'Eyes on the conversation',
        body: `<p>In a signed conversation, your eyes do the listening. Keep <strong>eye contact</strong> — looking away can signal that you have stopped paying attention.</p>
<p>Make yourself easy to see: face the light, keep your hands and face visible, and do not stand in front of a bright window that turns you into a silhouette.</p>`,
      },
      {
        type: 'content', title: 'Lipreading is not a superpower',
        body: `<p>Do not assume a Deaf person can lipread. Many speech sounds look identical on the lips, so lipreading alone is unreliable and tiring.</p>
<p>Ask what works best: FSL, writing, typing on a phone, or gestures. If someone does lipread, speak naturally — do not shout, exaggerate, cover your mouth or chew while talking.</p>`,
      },
      {
        type: 'truefalse',
        statement: 'Most Deaf people can understand speech perfectly by lipreading.',
        answer: false,
        explain: 'Lipreading captures only part of speech, and many sounds look the same on the lips. Ask the person how they prefer to communicate.',
      },
      {
        type: 'content', title: 'Working with interpreters',
        body: `<p>When an FSL interpreter is present, <strong>talk directly to the Deaf person</strong>, not to the interpreter. Say "How are you?" — not "Ask her how she is."</p>
<p>Look at the Deaf person, speak at a natural pace and allow a moment for interpreting. Professional interpreters follow ethics such as <strong>confidentiality</strong> and <strong>impartiality</strong>.</p>`,
      },
      {
        type: 'mcq', prompt: 'At a clinic, a Deaf patient is with an FSL interpreter. Whom should the doctor face and address?',
        options: ['The interpreter', 'The Deaf patient', 'Whoever is standing closer', 'The patient’s companion'],
        answer: 1,
        explain: 'The conversation is with the Deaf patient. The interpreter conveys it — they are not the person you are talking to.',
      },
      {
        type: 'sort', title: 'Do or don’t?',
        prompt: 'Decide whether each habit is a do or a don’t.',
        bins: ['Do', 'Don’t'],
        items: [
          { text: 'Tap a shoulder gently to get attention', bin: 0 },
          { text: 'Keep eye contact while someone signs to you', bin: 0 },
          { text: 'Ask how the person prefers to communicate', bin: 0 },
          { text: 'Speak to the interpreter instead of the Deaf person', bin: 1 },
          { text: 'Cover your mouth when you speak', bin: 1 },
          { text: 'Imitate or exaggerate signs as a joke', bin: 1 },
        ],
        explain: 'Respect shows up in small habits: clear sightlines, direct communication, and treating FSL as the language it is.',
      },
    ],
  };

  L['sign-parameters'] = {
    title: 'How signs are built', minutes: 7, kind: 'concept',
    summary: 'Discover the five building blocks that make up every sign.',
    steps: [
      {
        type: 'content', title: 'Signs have parts', art: 'parameters',
        body: `<p>Spoken words are built from sounds. Signs are built from smaller parts too. Sign language researchers describe <strong>five parameters</strong>: handshape, palm orientation, location, movement and non-manual signals.</p>
<p>Change one parameter and you may change the meaning — or produce a sign nobody recognizes.</p>`,
      },
      {
        type: 'tabs', title: 'Explore the five parameters',
        intro: 'Select each parameter to learn what it is and what to watch for when you copy a sign.',
        tabs: [
          { label: 'Handshape', body: '<p>The shape of your hand: which fingers are extended, bent, spread or closed.</p><p><strong>Watch for:</strong> exact finger positions, including the thumb.</p>' },
          { label: 'Palm orientation', body: '<p>The direction your palm faces: toward you, away from you, up, down or to the side.</p><p><strong>Watch for:</strong> where the palm points at the start and at the end of the sign.</p>' },
          { label: 'Location', body: '<p>Where the sign happens: on or near the head, face, chest or arm, or in the space in front of the body.</p><p><strong>Watch for:</strong> where the sign starts and ends relative to the body.</p>' },
          { label: 'Movement', body: '<p>How the hands move: straight, arcing, circling, repeating, twisting or holding still. Size, speed and repetition can change meaning.</p><p><strong>Watch for:</strong> direction, number of repetitions and speed.</p>' },
          { label: 'Non-manual signals', body: '<p>Facial expressions, mouth shapes, eye gaze, and head and body movement. In FSL these carry meaning and grammar — not just emotion.</p><p><strong>Watch for:</strong> the eyebrows, mouth and head movements that go with a sign.</p>' },
        ],
      },
      {
        type: 'hand3d', mode: 'params', title: 'Orientation and movement in 3D',
        intro: 'Two of the five parameters, shown on a 3D hand. Choose one, then drag the hand to look from another side. Location and the face need a body, which this hands-only prototype does not have.',
      },
      {
        type: 'match', prompt: 'Match each parameter to its description.',
        pairs: [
          ['Handshape', 'The shape the hand makes'],
          ['Palm orientation', 'The direction the palm faces'],
          ['Location', 'Where on or near the body the sign is made'],
          ['Movement', 'How the hands move'],
          ['Non-manual signals', 'Face, mouth, eyes, head and body'],
        ],
        explain: 'Every sign combines all five. When you copy a sign, check them one at a time.',
      },
      {
        type: 'mcq', prompt: 'Two signs share the same handshape, location and movement, but their palm orientation differs. What can happen?',
        options: ['They are always the same sign', 'They can be two different signs', 'Palm orientation never matters', 'Only facial expression can change meaning'],
        answer: 1,
        explain: 'Pairs of signs that differ in just one parameter are called minimal pairs. Every parameter matters.',
      },
      {
        type: 'content', title: 'Copy a sign like a pro',
        body: `<ol class="steps-list">
<li>Watch your teacher sign it at a natural pace.</li>
<li>Ask to see it again slowly, and focus on <strong>one parameter at a time</strong>.</li>
<li>Check your handshape and palm in a mirror.</li>
<li>Match the location relative to <strong>your own body</strong>.</li>
<li>Copy the facial expression too.</li>
<li>Repeat slowly, then at a natural pace, and ask your teacher for feedback.</li>
</ol>`,
      },
      {
        type: 'content', title: 'Your dominant hand',
        body: `<p>Signers use one <strong>dominant hand</strong> for one-handed signs and for fingerspelling. Left-handed signers usually lead with the left hand, producing a mirror image of a right-handed signer.</p>
<p>Choose one dominant hand and stay consistent. Ask your teacher about any signs where this works differently. ${DEMOS ? 'The Practice Mirror can flip a demonstration if that helps you copy it.' : 'The Practice Mirror’s Mirror switch shows your camera either like a mirror or the way others see you, and “Left hand” in the 3D Hand Lab mirrors the 3D hand.'}</p>`,
      },
    ],
  };

  L['faces-and-space'] = {
    title: 'Faces and space', minutes: 6, kind: 'concept',
    summary: 'Why your face and the space around you are part of FSL grammar.',
    steps: [
      {
        type: 'content', title: 'Your face is part of the grammar', art: 'face',
        body: `<p>In FSL, the hands never work alone. <strong>Non-manual signals</strong> — eyebrows, eyes, mouth, head and body — combine with signs to add meaning.</p>
<p>They can mark a sentence as a <strong>question</strong>, add <strong>emphasis or intensity</strong>, or show <strong>negation</strong>. A signed sentence with a blank face can look unclear, or even mean something different.</p>`,
        callout: { tone: 'note', title: 'Research is still growing', body: '<p>Studies of FSL’s non-manual signals are still limited. Learn the exact patterns by watching fluent Deaf signers.</p>' },
      },
      {
        type: 'truefalse',
        statement: 'In FSL, facial expressions are just decoration and can be left out.',
        answer: false,
        explain: 'Facial expressions and head movements carry grammatical meaning in FSL — for example, in questions. Leaving them out can blur or change your message.',
      },
      {
        type: 'content', title: 'The signing space', art: 'space',
        body: `<p>Most signs are made in the <strong>signing space</strong>: the area in front of your body from about the top of your head to your waist, and a little wider than your shoulders.</p>
<p>Signers also use this space to organize meaning — placing people, places or things at points in space and referring back to them. Pointing is a normal part of signed grammar for referring to people, places and things.</p>`,
      },
      {
        type: 'mcq', prompt: 'Where are most signs produced?',
        options: ['Behind the back', 'In the signing space in front of the body', 'Only next to the mouth', 'Below the waist'],
        answer: 1,
        explain: 'The signing space — roughly head to waist, and a little wider than the shoulders — keeps signs visible and clear.',
      },
      {
        type: 'content', title: 'Watch the whole signer',
        body: `<p>When you watch someone sign, look mainly at their <strong>face</strong>, not only their hands. Fluent signers read the face and take in the hands with their peripheral vision.</p>
<p>It feels unusual at first. Practice in class, in conversations with Deaf signers, and when you watch news programs with an FSL interpreter inset — keep your eyes on the signer's face.</p>`,
      },
      {
        type: 'mcq', prompt: 'When you watch someone sign, where should you mainly look?',
        options: ['At their hands only', 'At their face, while taking in the hands', 'At the floor, to concentrate', 'It does not matter'],
        answer: 1,
        explain: 'Signers usually watch the face, where much of the grammar appears, and see the hands with peripheral vision.',
      },
    ],
  };

  L['practice-setup'] = {
    title: 'Set up your practice space', minutes: 5, kind: 'practice',
    summary: 'Light, framing and habits that make practice — and feedback from Deaf teachers — effective.',
    steps: [
      {
        type: 'content', title: 'Light, background, frame', art: 'lighting',
        body: `<ul class="checklist">
<li><strong>Light in front of you</strong>, shining on your face and hands — not behind you.</li>
<li><strong>A plain background</strong> that contrasts with your skin and clothes.</li>
<li><strong>Frame from above your head to your waist</strong>, with room for your elbows.</li>
<li><strong>A plain, solid-colored top</strong> so your hands stand out.</li>
</ul>`,
      },
      {
        type: 'mcq', prompt: 'Where should the main light be when you record yourself signing?',
        options: ['Behind you, from a bright window', 'In front of you, on your face and hands', 'Directly above you, in a dark room', 'It does not matter'],
        answer: 1,
        explain: 'Light from the front makes your handshapes and facial expressions visible. A bright window behind you creates a silhouette.',
      },
      {
        type: 'content', title: 'Your Practice Mirror', art: 'mirror',
        body: `${DEMOS
    ? '<p>Tanaw’s <strong>Practice Mirror</strong> shows your camera next to a demonstration so you can compare. You can record short clips, play them back and download them to show your teacher.</p>'
    : '<p>Tanaw’s <strong>Practice Mirror</strong> turns on your camera so you can check your framing, lighting, handshapes and facial expression. Record short clips, play them back and download them to show your teacher — your teacher’s feedback tells you whether a sign is right.</p>'}
<p><strong>Your video never leaves your device.</strong> Recordings stay in this browser tab unless you download them.</p>`,
        cta: { href: '#/practice/mirror', label: 'Open the Practice Mirror' },
      },
      {
        type: 'content', title: 'Practice with people', art: 'community',
        body: `<p>An app cannot replace conversation. Look for <strong>FSL classes taught by Deaf teachers</strong> — for example, the Filipino Sign Language Learning Program of the School of Deaf Education and Applied Studies at De La Salle–College of Saint Benilde.</p>
<p>Join Deaf community events respectfully, especially during <strong>Deaf Awareness Week (November 10–16)</strong> and on the <strong>International Day of Sign Languages (September 23)</strong>.</p>`,
      },
      {
        type: 'reflect', prompt: 'Where and when will you practice this week? Make a small plan.',
        placeholder: 'e.g. 10 minutes after dinner, Monday to Friday, using the Practice Mirror.',
      },
    ],
  };

  /* =====================================================================
     UNIT 2 — FINGERSPELLING & NUMBERS
     ===================================================================== */
  L['fingerspelling'] = {
    title: 'Fingerspelling basics', minutes: 6, kind: 'signs', categories: ['alphabet'],
    summary: 'What fingerspelling is for, how it fits the Filipino alphabet, and the manual alphabet A–Z.',
    steps: [
      {
        type: 'content', title: 'What fingerspelling is for', art: 'letters',
        body: `<p><strong>Fingerspelling</strong> represents letters with handshapes. Signers use it for names of people and places, brand names, and words that do not have a common sign.</p>
<p>It is essential — but fluent signers use <strong>signs</strong> for most words. Fingerspelling every word is slow and is not how FSL is used.</p>`,
      },
      {
        type: 'mcq', prompt: 'When is fingerspelling typically used?',
        options: ['For every word in a sentence', 'For names, places and words without a common sign', 'Only for numbers', 'Only when paper is not available'],
        answer: 1,
        explain: 'Fingerspelling fills gaps — names, places and terms without an established sign.',
      },
      {
        type: 'content', title: 'Letters and the Filipino alphabet',
        body: `<p>The modern Filipino alphabet has <strong>28 letters</strong>: A to Z, plus <strong>Ñ</strong> and <strong>NG</strong>.</p>
${DEMOS
    ? '<p>Tanaw’s manual alphabet covers <strong>A–Z</strong>. How Ñ and NG are fingerspelled in FSL should be learned from a Deaf FSL teacher or another verified source; Tanaw will add them when a verified demonstration is available.</p>'
    : '<p>Tanaw’s experimental 3D hand shows the one-handed manual alphabet that FSL shares with American Sign Language — except <strong>T</strong>, which FSL forms differently. Check every handshape with a Deaf FSL teacher, and learn from them how T, Ñ and NG are fingerspelled in FSL.</p>'}
<p>Whatever you spell, aim for clear handshapes over speed, keep a steady and comfortable hand position, and pause briefly between words.</p>`,
      },
      { type: 'hand3d', mode: 'alphabet', title: 'The manual alphabet in 3D', intro: 'Choose a letter, then drag the hand to see it from every side. J and Z move. T is not modeled: FSL forms it differently from the American T.' },
      { type: 'signs', title: 'The manual alphabet (A–Z)', intro: DEMOS ? 'Open any letter to see its demonstration. Letters without a verified demonstration show a labeled placeholder.' : gallery('letter') },
      { type: 'signcheck' },
      {
        type: 'content', title: 'Practice idea',
        body: '<p>Fingerspell your own name, your barangay or city, and your school. Then use the <strong>Fingerspelling</strong> tool in Practice: watch the 3D hand spell any word at your pace, and test yourself by reading words from the hand.</p>',
        cta: { href: '#/practice/fingerspell', label: 'Open the Fingerspelling tool' },
      },
    ],
  };

  L['numbers'] = {
    title: 'Numbers 0–10', minutes: 5, kind: 'signs', categories: ['numbers'],
    summary: 'The numbers you need for ages, prices, times and phone numbers.',
    steps: [
      {
        type: 'content', title: 'Counting in FSL', art: 'numbers',
        body: `<p>Numbers are everywhere: ages, prices, the time, jeepney fares and phone numbers.</p>
<p>Number signs differ between sign languages, so learn them from a Deaf FSL teacher — not from charts made for other sign languages.</p>`,
      },
      { type: 'signs', title: 'Numbers 0–10', intro: gallery('number') },
      { type: 'signcheck' },
      {
        type: 'content', title: 'Everyday practice',
        body: '<p>Practice with numbers you see every day: prices at the sari-sari store, room numbers and dates. Ask your teacher how larger numbers, money and time are signed in your region.</p>',
      },
    ],
  };

  /* =====================================================================
     UNIT 3 — EVERYDAY SIGNS
     ===================================================================== */
  L['greetings'] = {
    title: 'Greetings & courtesy', minutes: 6, kind: 'signs', categories: ['greetings'],
    summary: 'Hellos, thanks, apologies and introductions.',
    steps: [
      {
        type: 'content', title: 'Starting a conversation', art: 'chat',
        body: `<p>Greetings, thanks and apologies open doors in any language. This lesson gathers the vocabulary for introductions and polite conversation.</p>
<p><strong>Introductions in Deaf communities</strong> often include more than a name — people commonly share how they are connected to the community, for example whether they are Deaf or hearing and where they learned to sign. Fingerspell your name clearly.</p>`,
      },
      { type: 'signs', title: 'Greetings & courtesy vocabulary', intro: gallery('entry') },
      { type: 'signcheck' },
      {
        type: 'content', title: 'What about po and opo?',
        body: `<p>In spoken Filipino, respect is often carried by words like <em lang="fil">po</em> and <em lang="fil">opo</em>. How does FSL show respect?</p>
<p>Do not assume there is a word-for-word sign. Ask a Deaf teacher, and watch how Deaf signers use facial expression, posture and the signing space.</p>`,
      },
      {
        type: 'mcq', prompt: 'A Deaf person signs a word differently from the version you learned. What is the best response?',
        options: ['Correct them — your version is right', 'Assume they made a mistake', 'Recognize it may be a regional variant, and ask or adapt', 'Switch to American Sign Language'],
        answer: 2,
        explain: 'FSL varies by region and community. Variation is normal — curiosity beats correction.',
      },
    ],
  };

  L['family'] = {
    title: 'Family & people', minutes: 5, kind: 'signs', categories: ['family'],
    summary: 'Pamilya: relatives and the people around you.',
    steps: [
      {
        type: 'content', title: 'Pamilya', art: 'community',
        body: `<p>Family is at the heart of Filipino life, and family words are often among the first a learner needs — including relationship terms like <em lang="fil">Kuya</em> and <em lang="fil">Ate</em>.</p>
<p>Many deaf children are born into hearing families. When parents, siblings and relatives learn FSL, a Deaf child gains access to language and connection at home — and early access to language matters for every child's development.</p>`,
      },
      { type: 'signs', title: 'Family & people vocabulary', intro: gallery('entry') },
      { type: 'signcheck' },
      {
        type: 'truefalse',
        statement: 'Kuya and Ate are spoken Filipino words, so their FSL signs must copy their spelling.',
        answer: false,
        explain: 'Signs are not built from spoken spelling. Learn the FSL signs for family terms from a Deaf FSL teacher.',
      },
    ],
  };

  L['daily-life'] = {
    title: 'Everyday life', minutes: 6, kind: 'signs', categories: ['daily'],
    summary: 'Home, school, food and getting around.',
    steps: [
      {
        type: 'content', title: 'Around town', art: 'town',
        body: `<p>From the sari-sari store to the jeepney, daily life is full of places and actions. This lesson covers vocabulary for home, school, food and getting around.</p>
<p>Some everyday words — like <em>jeepney</em>, <em>tricycle</em> and <em>CR</em> — are very Filipino. Their FSL signs are part of what makes FSL a language of the Philippines.</p>`,
      },
      { type: 'signs', title: 'Everyday life vocabulary', intro: gallery('entry') },
      { type: 'signcheck' },
      {
        type: 'content', title: 'Communicating in public',
        body: '<p>In busy places, Deaf Filipinos combine FSL, writing, gestures and phones to get things done. As a hearing person you can help: face the person, type or write when needed, and be patient — a communication barrier is not the Deaf person’s fault.</p>',
        cta: { href: '#/bridge', label: 'Try the Conversation Bridge' },
      },
    ],
  };

  L['time'] = {
    title: 'Time & days', minutes: 5, kind: 'signs', categories: ['time'],
    summary: 'Today, tomorrow, parts of the day and the days of the week.',
    steps: [
      {
        type: 'content', title: 'Talking about time', art: 'calendar',
        body: `<p>Plans need time words: today, tomorrow, mornings and the days of the week.</p>
<p>Notice something about Filipino: <em lang="fil">Linggo</em> means both <strong>Sunday</strong> and <strong>week</strong>. That does not mean FSL uses one sign for both. Sign meanings do not follow spoken-language words — check each one with your Deaf teacher.</p>`,
      },
      { type: 'signs', title: 'Time & days vocabulary', intro: gallery('entry') },
      { type: 'signcheck' },
      {
        type: 'mcq', prompt: 'When is Deaf Awareness Week in the Philippines?',
        options: ['September 23', 'November 10–16', 'October 30', 'The last week of February'],
        answer: 1,
        explain: 'Proclamation No. 829 (1991) set November 10–16 of every year. September 23 is the International Day of Sign Languages, and October 30 marks the approval of the FSL Act in 2018.',
      },
    ],
  };

  L['feelings-questions'] = {
    title: 'Feelings & questions', minutes: 6, kind: 'signs', categories: ['feelings', 'questions'],
    summary: 'Emotions, states and question words — where your face matters most.',
    steps: [
      {
        type: 'content', title: 'Say how you feel', art: 'face',
        body: `<p>Feelings are where non-manual signals shine. Your facial expression should match what you sign — a sign for "happy" with a flat face sends a mixed message.</p>
<p>Questions involve the face too. Learn from Deaf signers how FSL marks different kinds of questions with the eyebrows, eyes and head.</p>`,
      },
      { type: 'signs', title: 'Feelings & questions vocabulary', intro: gallery('entry') },
      { type: 'signcheck' },
      {
        type: 'truefalse',
        statement: 'In FSL you can sign "sad" with a big smile and the meaning stays exactly the same.',
        answer: false,
        explain: 'Your face is part of the message. Non-manual signals should match the meaning you sign.',
      },
    ],
  };

  L['safety-health'] = {
    title: 'Safety & health', minutes: 7, kind: 'signs', categories: ['safety'],
    summary: 'Vocabulary for emergencies, disasters and health care — and inclusive emergency planning.',
    steps: [
      {
        type: 'content', title: 'Signs that keep people safe', art: 'alert',
        body: `<p>Typhoons, floods and earthquakes are part of life in the Philippines. Deaf people need emergency information in accessible forms — FSL interpreters for announcements, visual alerts and text-based updates.</p>
<p>Under RA 11106, state hospitals and health facilities must provide FSL interpreters and accessible materials free of charge when Deaf patients — or their families — request them.</p>`,
        source: 'Republic Act No. 11106, Section 8.',
      },
      { type: 'signs', title: 'Safety & health vocabulary', intro: gallery('entry') },
      { type: 'signcheck' },
      {
        type: 'content', title: 'Make your emergency plan inclusive',
        body: `<ul class="checklist">
<li>Include Deaf family members, classmates and co-workers in drills and planning.</li>
<li>Use visual alarms and text alerts — not only sirens and spoken announcements.</li>
<li>Agree on simple, practiced signals with your household.</li>
<li>Save the national emergency hotline: <strong>911</strong>.</li>
</ul>`,
        cta: { href: '#/bridge?tab=emergency', label: 'Set up an Emergency Card' },
      },
      {
        type: 'mcq', prompt: 'Your barangay is planning an evacuation drill. What makes it accessible to Deaf residents?',
        options: ['Louder sirens', 'Visual alerts, text updates and FSL interpreters', 'Longer spoken announcements', 'Nothing special is needed'],
        answer: 1,
        explain: 'Sound-only alerts exclude Deaf residents. Visual alerts, text updates and FSL interpretation make information reach everyone.',
      },
    ],
  };

  /* =====================================================================
     UNIT 4 — BEING AN ALLY
     ===================================================================== */
  L['fsl-act'] = {
    title: 'Know the FSL Act', minutes: 7, kind: 'culture',
    summary: 'What Republic Act No. 11106 guarantees, section by section.',
    steps: [
      {
        type: 'content', title: 'RA 11106 at a glance', art: 'law',
        body: `<p>The Filipino Sign Language Act was approved on <strong>October 30, 2018</strong>. Here is what its main sections cover:</p>
<dl class="law-list">
<dt>Sec. 3 — National sign language</dt><dd>FSL is the medium of official communication in transactions involving the Deaf and the language of instruction in Deaf education — without prejudice to other forms of communication a person chooses.</dd>
<dt>Sec. 4 — Education</dt><dd>FSL as the medium of instruction in Deaf education and a separate subject for Deaf learners; alternative assessment to help Deaf teachers get licensed; FSL as a curricular or co-curricular offering in teacher education programs, as deemed appropriate.</dd>
<dt>Sec. 5 — Interpreting standards</dt><dd>The Komisyon sa Wikang Filipino (KWF), with the Deaf community, sets national standards, accreditation and procedures for FSL interpreting.</dd>
<dt>Sec. 6 — Justice system</dt><dd>Qualified sign language interpreters in court and tribunal proceedings involving Deaf people; hearings and transactions in police stations and before the barangay Lupong Tagapamayapa are covered too.</dd>
<dt>Sec. 7 — Workplaces</dt><dd>FSL is the official language of Deaf employees in the civil service and all government workplaces, with awareness and training seminars on FSL.</dd>
<dt>Sec. 8 — Health</dt><dd>State hospitals and health facilities must take steps to ensure Deaf people’s access to health services, including free FSL interpreters and accessible materials on request; private facilities are encouraged to do the same.</dd>
<dt>Sec. 9 — Public services</dt><dd>FSL in public transactions; qualified interpreters and accessible materials at government events whenever necessary or requested.</dd>
<dt>Sec. 10 — Media</dt><dd>FSL interpreter insets in TV news and public affairs programs; videos published online, including on social media, must conform to Philippine web accessibility standards.</dd>
<dt>Sec. 11 — Promotion</dt><dd>FSL as an elective in the regular or mainstream curriculum, particularly in state universities and colleges, and continuing research on the development, propagation and preservation of FSL.</dd>
</dl>`,
        source: 'Republic Act No. 11106 (full text: Official Gazette / Lawphil).',
      },
      {
        type: 'mcq', prompt: 'Under RA 11106, what must TV news and public affairs programs include?',
        options: ['FSL interpreter insets', 'Audio description only', 'English subtitles only', 'Nothing — it is voluntary'],
        answer: 0,
        explain: 'Section 10 directs the KBP and the MTRCB to require FSL interpreter insets in news and public affairs programs.',
      },
      {
        type: 'mcq', prompt: 'Which agency leads national standards and accreditation for FSL interpreting?',
        options: ['Department of Tourism', 'Komisyon sa Wikang Filipino (KWF)', 'Philippine Statistics Authority', 'Land Transportation Office'],
        answer: 1,
        explain: 'Section 5 tasks the KWF, with the Deaf community and other stakeholders, to set standards, accreditation and procedures for FSL interpreting.',
      },
      {
        type: 'truefalse',
        statement: 'RA 11106 means Deaf people must always use FSL, even when they prefer another way to communicate.',
        answer: false,
        explain: 'The law promotes FSL "without prejudice to the use of other forms of communication depending on individual choice or preference."',
      },
      {
        type: 'content', title: 'Where the law meets daily life',
        body: `<p>Laws matter when people use them. If you are organizing a school event, a barangay meeting or a hospital visit with a Deaf person, you can point to RA 11106 when requesting qualified FSL interpreters and accessible materials.</p>
<p>The law's Implementing Rules and Regulations were completed by the KWF with the Deaf community and other stakeholders (dated December 6, 2021).</p>`,
      },
    ],
  };

  L['interpreters'] = {
    title: 'Working with interpreters', minutes: 6, kind: 'culture',
    summary: 'When to book a qualified FSL interpreter, and how to work well with one.',
    steps: [
      {
        type: 'content', title: 'When to book an interpreter', art: 'chat',
        body: `<p>Important conversations deserve full access: medical visits, legal matters, school meetings, job interviews, government transactions and public events.</p>
<p>Ask the Deaf person what they need, book a <strong>qualified FSL interpreter</strong> early, and share materials — slides, scripts, names — in advance.</p>`,
      },
      {
        type: 'content', title: 'During the conversation',
        body: `<ul class="checklist">
<li>Speak directly to the Deaf person.</li>
<li>Keep a natural pace, and allow a short lag for interpreting.</li>
<li>Seat the interpreter where the Deaf person can see both the interpreter and the speaker or slides.</li>
<li>Make sure the interpreter is well lit.</li>
<li>Let one person speak at a time.</li>
</ul>`,
      },
      {
        type: 'truefalse',
        statement: 'Anyone who knows a few signs can interpret at a hospital.',
        answer: false,
        explain: 'Interpreting needs fluency in both languages, training and professional ethics. RA 11106 calls for qualified interpreters and directs the KWF to set national standards and accreditation.',
      },
      {
        type: 'content', title: 'Finding interpreters',
        body: `<p>Start with local Deaf organizations — they know trusted interpreters. The <strong>Philippine National Association of Sign Language Interpreters (PNASLI)</strong> is a professional association of interpreters, and the <strong>National Council on Disability Affairs (NCDA)</strong> has published a directory of sign language interpreters.</p>
<p>Interpreting is a profession: expect to pay professional rates.</p>`,
      },
      {
        type: 'mcq', prompt: 'Your school is hosting an event with Deaf guests. What is the best first step?',
        options: [
          'Ask a student who knows the alphabet to interpret',
          'Ask the Deaf guests about their access needs and book qualified FSL interpreters early',
          'Print the speeches and skip interpreters',
          'Ask the guests to bring their own interpreters',
        ],
        answer: 1,
        explain: 'Access is the host’s responsibility. Ask about needs early and book qualified interpreters.',
      },
    ],
  };

  L['allyship'] = {
    title: 'Allyship in action', minutes: 5, kind: 'culture',
    summary: 'Everyday actions that support the Filipino Deaf community.',
    steps: [
      {
        type: 'content', title: 'Nothing about us without us', art: 'community',
        body: `<p>This disability-rights principle means decisions about Deaf people should include Deaf people. As an ally, <strong>amplify Deaf voices</strong> rather than speaking for them.</p>
<ul class="checklist">
<li>Learn FSL from Deaf teachers and Deaf-led programs.</li>
<li>Support Deaf-led organizations, businesses and artists.</li>
<li>Caption your videos, and add FSL interpretation to public content when you can.</li>
<li>Speak up when you see FSL mocked online.</li>
</ul>`,
      },
      {
        type: 'content', title: 'Respect online',
        body: `<p>In April 2020, when FSL interpreter insets on TV news were mocked in online memes, the Philippine National Association of Sign Language Interpreters asked the public to learn FSL and Deaf culture instead, and the Commission on Human Rights urged people to stop ridiculing interpreters.</p>
<p>Before you post sign language content, ask: is it accurate, is it respectful, and does it credit Deaf signers?</p>`,
        source: 'ABS-CBN News, “Interpreters seek awareness after online ‘mockery’ of sign language insets” (April 6, 2020); Commission on Human Rights press statement (2020).',
      },
      {
        type: 'sort', title: 'Helpful or harmful?',
        prompt: 'Sort each action.',
        bins: ['Helpful', 'Harmful'],
        items: [
          { text: 'Captioning the videos you post', bin: 0 },
          { text: 'Taking an FSL class taught by a Deaf teacher', bin: 0 },
          { text: 'Asking Deaf people what support they want', bin: 0 },
          { text: 'Sharing a "sign" you made up for fun as if it were FSL', bin: 1 },
          { text: 'Mocking interpreter insets in memes', bin: 1 },
          { text: 'Speaking for Deaf people without asking them', bin: 1 },
        ],
        explain: 'Allyship means accuracy, respect and centering Deaf people’s own voices.',
      },
      {
        type: 'reflect', prompt: 'What is one action you will take this month to support Deaf access?',
        placeholder: 'e.g. Add captions to my class videos and invite a Deaf speaker to our org.',
      },
      {
        type: 'content', title: 'Keep going', art: 'emblem',
        body: '<p>You have reached the end of the learning path. Keep reviewing with spaced repetition, practice in the mirror and — most of all — keep learning FSL with Deaf teachers and the Deaf community.</p>',
        cta: { href: '#/practice', label: 'Go to Practice' },
      },
    ],
  };

  // Attach ids and unit references.
  D.units.forEach((unit) => unit.lessons.forEach((id) => { L[id].id = id; L[id].unit = unit.id; }));
  D.lessons = L;

  /* ---------- Helpers ---------- */
  D.lessonOrder = () => D.units.reduce((acc, u) => acc.concat(u.lessons), []);
  D.getLesson = (id) => L[id] || null;
  D.unitOf = (lessonId) => D.units.find((u) => u.lessons.includes(lessonId)) || null;
  D.lessonSignIds = (lesson) => {
    if (!lesson || !lesson.categories) return [];
    return lesson.categories.reduce((acc, cat) => acc.concat(D.signs.filter((s) => s.cat === cat).map((s) => s.id)), []);
  };

  /** Question pool for the concept quiz: every mcq/truefalse step in the path. */
  D.questionPool = () => {
    const pool = [];
    D.lessonOrder().forEach((id) => {
      L[id].steps.forEach((step, i) => {
        if (step.type === 'mcq' || step.type === 'truefalse') pool.push(Object.assign({ key: `${id}#${i}`, lesson: id }, step));
      });
    });
    return pool;
  };
})();
