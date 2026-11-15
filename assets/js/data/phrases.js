/* =========================================================================
   Tanaw — Conversation Bridge quick phrases (written Filipino + English).
   These are TEXT phrases for showing on screen or speaking aloud with the
   device's text-to-speech. They are not sign language translations.
   Each phrase has a stable id so Everyday scenes can reference it.
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.phraseGroups = [
    {
      id: 'intro', label: 'Introductions',
      phrases: [
        { id: 'i-am-deaf', fil: 'Ako ay Deaf. Pakisulat o paki-type po ang inyong sasabihin.', en: 'I am Deaf. Please write or type what you want to say.' },
        { id: 'learning-fsl', fil: 'Nag-aaral ako ng FSL. Pakibagalan po ang pag-sign.', en: 'I am learning FSL. Please sign slowly.' },
        { id: 'hearing-learner', fil: 'Nakaririnig ako at nag-aaral ng FSL. Pasensya na sa mga pagkakamali ko.', en: 'I am hearing and learning FSL. Please excuse my mistakes.' },
      ],
    },
    {
      id: 'communication', label: 'Communication',
      phrases: [
        { id: 'repeat', fil: 'Pakiulit po.', en: 'Please repeat that.' },
        { id: 'not-understood', fil: 'Hindi ko po naintindihan.', en: 'I did not understand.' },
        { id: 'write-it', fil: 'Puwede po bang isulat ninyo?', en: 'Could you write it down?' },
        { id: 'face-me', fil: 'Pakiharap po sa akin kapag nagsasalita kayo.', en: 'Please face me when you speak.' },
        { id: 'need-interpreter', fil: 'Kailangan ko po ng FSL interpreter.', en: 'I need an FSL interpreter.' },
        { id: 'one-moment', fil: 'Sandali lang po.', en: 'One moment, please.' },
        { id: 'thanks-patience', fil: 'Salamat po sa pasensya.', en: 'Thank you for your patience.' },
      ],
    },
    {
      id: 'around', label: 'Getting around',
      phrases: [
        { id: 'where-restroom', fil: 'Saan po ang CR?', en: 'Where is the restroom?' },
        { id: 'how-much', fil: 'Magkano po ito?', en: 'How much is this?' },
        { id: 'para-po', fil: 'Para po.', en: 'Please stop here. (to the driver)' },
        { id: 'where-ride', fil: 'Saan po ang sakayan papunta rito?', en: 'Where do I get a ride to this place?' },
      ],
    },
    {
      id: 'emergency', label: 'Emergency',
      phrases: [
        { id: 'need-help', fil: 'Kailangan ko ng tulong.', en: 'I need help.' },
        { id: 'call-911', fil: 'Pakitawagan po ang 911.', en: 'Please call 911.' },
        { id: 'cannot-hear-sirens', fil: 'Ako ay Deaf. Hindi ko marinig ang mga anunsyo o sirena.', en: 'I am Deaf. I cannot hear announcements or sirens.' },
        { id: 'where-exit', fil: 'Saan po ang labasan?', en: 'Where is the exit?' },
        { id: 'feel-sick', fil: 'Masama po ang pakiramdam ko.', en: 'I feel sick.' },
      ],
    },
  ];

  D.getPhrase = (id) => {
    for (const g of D.phraseGroups) {
      const p = g.phrases.find((x) => x.id === id);
      if (p) return p;
    }
    return null;
  };
})();
