/* =========================================================================
   Tanaw — Everyday scenes
   Each scene gathers, for one ordinary situation in the Philippines:
     signs      vocabulary entry ids (signs.js) — shown with their media status,
                so a scene shows a sign only once a verified demonstration exists
     phrases    written Filipino/English phrases (phrases.js) — text, not signs
     etiquette  etiquette entry ids (culture.js)
     rights     RA 11106 section numbers (culture.js)
     lesson     related lesson id; game: related game id
   Scenes only reference existing content; they add no new facts about signs.
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.scenes = [
    {
      id: 'clinic', title: 'At the clinic', fil: 'Sa klinika', tone: 'teal', icon: 'hospital',
      summary: 'A check-up with an FSL interpreter: who to face, what to write, and what the law provides.',
      signs: ['doctor', 'nurse', 'hospital', 'medicine', 'pain', 'sick', 'help', 'interpreter'],
      phrases: ['need-interpreter', 'feel-sick', 'write-it', 'repeat'],
      etiquette: ['talk-direct', 'ask', 'patience'],
      rights: ['8'],
      lesson: 'interpreters', game: 'sightlines',
    },
    {
      id: 'store', title: 'At the sari-sari store', fil: 'Sa tindahan', tone: 'gold', icon: 'store',
      summary: 'Buying something small: prices, patience, and making yourself easy to see.',
      signs: ['store', 'money', 'how-much', 'thank-you', 'please', 'water', 'rice', 'yes', 'no'],
      phrases: ['how-much', 'write-it', 'thanks-patience'],
      etiquette: ['be-visible', 'patience', 'no-lipreading'],
      rights: [],
      lesson: 'daily-life', game: 'word-lens',
    },
    {
      id: 'commute', title: 'Riding the jeepney', fil: 'Sa dyip', tone: 'coral', icon: 'jeep',
      summary: 'Getting around town: asking the way and getting attention visually.',
      signs: ['jeepney', 'tricycle', 'where', 'exit', 'money', 'how-much'],
      phrases: ['para-po', 'where-ride', 'how-much'],
      etiquette: ['attention', 'no-shout'],
      rights: [],
      lesson: 'daily-life', game: 'sightlines',
    },
    {
      id: 'school', title: 'In the classroom', fil: 'Sa paaralan', tone: 'indigo', icon: 'school',
      summary: 'Learning side by side: eye contact, repetition, and FSL in Deaf education.',
      signs: ['school', 'teacher', 'classmate', 'study', 'book', 'understand', 'dont-understand', 'again', 'slow'],
      phrases: ['repeat', 'not-understood', 'face-me'],
      etiquette: ['eye-contact', 'patience', 'no-never-mind'],
      rights: ['4', '11'],
      lesson: 'etiquette', game: 'sightlines',
    },
    {
      id: 'home', title: 'With family', fil: 'Sa tahanan', tone: 'gold', icon: 'home',
      summary: 'Family words, and why it matters when a family learns FSL together.',
      signs: ['family', 'mother', 'father', 'older-brother', 'older-sister', 'sibling', 'grandmother', 'grandfather', 'child', 'baby'],
      phrases: ['learning-fsl', 'hearing-learner'],
      etiquette: ['ask', 'eye-contact'],
      rights: [],
      lesson: 'family', game: 'myth-fact',
    },
    {
      id: 'office', title: 'At a government office', fil: 'Sa tanggapan ng gobyerno', tone: 'indigo', icon: 'landmark',
      summary: 'Public transactions, waiting your turn, and asking for an interpreter.',
      signs: ['name', 'interpreter', 'please', 'thank-you', 'understand', 'again'],
      phrases: ['need-interpreter', 'one-moment', 'write-it'],
      etiquette: ['talk-direct', 'ask'],
      rights: ['3', '9', '7'],
      lesson: 'fsl-act', game: 'rights-match',
    },
    {
      id: 'emergency', title: 'When disaster strikes', fil: 'Kapag may sakuna', tone: 'coral', icon: 'alert',
      summary: 'Typhoons, floods and earthquakes: visual alerts, written updates and an emergency card.',
      signs: ['help', 'emergency', 'fire', 'earthquake', 'typhoon', 'flood', 'danger', 'safe', 'exit', 'police'],
      phrases: ['need-help', 'call-911', 'cannot-hear-sirens', 'where-exit'],
      etiquette: ['attention'],
      rights: ['10'],
      lesson: 'safety-health', game: 'myth-fact',
      tool: { href: '#/bridge?tab=emergency', label: 'Set up an Emergency Card', icon: 'alert' },
    },
  ];

  D.getScene = (id) => D.scenes.find((s) => s.id === id) || null;
})();
