/* =========================================================================
   Tanaw — vocabulary entries (glosses only)

   IMPORTANT — CONTENT POLICY
   These entries list WHAT a learner will study: an English gloss, a Filipino
   gloss and a category. They intentionally contain NO descriptions of
   handshapes, movements or locations. Tanaw does not invent signs and does
   not borrow signs from other sign languages.

   How a sign is produced is shown ONLY through verified media registered in
   assets/js/data/media-manifest.js (or media a contributor loads on their own
   device through the Contributor Studio), and only while demonstrations are
   switched on in core/config.js. Otherwise entries are words to learn with a
   Deaf teacher.

   `note` fields hold cultural or language notes about the WORD — never
   instructions for signing.
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.categories = [
    { id: 'alphabet', label: 'Manual alphabet', fil: 'Alpabeto', icon: 'type', lesson: 'fingerspelling',
      blurb: 'Letters A–Z used to fingerspell names, places and new words.' },
    { id: 'numbers', label: 'Numbers', fil: 'Mga bilang', icon: 'hash', lesson: 'numbers',
      blurb: 'Counting from zero to ten.' },
    { id: 'greetings', label: 'Greetings & courtesy', fil: 'Pagbati at paggalang', icon: 'chat', lesson: 'greetings',
      blurb: 'Hellos, thanks, apologies and the words that keep a conversation going.' },
    { id: 'family', label: 'Family & people', fil: 'Pamilya at kapwa', icon: 'people', lesson: 'family',
      blurb: 'Relatives and the people around you — including Kuya and Ate.' },
    { id: 'daily', label: 'Everyday life', fil: 'Araw-araw na buhay', icon: 'home', lesson: 'daily-life',
      blurb: 'Home, school, food and getting around — from the sari-sari store to the jeepney.' },
    { id: 'time', label: 'Time & days', fil: 'Oras at mga araw', icon: 'clock', lesson: 'time',
      blurb: 'Today, tomorrow, parts of the day and the days of the week.' },
    { id: 'feelings', label: 'Feelings', fil: 'Damdamin', icon: 'heart', lesson: 'feelings-questions',
      blurb: 'Emotions and states — where facial expression matters most.' },
    { id: 'questions', label: 'Questions', fil: 'Mga tanong', icon: 'help', lesson: 'feelings-questions',
      blurb: 'Who, what, where, when, why, how — and how much.' },
    { id: 'safety', label: 'Safety & health', fil: 'Kaligtasan at kalusugan', icon: 'alert', lesson: 'safety-health',
      blurb: 'Words for emergencies, disasters and health care.' },
  ];

  D.customCategory = {
    id: 'custom', label: 'Added on this device', fil: 'Idinagdag dito', icon: 'sparkles', lesson: null,
    blurb: 'Vocabulary added on this device, or imported from a teacher’s class pack.',
  };

  const S = [];
  const add = (cat, rows) => rows.forEach(([id, en, fil, note]) => S.push({ id, en, fil, cat, note: note || '' }));

  // Manual alphabet — A to Z. Ñ and NG are discussed in the fingerspelling lesson:
  // they will be added once a verified FSL demonstration is available.
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch) => {
    S.push({ id: 'letter-' + ch.toLowerCase(), en: ch, fil: ch, cat: 'alphabet', letter: ch, note: '' });
  });

  // Numbers 0–10 (Filipino number words for reference).
  ['Sero', 'Isa', 'Dalawa', 'Tatlo', 'Apat', 'Lima', 'Anim', 'Pito', 'Walo', 'Siyam', 'Sampu'].forEach((fil, n) => {
    S.push({ id: 'number-' + n, en: String(n), fil, cat: 'numbers', number: n, note: '' });
  });

  add('greetings', [
    ['good-morning', 'Good morning', 'Magandang umaga'],
    ['good-afternoon', 'Good afternoon', 'Magandang hapon'],
    ['good-evening', 'Good evening', 'Magandang gabi'],
    ['how-are-you', 'How are you?', 'Kumusta?'],
    ['fine', 'Fine / Good', 'Mabuti'],
    ['thank-you', 'Thank you', 'Salamat'],
    ['you-are-welcome', 'You’re welcome', 'Walang anuman'],
    ['sorry', 'Sorry', 'Pasensya na / Paumanhin'],
    ['please', 'Please', 'Pakiusap'],
    ['excuse-me', 'Excuse me', 'Makikiraan po'],
    ['goodbye', 'Goodbye', 'Paalam'],
    ['see-you', 'See you again', 'Hanggang sa muli'],
    ['nice-to-meet-you', 'Nice to meet you', 'Ikinagagalak kitang makilala'],
    ['name', 'Name', 'Pangalan'],
    ['yes', 'Yes', 'Oo'],
    ['no', 'No', 'Hindi'],
    ['deaf', 'Deaf', 'Deaf', 'Many Deaf Filipinos identify as Deaf with a capital D. If you are unsure which word a person prefers, ask.'],
    ['hearing', 'Hearing (person)', 'Nakaririnig', 'In Deaf communities, "hearing" describes people who are not deaf.'],
    ['fsl', 'Filipino Sign Language (FSL)', 'Filipino Sign Language', 'FSL is the national sign language of the Filipino Deaf under Republic Act No. 11106.'],
    ['interpreter', 'Interpreter', 'Tagapagsalin / Interpreter', 'RA 11106 calls for qualified FSL interpreters in courts, and free interpreters on request in state hospitals.'],
    ['understand', 'I understand', 'Naiintindihan ko'],
    ['dont-understand', 'I don’t understand', 'Hindi ko naiintindihan'],
    ['again', 'Again / Repeat', 'Ulit'],
    ['slow', 'Slowly', 'Dahan-dahan'],
  ]);

  add('family', [
    ['family', 'Family', 'Pamilya'],
    ['mother', 'Mother', 'Nanay / Ina'],
    ['father', 'Father', 'Tatay / Ama'],
    ['older-brother', 'Older brother', 'Kuya', 'Kuya is also a respectful way to address an older man. Ask a Deaf teacher how FSL handles this kind of respect term.'],
    ['older-sister', 'Older sister', 'Ate', 'Ate is also a respectful way to address an older woman.'],
    ['sibling', 'Sibling', 'Kapatid'],
    ['grandmother', 'Grandmother', 'Lola'],
    ['grandfather', 'Grandfather', 'Lolo'],
    ['child', 'Child (son or daughter)', 'Anak'],
    ['baby', 'Baby', 'Sanggol'],
    ['friend', 'Friend', 'Kaibigan'],
    ['teacher', 'Teacher', 'Guro'],
    ['classmate', 'Classmate', 'Kaklase'],
    ['neighbor', 'Neighbor', 'Kapitbahay'],
  ]);

  add('daily', [
    ['house', 'House / Home', 'Bahay'],
    ['school', 'School', 'Paaralan'],
    ['church', 'Church', 'Simbahan'],
    ['market', 'Market', 'Palengke'],
    ['store', 'Sari-sari store', 'Tindahan', 'The neighborhood sari-sari store is part of daily life across the Philippines.'],
    ['jeepney', 'Jeepney', 'Dyip', 'An icon of Philippine public transport.'],
    ['tricycle', 'Tricycle', 'Traysikel'],
    ['eat', 'Eat', 'Kumain'],
    ['drink', 'Drink', 'Uminom'],
    ['water', 'Water', 'Tubig'],
    ['rice', 'Rice (cooked)', 'Kanin'],
    ['sleep', 'Sleep', 'Matulog'],
    ['work', 'Work', 'Trabaho'],
    ['study', 'Study', 'Mag-aral'],
    ['book', 'Book', 'Aklat / Libro'],
    ['money', 'Money', 'Pera'],
    ['restroom', 'Restroom', 'Banyo / CR', 'In the Philippines the restroom is often called the CR (comfort room).'],
  ]);

  add('time', [
    ['today', 'Today', 'Ngayon'],
    ['tomorrow', 'Tomorrow', 'Bukas'],
    ['yesterday', 'Yesterday', 'Kahapon'],
    ['morning', 'Morning', 'Umaga'],
    ['afternoon', 'Afternoon', 'Hapon'],
    ['night', 'Night', 'Gabi'],
    ['monday', 'Monday', 'Lunes'],
    ['tuesday', 'Tuesday', 'Martes'],
    ['wednesday', 'Wednesday', 'Miyerkoles'],
    ['thursday', 'Thursday', 'Huwebes'],
    ['friday', 'Friday', 'Biyernes'],
    ['saturday', 'Saturday', 'Sabado'],
    ['sunday', 'Sunday', 'Linggo', 'In Filipino, Linggo means both "Sunday" and "week". Do not assume FSL uses one sign for both — check each with a verified source.'],
    ['week', 'Week', 'Linggo', 'In Filipino, Linggo means both "week" and "Sunday". Do not assume FSL uses one sign for both — check each with a verified source.'],
    ['month', 'Month', 'Buwan'],
    ['year', 'Year', 'Taon'],
    ['time', 'Time', 'Oras'],
  ]);

  add('feelings', [
    ['happy', 'Happy', 'Masaya'],
    ['sad', 'Sad', 'Malungkot'],
    ['angry', 'Angry', 'Galit'],
    ['tired', 'Tired', 'Pagod'],
    ['scared', 'Scared', 'Takot'],
    ['love', 'Love', 'Mahal'],
    ['like', 'Like / Want', 'Gusto'],
    ['hungry', 'Hungry', 'Gutom'],
    ['sick', 'Sick', 'May sakit'],
    ['excited', 'Excited', 'Nasasabik'],
  ]);

  add('questions', [
    ['who', 'Who?', 'Sino?'],
    ['what', 'What?', 'Ano?'],
    ['where', 'Where?', 'Saan?'],
    ['when', 'When?', 'Kailan?'],
    ['why', 'Why?', 'Bakit?'],
    ['how', 'How?', 'Paano?'],
    ['how-much', 'How much?', 'Magkano?'],
    ['which', 'Which?', 'Alin?'],
  ]);

  add('safety', [
    ['help', 'Help', 'Tulong'],
    ['emergency', 'Emergency', 'Emerhensiya', 'The national emergency hotline in the Philippines is 911.'],
    ['doctor', 'Doctor', 'Doktor'],
    ['nurse', 'Nurse', 'Nars'],
    ['hospital', 'Hospital', 'Ospital', 'Under RA 11106, state hospitals provide FSL interpreters free of charge on request.'],
    ['medicine', 'Medicine', 'Gamot'],
    ['pain', 'Pain / It hurts', 'Masakit'],
    ['police', 'Police', 'Pulis'],
    ['fire', 'Fire', 'Sunog'],
    ['earthquake', 'Earthquake', 'Lindol', 'Emergency alerts must reach Deaf people visually and in FSL.'],
    ['typhoon', 'Typhoon', 'Bagyo', 'Emergency alerts must reach Deaf people visually and in FSL.'],
    ['flood', 'Flood', 'Baha'],
    ['danger', 'Danger', 'Panganib'],
    ['safe', 'Safe', 'Ligtas'],
    ['exit', 'Exit', 'Labasan'],
  ]);

  D.signs = S;

  /* ---------- Lookup helpers (built-in + custom entries) ---------- */
  function customSigns() {
    const list = (T.store && T.store.state && Array.isArray(T.store.state.custom)) ? T.store.state.custom : [];
    return list
      .filter((c) => c && typeof c.id === 'string' && typeof c.en === 'string')
      .map((c) => ({ id: c.id, en: c.en, fil: c.fil || '', cat: 'custom', note: c.note || '', custom: true, baseCat: c.baseCat || '' }));
  }

  D.allSigns = () => S.concat(customSigns());
  D.getSign = (id) => D.allSigns().find((s) => s.id === id) || null;
  D.signsIn = (catId) => D.allSigns().filter((s) => s.cat === catId);
  D.category = (catId) => D.categories.find((c) => c.id === catId) || (catId === 'custom' ? D.customCategory : null);
  D.allCategories = () => (customSigns().length ? D.categories.concat([D.customCategory]) : D.categories.slice());
})();
