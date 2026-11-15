/* =========================================================================
   Tanaw — Stories (Kuwento): documented moments from Filipino Deaf history

   Each story is told in short chapters, and every chapter names its source
   (ids from D.sources in culture.js). These are histories drawn from
   published records — the PFD's own history, the text of RA 11106, research
   and news reports. None of them is a personal testimony, and nothing here
   is written on behalf of a Deaf person.

   Personal stories told by Deaf Filipinos would need informed consent and
   their own review process (see assets/media/stories/README.md).
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.storyList = [
    {
      id: 'first-school', title: 'A school by the bay', fil: 'Ang unang paaralan', era: '1907–1963', tone: 'indigo', icon: 'school',
      summary: 'How formal Deaf education began in Manila — and how one school became two.',
      chapters: [
        { kicker: '1907', title: 'A school opens in Manila', src: 'psd',
          text: 'In 1907, American educator Delight Rice founded the School for the Deaf and Blind in Manila. It is known today as the Philippine School for the Deaf.' },
        { kicker: 'A lasting influence', title: 'Two sign languages meet', src: 'wiki-fsl',
          text: 'Since the school’s founding, Filipino Sign Language has been strongly influenced by American Sign Language. Researchers still describe FSL as its own language, with its own handshapes, ways of forming signs and grammar.' },
        { kicker: '1963', title: 'One school becomes two', src: 'psd',
          text: 'In 1963, the School for the Deaf and Blind was separated into two institutions: one for the Deaf and one for the blind.' },
      ],
      check: {
        prompt: 'Who founded the School for the Deaf and Blind in 1907?',
        options: ['Delight Rice', 'Pedro Santos', 'Liza Martinez'], answer: 0,
        explain: 'American educator Delight Rice founded the school in Manila. It is known today as the Philippine School for the Deaf.',
      },
      reflect: 'What might it have meant for Deaf children to have a school of their own?',
    },
    {
      id: 'pedro-santos', title: 'Pedro Santos and the first Deaf association', fil: 'Si Pedro Santos', era: '1926–1990', tone: 'gold', icon: 'people',
      summary: 'A Deaf Filipino teacher founds an association of Deaf people that serves the community for decades.',
      chapters: [
        { kicker: 'A pioneer', title: 'Study abroad, then teach at home', src: 'pfd-history',
          text: 'Pedro Santos, a Deaf Filipino, was the first Deaf Filipino sent by the Philippine government to study abroad, at Gallaudet College. He was also the first Deaf teacher to teach in the Philippines.' },
        { kicker: '1926', title: 'An association of Deaf people', src: 'pfd-history',
          text: 'In 1926, Pedro Santos established the Philippine Association of the Deaf: a civic and charitable organization of Deaf people living in the Philippines, regardless of nationality, creed or religion.' },
        { kicker: '1926–1989', title: 'Serving the community', src: 'pfd-history',
          text: 'For decades the association worked on educational and vocational opportunities for Deaf people, including the School for the Deaf and the Luneta Park Coffee Shop, and set standards for interpreters. It also helped teach Filipino Sign Language — then called Philippine Sign Language — to United States Peace Corps volunteers in the Philippines.' },
        { kicker: '1990', title: 'A question from abroad', src: 'pfd-history',
          text: 'In 1990, the World Federation of the Deaf asked about the association. The answer: it was close to dissolving because of financial problems. A new chapter was about to begin.' },
      ],
      check: {
        prompt: 'Where did Pedro Santos study abroad?',
        options: ['Gallaudet College', 'The University of the Philippines', 'The School for the Deaf and Blind'], answer: 0,
        explain: 'He was the first Deaf Filipino sent by the Philippine government to study abroad, at Gallaudet College.',
      },
      reflect: 'Why might it matter that the first association was organized by Deaf people themselves?',
    },
    {
      id: 'seventeen-leaders', title: 'Seventeen leaders', fil: 'Labimpitong pinuno', era: '1990–1997', tone: 'teal', icon: 'weave',
      summary: 'Deaf leaders from across the country come together to found the Philippine Federation of the Deaf.',
      chapters: [
        { kicker: 'From 1990', title: 'Rebuilding together', src: 'pfd-history',
          text: 'Deaf community members from different regions worked with the former president of the Macau Deaf Association and the World Federation of the Deaf to reestablish an organization to serve Deaf Filipinos.' },
        { kicker: 'October 19, 1996', title: 'A federation is born', src: 'pfd-history',
          text: 'At a meeting at the Philippine School for the Deaf, seventeen leaders of Deaf organizations from around the country established the Philippine Federation of the Deaf (PFD).' },
        { kicker: 'May 19, 1997', title: 'One hundred leaders, fifteen regions', src: 'pfd-history',
          text: 'At its first General Assembly at the Ateneo de Manila University, attended by 100 Deaf leaders and representatives from 15 regions, the PFD was formally recognized and elected an eleven-member Executive Board of Deaf persons. On June 26, 1997, it registered with the Securities and Exchange Commission.' },
        { kicker: 'Today', title: 'A national voice', src: 'pfd',
          text: 'The PFD works to represent Deaf Filipinos, preserve Filipino Sign Language and promote Deaf identity.' },
      ],
      check: {
        prompt: 'How many Deaf leaders established the PFD in October 1996?',
        options: ['Seventeen', 'One hundred', 'Eleven'], answer: 0,
        explain: 'Seventeen leaders established it on October 19, 1996. One hundred leaders attended the first General Assembly in 1997, which elected an eleven-member board.',
      },
      reflect: 'What could a national federation do that a single local group cannot?',
    },
    {
      id: 'studying-fsl', title: 'Studying FSL as it is used', fil: 'Pag-aaral ng FSL', era: '1970s–2007', tone: 'indigo', icon: 'book',
      summary: 'From rulebooks written abroad to research that describes how Filipino Deaf people actually sign.',
      chapters: [
        { kicker: '1970s–80s', title: 'Books from abroad', src: 'martinez2008',
          text: 'Sign language books of this period, by North American writers, drew largely on American Sign Language and artificial sign systems. They prescribed how to sign rather than describing how Filipino Deaf people signed.' },
        { kicker: 'Early 1990s', title: 'Describing FSL', src: 'martinez2008',
          text: 'Linguist Liza Martinez began the first descriptive research on Filipino Sign Language, studying its structure and its sociolinguistics.' },
        { kicker: '2004', title: 'A reference for FSL', src: 'martinez2008',
          text: 'The Philippine Deaf Resource Center and the PFD published “An Introduction to Filipino Sign Language”, described in 2008 as the most comprehensive linguistics reference on FSL.' },
        { kicker: '2005 and 2007', title: 'Signs from many regions', src: 'pfd-2007',
          text: 'The PFD published a two-part compilation of signs from regions of the Philippines, documenting how FSL varies across the country.' },
      ],
      check: {
        prompt: 'What did the FSL research of the early 1990s do differently from the books of the 1970s and 80s?',
        options: ['It described how Filipino Deaf people actually sign', 'It translated American books into Filipino', 'It created new signs for schools'], answer: 0,
        explain: 'Earlier books prescribed signing based on ASL and artificial systems; the new research described FSL as it is used.',
      },
      reflect: 'Why is it important to describe a language as people really use it?',
    },
    {
      id: 'fsl-act', title: 'A law in FSL’s name', fil: 'Batas para sa FSL', era: '2018–2021', tone: 'coral', icon: 'scale',
      summary: 'How Filipino Sign Language became the national sign language of the Filipino Deaf.',
      chapters: [
        { kicker: 'August–September 2018', title: 'Through both houses', src: 'ra11106-lawphil',
          text: 'The Filipino Sign Language Act was passed by the Senate as Senate Bill No. 1455 on August 28, 2018, and adopted by the House of Representatives as an amendment to House Bill No. 7503 on September 10, 2018.' },
        { kicker: 'October 30, 2018', title: 'Republic Act No. 11106', src: 'ra11106-gazette',
          text: 'The act was approved on October 30, 2018. It declares FSL the national sign language of the Filipino Deaf, and the medium of official communication in transactions involving the Deaf — without taking away a person’s choice of other ways to communicate.' },
        { kicker: 'What it covers', title: 'From classrooms to TV news', src: 'ra11106-lawphil',
          text: 'The law reaches schools, interpreting standards, courts, government workplaces, health care, public services and broadcast media. Explore each part in the Rights exhibit.' },
        { kicker: 'December 6, 2021', title: 'Rules for the law', src: 'irr',
          text: 'The law’s Implementing Rules and Regulations, led by the Komisyon sa Wikang Filipino with the Deaf community and other stakeholders, are dated December 6, 2021.' },
      ],
      check: {
        prompt: 'When was the FSL Act approved?',
        options: ['October 30, 2018', 'November 10, 1991', 'September 23, 2018'], answer: 0,
        explain: 'RA 11106 was approved on October 30, 2018. November 10 starts Deaf Awareness Week, and September 23 is the International Day of Sign Languages.',
      },
      reflect: 'Where in your own community could the FSL Act make a difference?',
    },
    {
      id: 'on-screen', title: 'On screen', fil: 'Sa telebisyon', era: '2020', tone: 'teal', icon: 'tv',
      summary: 'Interpreter insets on the news, the jokes they drew, and the call to learn FSL instead.',
      chapters: [
        { kicker: 'Section 10', title: 'Interpreters on the news', src: 'ra11106-lawphil',
          text: 'The FSL Act requires FSL interpreter insets in news and public affairs programs, so Deaf viewers can follow the news in their language.' },
        { kicker: 'April 2020', title: 'Mocked online', src: 'abs-cbn',
          text: 'During televised updates in 2020, some people shared memes mocking the interpreter insets, joking that the interpreters were “doing TikTok”.' },
        { kicker: 'The response', title: 'Learn FSL instead', src: 'abs-cbn',
          text: 'The Philippine National Association of Sign Language Interpreters called the memes disappointing and asked the public to learn FSL and Deaf culture. Interpreters explained that Deaf viewers depend on sign language to understand the news.' },
        { kicker: 'A call for respect', title: 'Stop the ridicule', src: 'inquirer-chr',
          text: 'The Commission on Human Rights asked people to stop ridiculing sign language interpreters on television.' },
      ],
      check: {
        prompt: 'Why do interpreter insets matter on TV news?',
        options: ['Many Deaf viewers depend on sign language to follow the news', 'They make broadcasts shorter', 'They replace captions completely'], answer: 0,
        explain: 'Interpreters pointed out that Deaf viewers depend on sign language to understand the news; captions alone do not serve everyone.',
      },
      reflect: 'What will you do the next time you see sign language mocked online?',
    },
  ];

  D.getStory = (id) => D.storyList.find((s) => s.id === id) || null;
})();
