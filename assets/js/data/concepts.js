/* =========================================================================
   Tanaw — concept flashcards for spaced repetition
   Facts about FSL, Deaf culture and rights (no sign descriptions).
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.concepts = [
    { id: 'fsl-def', q: 'What is Filipino Sign Language (FSL)?', a: 'The visual, natural language of the Filipino Deaf community, with its own vocabulary and grammar.', lesson: 'what-is-fsl' },
    { id: 'ra-number', q: 'Which law declared FSL the national sign language of the Filipino Deaf?', a: 'Republic Act No. 11106, the Filipino Sign Language Act, approved on October 30, 2018.', lesson: 'what-is-fsl' },
    { id: 'ra-official', q: 'Besides being the national sign language of the Filipino Deaf, what else does RA 11106 make FSL?', a: 'The official sign language of government in all transactions involving the Deaf.', lesson: 'what-is-fsl' },
    { id: 'ra-media', q: 'Under RA 11106, what must TV news and public affairs programs provide?', a: 'FSL interpreter insets.', lesson: 'fsl-act' },
    { id: 'ra-kwf', q: 'Which agency sets national standards and accreditation for FSL interpreting?', a: 'The Komisyon sa Wikang Filipino (KWF), with the Deaf community and other stakeholders.', lesson: 'fsl-act' },
    { id: 'ra-health', q: 'What does RA 11106 provide for Deaf patients in state hospitals?', a: 'Free FSL interpreters and accessible materials, upon request.', lesson: 'fsl-act' },
    { id: 'ra-justice', q: 'Under RA 11106, where must qualified interpreters be available for Deaf people in the justice system?', a: 'In proceedings involving Deaf people — including police stations and the Katarungang Pambarangay.', lesson: 'fsl-act' },
    { id: 'ra-choice', q: 'Does RA 11106 force Deaf people to use FSL?', a: 'No. It promotes FSL without prejudice to other forms of communication a person chooses.', lesson: 'fsl-act' },
    { id: 'universal', q: 'Is sign language universal?', a: 'No. Deaf communities have their own sign languages. FSL is distinct — and it has regional variation.', lesson: 'what-is-fsl' },
    { id: 'fsl-sources', q: 'What do linguists say today’s FSL vocabulary includes?', a: 'Traditional and regional Filipino signs, signs borrowed from ASL (often changed), and some signs from manually coded English.', lesson: 'what-is-fsl' },
    { id: 'variation', q: 'A Deaf signer uses a different sign from the one you learned. What is the likely reason?', a: 'Regional or community variation — FSL varies across the Philippines. Ask, observe and adapt.', lesson: 'greetings' },
    { id: 'five-params', q: 'Name the five parameters of a sign.', a: 'Handshape, palm orientation, location, movement and non-manual signals.', lesson: 'sign-parameters' },
    { id: 'nms', q: 'What are non-manual signals?', a: 'Facial expressions, mouth shapes, eye gaze, and head and body movements that carry meaning and grammar.', lesson: 'faces-and-space' },
    { id: 'minimal-pair', q: 'What is a minimal pair in sign language?', a: 'Two signs that differ in only one parameter but have different meanings.', lesson: 'sign-parameters' },
    { id: 'signing-space', q: 'What is the signing space?', a: 'The area in front of the signer’s body — roughly head to waist, a little wider than the shoulders — where most signs are made.', lesson: 'faces-and-space' },
    { id: 'where-look', q: 'When watching someone sign, where do fluent signers mainly look?', a: 'At the face, taking in the hands with peripheral vision.', lesson: 'faces-and-space' },
    { id: 'attention', q: 'Name three polite ways to get a Deaf person’s attention.', a: 'Wave in their line of sight, tap their shoulder gently, or flick the lights / tap the table.', lesson: 'etiquette' },
    { id: 'interpreter-address', q: 'With an interpreter present, whom do you speak to?', a: 'The Deaf person — speak to them directly, not to the interpreter.', lesson: 'etiquette' },
    { id: 'lipreading', q: 'Can most Deaf people lipread perfectly?', a: 'No. Many sounds look alike on the lips. Ask how the person prefers to communicate.', lesson: 'etiquette' },
    { id: 'terms', q: 'Why avoid terms like "deaf-mute", "deaf and dumb" or "pipi"?', a: 'They suggest Deaf people have no voice or language. Use "Deaf" or "hard of hearing" — or the term the person uses.', lesson: 'deaf-culture' },
    { id: 'big-d', q: 'What is the difference between "deaf" and "Deaf"?', a: '"deaf" often describes not hearing; "Deaf" refers to cultural and linguistic identity in the Deaf community.', lesson: 'deaf-culture' },
    { id: 'sign-names', q: 'Who usually gives a learner a sign name?', a: 'Deaf community members who know the learner. Until then, fingerspell your name.', lesson: 'deaf-culture' },
    { id: 'fingerspelling-use', q: 'When is fingerspelling typically used?', a: 'For names, places, brand names and words without a common sign.', lesson: 'fingerspelling' },
    { id: 'filipino-alphabet', q: 'How many letters does the modern Filipino alphabet have?', a: '28 — the letters A to Z plus Ñ and NG.', lesson: 'fingerspelling' },
    { id: 'daw', q: 'When is Deaf Awareness Week in the Philippines?', a: 'November 10–16 every year (Proclamation No. 829, s. 1991).', lesson: 'time' },
    { id: 'idsl', q: 'When is the International Day of Sign Languages?', a: 'September 23.', lesson: 'practice-setup' },
    { id: 'psd', q: 'Which school, founded in Manila in 1907, began formal Deaf education in the Philippines?', a: 'The School for the Deaf and Blind — today the Philippine School for the Deaf.', lesson: 'what-is-fsl' },
    { id: 'pfd', q: 'Name a national organization of Deaf Filipinos.', a: 'The Philippine Federation of the Deaf (PFD).', lesson: 'deaf-culture' },
    { id: 'pnasli', q: 'What does PNASLI stand for?', a: 'Philippine National Association of Sign Language Interpreters.', lesson: 'interpreters' },
    { id: 'lighting', q: 'What is the best lighting for signing practice videos?', a: 'Light in front of you, on your face and hands. Avoid a bright window behind you.', lesson: 'practice-setup' },
    { id: 'emergency', q: 'What makes emergency information accessible to Deaf people?', a: 'Visual alerts, text-based updates and FSL interpretation of announcements.', lesson: 'safety-health' },
    { id: 'hotline', q: 'What is the national emergency hotline in the Philippines?', a: '911.', lesson: 'safety-health' },
    { id: 'nothing-about-us', q: 'What does "Nothing about us without us" mean?', a: 'Decisions about Deaf people should include Deaf people. Allies amplify Deaf voices instead of speaking for them.', lesson: 'allyship' },
  ];
})();
