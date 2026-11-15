/* =========================================================================
   Tanaw — Deaf culture & community content, observances, rights,
   resources and the source list behind factual claims.
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.etiquette = {
    dos: [
      { id: 'attention', title: 'Get attention visually', text: 'Wave within the person’s line of sight, tap a shoulder gently, or flick the lights once in a room.' },
      { id: 'eye-contact', title: 'Keep eye contact', text: 'In a signed conversation your eyes do the listening. Looking away can end the conversation.' },
      { id: 'ask', title: 'Ask, don’t assume', text: 'Ask how the person prefers to communicate: FSL, writing, typing or gestures.' },
      { id: 'talk-direct', title: 'Talk to the Deaf person', text: 'With an interpreter present, address the Deaf person directly.' },
      { id: 'be-visible', title: 'Be easy to see', text: 'Face the light, keep your face visible and avoid standing in front of bright windows.' },
      { id: 'patience', title: 'Be patient — and repeat', text: 'It’s fine to ask someone to repeat or slow down. Rephrase instead of giving up.' },
    ],
    donts: [
      { id: 'no-shout', title: 'Don’t shout or grab', text: 'Volume doesn’t help, and grabbing is startling. Use visual or gentle tactile cues.' },
      { id: 'no-lipreading', title: 'Don’t assume lipreading', text: 'Many sounds look alike on the lips. Lipreading alone is unreliable and tiring.' },
      { id: 'no-never-mind', title: 'Don’t say "never mind"', text: 'Leaving a Deaf person out of a conversation is exclusion. Take the time to share it.' },
      { id: 'no-invented-signs', title: 'Don’t invent or mock signs', text: 'FSL is a language. Making up "signs" or imitating signing for laughs is disrespectful.' },
      { id: 'no-touch-hands', title: 'Don’t touch a signer’s hands', text: 'Hands are how a signer speaks. Ask before offering any correction.' },
      { id: 'no-linger', title: 'Don’t linger between signers', text: 'If you must pass between two people signing, go through quickly without stopping.' },
    ],
  };

  /** Look up an etiquette entry by id; returns { kind: 'do' | 'dont', ...entry }. */
  D.getEtiquette = (id) => {
    const d = D.etiquette.dos.find((x) => x.id === id);
    if (d) return Object.assign({ kind: 'do' }, d);
    const n = D.etiquette.donts.find((x) => x.id === id);
    return n ? Object.assign({ kind: 'dont' }, n) : null;
  };

  D.terms = [
    { use: 'Deaf', avoid: 'deaf-mute', why: '"Mute" implies no voice. Deaf people communicate fully in FSL — and some also speak, write or type.' },
    { use: 'Deaf / deaf', avoid: 'deaf and dumb', why: '"Dumb" is an outdated insult that wrongly links deafness with a lack of intelligence.' },
    { use: 'Deaf person', avoid: 'pipi', why: 'Like "mute", "pipi" suggests a person has no language. It is hurtful.' },
    { use: 'hard of hearing', avoid: 'hearing impaired', why: 'The World Federation of the Deaf advises against "hearing impaired" — it defines people by deficit. Follow each person’s own term.' },
    { use: 'Filipino Sign Language (FSL)', avoid: '"sign language" as if it were universal', why: 'There are many sign languages. Name the language: FSL.' },
    { use: 'uses FSL / is a signer', avoid: 'suffers from deafness', why: 'Many Deaf people see deafness as an identity, not suffering.' },
  ];

  D.myths = [
    { myth: 'Sign language is universal.', fact: 'There are many sign languages. FSL is its own language, distinct from ASL and others — and it varies across regions of the Philippines.' },
    { myth: 'FSL is just Filipino or English on the hands.', fact: 'FSL has its own grammar and vocabulary. It is not a word-for-word code of a spoken language.' },
    { myth: 'Signing is basically mime.', fact: 'Some signs are visually motivated, but FSL is a structured language with handshapes, movements, locations and grammar that must be learned.' },
    { myth: 'All Deaf people can read lips.', fact: 'Lipreading is hard and unreliable — many sounds look identical. Communication preferences differ from person to person.' },
    { myth: 'Fingerspelling every word is the same as signing.', fact: 'Fingerspelling is for names, places and specific terms. Fluent signers use signs for most words.' },
    { myth: 'Anyone who knows some signs can interpret.', fact: 'Interpreting is a profession needing fluency, training and ethics. RA 11106 calls for qualified interpreters and national standards.' },
    { myth: 'Deaf people can’t do many jobs.', fact: 'Deaf Filipinos work as teachers, artists, engineers, athletes, entrepreneurs and more. Access, not ability, is usually the barrier.' },
  ];

  /* `approx` marks stops without an exact year; the Timeline game leaves them out
     so that no round asks players to order two overlapping moments. */
  D.timeline = [
    { year: '1907', src: 'psd', title: 'Formal Deaf education begins', text: 'The School for the Deaf and Blind opens in Manila, founded by American educator Delight Rice. It is known today as the Philippine School for the Deaf.' },
    { year: '1926', src: 'pfd-history', title: 'A Deaf-led association', text: 'Pedro Santos, a Deaf Filipino, founds the Philippine Association of the Deaf. He was the first Deaf Filipino sent by the government to study at Gallaudet College, and the first Deaf teacher in the Philippines.' },
    { year: '1963', src: 'psd', title: 'Two schools', text: 'The School for the Deaf and Blind is separated into two institutions — one for the Deaf and one for the blind.' },
    { year: '1970s–80s', src: 'martinez2008', approx: true, title: 'Books from abroad', text: 'Sign language books of this period, by North American writers, draw largely on American Sign Language and artificial sign systems, and prescribe how to sign rather than describing how Filipino Deaf people sign.' },
    { year: 'Early 1990s', src: 'martinez2008', approx: true, title: 'Studying FSL as it is used', text: 'Linguist Liza Martinez begins the first descriptive research on FSL — its structure and its sociolinguistics.' },
    { year: '1991', src: 'proc829', title: 'Deaf Awareness Week', text: 'Proclamation No. 829 declares November 10–16 of every year as Deafness Awareness Week — observed today as Deaf Awareness Week.' },
    { year: '1996', src: 'pfd-history', title: 'A national Deaf federation', text: 'On October 19, seventeen leaders of Deaf organizations from around the country establish the Philippine Federation of the Deaf (PFD). It is formally recognized at its first General Assembly in 1997.' },
    { year: '2004', src: 'martinez2008', title: 'An FSL reference', text: 'The Philippine Deaf Resource Center and the PFD publish "An Introduction to Filipino Sign Language".' },
    { year: '2005–07', src: 'pfd-2007', title: 'Documenting regional signs', text: 'The PFD publishes "Filipino Sign Language: A Compilation of Signs from Regions of the Philippines" in two parts, in 2005 and 2007.' },
    { year: '2018', src: 'ra11106-gazette', title: 'The FSL Act', text: 'Republic Act No. 11106 is approved on October 30, declaring FSL the national sign language of the Filipino Deaf.' },
    { year: '2021', src: 'irr', title: 'Rules for implementation', text: 'The law’s Implementing Rules and Regulations, led by the KWF with Deaf community consultation, are completed (dated December 6, 2021).' },
    { year: '2022', src: 'benilde-bsli', title: 'Training interpreters', text: 'De La Salle–College of Saint Benilde opens a Bachelor in Sign Language Interpretation program.' },
    { year: '2027 →', title: 'Your chapter', text: 'Learn FSL with the Deaf community, insist on verified materials, and help make access ordinary.', future: true },
  ];

  /* month is 1-based. `kind` controls date computation. */
  D.observances = [
    { id: 'idsl', name: 'International Day of Sign Languages', month: 9, day: 23, kind: 'day', by: 'United Nations',
      text: 'A UN day celebrating sign languages and the linguistic identity of Deaf people worldwide.' },
    { id: 'iwdp', name: 'International Week of Deaf People', kind: 'last-full-week-september', by: 'World Federation of the Deaf',
      text: 'Held during the last full week of September by Deaf communities around the world.' },
    { id: 'fsl-act', name: 'FSL Act anniversary', month: 10, day: 30, kind: 'day', by: 'Republic Act No. 11106',
      text: 'The day in 2018 when the Filipino Sign Language Act was approved.' },
    { id: 'daw', name: 'Deaf Awareness Week (Philippines)', month: 11, day: 10, endDay: 16, kind: 'range', by: 'Proclamation No. 829, s. 1991',
      text: 'November 10–16 every year — a week for awareness of Deaf people and Deaf culture in the Philippines.' },
    { id: 'idpd', name: 'International Day of Persons with Disabilities', month: 12, day: 3, kind: 'day', by: 'United Nations',
      text: 'A UN day promoting the rights and well-being of persons with disabilities.' },
  ];

  /* `place` is where the section shows up in daily life (used by the Rights exhibit map). */
  D.rights = [
    { sec: '3', area: 'National sign language', place: 'Everywhere', placeFil: 'Saanman', icon: 'globe', text: 'FSL is the medium of official communication in transactions involving the Deaf and the language of instruction in Deaf education — without prejudice to other forms of communication a person chooses.' },
    { sec: '4', area: 'Education', place: 'School', placeFil: 'Paaralan', icon: 'school', text: 'FSL as the medium of instruction in Deaf education and a separate subject for Deaf learners; alternative assessment to help Deaf teachers get licensed; FSL as a curricular or co-curricular offering in teacher education, as deemed appropriate.' },
    { sec: '5', area: 'Interpreting standards', place: 'Language commission', placeFil: 'KWF', icon: 'shield', text: 'The KWF, with the Deaf community, sets national standards, accreditation and procedures for FSL interpreting.' },
    { sec: '6', area: 'Justice', place: 'Police station & courts', placeFil: 'Presinto at hukuman', icon: 'scale', text: 'Qualified sign language interpreters in court and tribunal proceedings involving the Deaf — hearings and transactions in police stations and before the barangay Lupong Tagapamayapa are covered too.' },
    { sec: '7', area: 'Workplaces', place: 'Government office', placeFil: 'Tanggapan', icon: 'briefcase', text: 'FSL is the official language of Deaf employees in government workplaces, with awareness and training for staff.' },
    { sec: '8', area: 'Health', place: 'Hospital', placeFil: 'Ospital', icon: 'hospital', text: 'State hospitals and health facilities must take steps to ensure access to health services, including free FSL interpreters and accessible materials on request; private facilities are encouraged to do the same.' },
    { sec: '9', area: 'Public services', place: 'City hall & public events', placeFil: 'Munisipyo', icon: 'landmark', text: 'FSL in public transactions; qualified interpreters and accessible materials at government events, meetings and cultural or sports activities whenever necessary or requested.' },
    { sec: '10', area: 'Media', place: 'TV news', placeFil: 'Telebisyon', icon: 'tv', text: 'FSL interpreter insets in TV news and public affairs; videos published online, including on social media, must conform to Philippine web accessibility standards.' },
    { sec: '11', area: 'Promotion & research', place: 'Classrooms & research', placeFil: 'Pananaliksik', icon: 'book', text: 'FSL as an elective in the regular or mainstream curriculum, particularly in state universities and colleges, plus continuing research on the development, propagation and preservation of FSL.' },
  ];

  /* Many ways of being Deaf — every statement here also appears in the lessons. */
  D.facets = [
    { id: 'identity', title: 'Identity is self-chosen', icon: 'user',
      text: 'Some people write deaf (lowercase) for not hearing, and Deaf (capital D) for belonging to the Deaf community — its language, culture and shared history. Others say hard of hearing. People choose how they identify, so follow each person’s lead.' },
    { id: 'communication', title: 'Many ways to communicate', icon: 'chat',
      text: 'Some deaf people use FSL, some use spoken language, and many use both. Writing, typing and gestures help too. Ask what works best — and respect the answer.' },
    { id: 'family', title: 'Families differ', icon: 'home',
      text: 'Many deaf children are born into hearing families. When parents, siblings and relatives learn FSL, a Deaf child gains access to language and connection at home.' },
    { id: 'place', title: 'One language, many places', icon: 'map',
      text: 'FSL varies across regions of the Philippines. A sign used in Cebu may differ from the one used in Metro Manila or Davao — that is variation, not a mistake.' },
    { id: 'life', title: 'A full community life', icon: 'people',
      text: 'Filipino Deaf communities have their own schools, churches, sports, arts, humor and organizations. Deaf Filipinos are teachers, artists, athletes, engineers, entrepreneurs, parents and leaders.' },
    { id: 'visual', title: 'A visual way of life', icon: 'eye',
      text: 'Deaf culture is visual: people wave or tap to get attention, flick the lights to call a room, keep clear sightlines when they talk, and value eye contact.' },
  ];

  D.resources = [
    { name: 'Philippine Federation of the Deaf (PFD)', url: 'https://pfdeaf.org/', kind: 'Deaf-led organization',
      text: 'National organization representing Deaf Filipinos, preserving FSL and promoting Deaf identity.' },
    { name: 'Benilde SDEAS — FSL Learning Program', url: 'https://sdeas.benilde.edu.ph/filipinosignlanguagelearningprogram', kind: 'FSL classes',
      text: 'Non-degree FSL program of the School of Deaf Education and Applied Studies, De La Salle–College of Saint Benilde.' },
    { name: 'School of Deaf Education and Applied Studies (SDEAS)', url: 'https://sdeas.benilde.edu.ph/', kind: 'Higher education',
      text: 'Degree programs in Applied Deaf Studies and Sign Language Interpretation.' },
    { name: 'Komisyon sa Wikang Filipino (KWF)', url: 'https://kwf.gov.ph/', kind: 'Government',
      text: 'Tasked under RA 11106 with FSL interpreting standards and accreditation; led the law’s implementing rules.' },
    { name: 'National Council on Disability Affairs (NCDA)', url: 'https://ncda.gov.ph/', kind: 'Government',
      text: 'Publishes disability laws and observances, including Deaf Awareness Week.' },
    { name: 'RA 11106 — full text (Official Gazette)', url: 'https://www.officialgazette.gov.ph/2018/10/30/republic-act-no-11106/', kind: 'Law',
      text: 'Read the Filipino Sign Language Act in full.' },
    { name: 'World Federation of the Deaf', url: 'https://wfdeaf.org/', kind: 'International',
      text: 'International organization of national Deaf associations; organizes the International Week of Deaf People.' },
    { name: 'UN — International Day of Sign Languages', url: 'https://www.un.org/en/observances/sign-languages-day', kind: 'International',
      text: 'Background on the September 23 observance.' },
  ];

  /* Sources behind the factual claims made in lessons and culture pages. */
  D.sources = [
    { id: 'ra11106-lawphil', label: 'Republic Act No. 11106 (The Filipino Sign Language Act), approved October 30, 2018 — Lawphil', url: 'https://lawphil.net/statutes/repacts/ra2018/ra_11106_2018.html' },
    { id: 'ra11106-gazette', label: 'Republic Act No. 11106 — Official Gazette of the Republic of the Philippines', url: 'https://www.officialgazette.gov.ph/2018/10/30/republic-act-no-11106/' },
    { id: 'proc829', label: 'Proclamation No. 829, s. 1991 (November 10–16, Deafness Awareness Week) — Lawphil', url: 'https://lawphil.net/executive/proc/proc1991/proc_829_1991.html' },
    { id: 'irr', label: 'Implementing Rules and Regulations of the Filipino Sign Language Act (dated December 6, 2021) — ADB Law and Policy Reform Program', url: 'https://lpr.adb.org/resource/implementing-rules-and-regulations-filipino-sign-language-act-philippines' },
    { id: 'pfd', label: 'Philippine Federation of the Deaf — Mission and Priorities', url: 'https://pfdeaf.org/mission-and-priorities/' },
    { id: 'pfd-history', label: 'Philippine Federation of the Deaf — History (1926 Philippine Association of the Deaf; 1996–97 founding of the PFD)', url: 'https://pfdeaf.org/history/' },
    { id: 'martinez2008', label: 'Martinez, L. B. and Cabalfin, E. P. G. (2008). Sign Language and Computing in a Developing Country: A Research Roadmap for the Next Two Decades in the Philippines. PACLIC 22 — ACL Anthology', url: 'https://aclanthology.org/Y08-1046/' },
    { id: 'psd', label: 'Philippine School for the Deaf — history (Wikipedia overview)', url: 'https://en.wikipedia.org/wiki/Philippine_School_for_the_Deaf' },
    { id: 'wiki-fsl', label: 'Filipino Sign Language — Wikipedia (influence of ASL since 1907; differences in handshapes, sign formation and grammar; the letter T)', url: 'https://en.wikipedia.org/wiki/Filipino_Sign_Language' },
    { id: 'verafiles-2015', label: 'Kinds of sign language in the Philippines — VERA Files (2015): the letter T is signed differently in FSL and ASL', url: 'https://verafiles.org/articles/kinds-of-sign-language-in-the-philippines' },
    { id: 'up-ling', label: 'Filipino Sign Language — Philippine Indigenous Languages Lecture Series, UP Department of Linguistics', url: 'https://linguistics.upd.edu.ph/events/filipino-sign-language-philippine-indigenous-languages-lecture-series' },
    { id: 'pfd-2007', label: 'Filipino Sign Language: A Compilation of Signs from Regions of the Philippines (PFD; Part 1, 2005; Part 2, 2007) — KWF Library catalog', url: 'https://library.kwf.gov.ph/bib/2633' },
    { id: 'abs-cbn', label: 'Interpreters seek awareness after online ‘mockery’ of sign language insets — ABS-CBN News (April 6, 2020)', url: 'https://news.abs-cbn.com/news/04/06/20/interpreters-seek-awareness-after-online-mockery-of-sign-language-insets' },
    { id: 'inquirer-chr', label: 'CHR asks netizens to stop ridiculing sign language interpreters on TV — Philippine Daily Inquirer (2020)', url: 'https://newsinfo.inquirer.net/1256031/chr-asks-netizens-to-stop-ridiculing-sign-language-interpreters-in-tv-programs' },
    { id: 'wfd-avatars', label: 'WFD and WASLI Statement on Use of Signing Avatars (March 14, 2018; updated April 14, 2018) — World Federation of the Deaf', url: 'https://wfdeaf.org/wp-content/uploads/WFD-and-WASLI-Statement-on-Avatar-FINAL-14032018-Updated-14042018.pdf' },
    { id: 'cueto2020', label: 'Cueto, M., He, W., Untiveros, R., Zuñiga, J. and Rivera, J. P. (2020). Translating an Aesop’s Fable to Filipino Sign Language through 3D Animation. Sign Language Workshop, LREC 2020 — ACL Anthology', url: 'https://aclanthology.org/2020.signlang-1.7/' },
    { id: 'wfd-terms', label: 'Is it fine to use the term "deaf-mute", "deaf and dumb" or "hearing impaired"? — World Federation of the Deaf (FAQ)', url: 'https://wfdeaf.org/faqs/is-it-fine-to-use-the-term-deaf-mute-deaf-and-dumb-or-hearing-impaired-in-reference-to-a-deaf-person/' },
    { id: 'heraldo', label: 'The Deafening Reality: a symposium with the Federation of the Deaf – Cavite Province (terminology and self-identification) — Heraldo Filipino', url: 'https://www.heraldofilipino.org/clacsg-fdcp-hold-the-deafening-reality-a-symposium-for-deaf-and-sign-language/' },
    { id: 'benilde-field', label: 'Field documentation of Filipino Sign Language vocabulary and phrases (regional variation, with the PFD) — De La Salle–College of Saint Benilde', url: 'https://sdgs.benilde.edu.ph/field-documentation-of-filipino-sign-language-vocabulary-and-phrases/' },
    { id: 'benilde-bsli', label: 'Bachelor in Sign Language Interpretation opens at Benilde', url: 'https://www.benilde.edu.ph/bachelor-in-sign-language-interpretation-opens-at-benilde/' },
    { id: 'alphabet', label: 'Filipino alphabet (28 letters including Ñ and NG) — Wikipedia overview', url: 'https://en.wikipedia.org/wiki/Filipino_alphabet' },
  ];

  D.getSource = (id) => D.sources.find((x) => x.id === id) || null;

  /* Daily culture tips (rotate by day). */
  D.tips = [
    'To get a Deaf person’s attention, wave within their line of sight or tap their shoulder gently.',
    'With an interpreter present, speak directly to the Deaf person — not to the interpreter.',
    'Facial expressions are part of FSL grammar. Practice your eyebrows as much as your hands.',
    'FSL varies by region. A different sign is often a regional variant, not a mistake.',
    'Sign names are usually given by Deaf community members. Fingerspell your name until then.',
    'Avoid "deaf-mute" and "pipi". Use "Deaf" or "hard of hearing" — or the term a person uses for themself.',
    'Under RA 11106, state hospitals and health facilities must provide FSL interpreters free of charge on request.',
    'Deaf Awareness Week in the Philippines runs from November 10 to 16 every year.',
    'Record practice clips with light in front of you, not behind you.',
    'Watch a signer’s face, not only their hands — fluent signers read the face.',
    'Never say "never mind" to a Deaf person. Rephrase, write or type instead.',
    'Learn FSL from Deaf teachers and Deaf-led programs whenever you can.',
    'If you must pass between two people signing, go through quickly — don’t linger.',
    'Caption your videos. RA 11106 requires videos published online to conform to Philippine web accessibility standards.',
  ];

  /* ---------- Observance date helpers ---------- */
  function lastFullWeekOfSeptember(year) {
    // Last Sunday of September, then the Monday six days earlier.
    const end = new Date(year, 8, 30);
    while (end.getDay() !== 0) end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start, end };
  }

  function rangeFor(o, year) {
    if (o.kind === 'last-full-week-september') return lastFullWeekOfSeptember(year);
    const start = new Date(year, o.month - 1, o.day);
    const end = new Date(year, o.month - 1, o.endDay || o.day);
    return { start, end };
  }

  /** Next (or current) occurrence of an observance relative to `today`. */
  D.nextOccurrence = (o, today = new Date()) => {
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let r = rangeFor(o, t.getFullYear());
    if (r.end < t) r = rangeFor(o, t.getFullYear() + 1);
    const ongoing = r.start <= t && t <= r.end;
    const days = ongoing ? 0 : Math.round((r.start - t) / 86400000);
    return { start: r.start, end: r.end, ongoing, days };
  };
})();
