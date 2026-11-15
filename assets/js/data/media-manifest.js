/* =========================================================================
   Tanaw — VERIFIED MEDIA MANIFEST

   This file is the single place where permanent, verified FSL demonstrations
   are registered for everyone who uses this copy of Tanaw.

   It ships EMPTY on purpose. The project team has not yet received
   demonstrations recorded by Deaf FSL signers and reviewed by qualified FSL
   educators, and Tanaw never shows invented or unverified signs.

   ------------------------------------------------------------------------
   HOW TO ADD A VERIFIED DEMONSTRATION
   ------------------------------------------------------------------------
   1. Get a clip recorded by a Deaf FSL signer (or a qualified FSL educator),
      reviewed by a qualified FSL educator or Deaf community reviewer, with the
      signer's consent for teaching use.
   2. Save the file in  assets/media/signs/  named after the entry id
      (ids are listed in assets/js/data/signs.js), e.g.  thank-you.mp4
   3. Add an entry below. Keys must match a sign id exactly.
      Tip: the Contributor Studio (#/studio) can generate these entries for you
      from clips you attached on your device.

   Supported fields
     type         'video' (default) or 'image'
     src          path relative to index.html                  (required)
     poster       optional still image shown before a video plays
     signer       name of the person signing                   (required)
     signerIsDeaf true if the signer is a Deaf FSL user
     verifiedBy   name of the reviewer                         (required)
     verifierRole role / organization of the reviewer
     region       region or community variant shown, e.g. 'Metro Manila'
     recorded     date recorded, 'YYYY-MM-DD'
     consent      short statement of the signer's consent
     license      usage terms, e.g. 'Used with permission for Tanaw'
     description  optional written description supplied by the verifier
     variants     optional array of { region, note } describing other variants

   Example (commented out — do not uncomment without a real verified clip):

   'thank-you': {
     type: 'video',
     src: 'assets/media/signs/thank-you.mp4',
     poster: 'assets/media/signs/thank-you.jpg',
     signer: 'Full name of Deaf signer',
     signerIsDeaf: true,
     verifiedBy: 'Full name of reviewer',
     verifierRole: 'FSL instructor, (organization)',
     region: 'Metro Manila',
     recorded: '2027-01-15',
     consent: 'Signer consented to teaching use on 2027-01-15',
     license: 'Used with permission for Tanaw',
     description: 'Written by the verifier.',
     variants: [{ region: 'Cebu', note: 'Described by the verifier.' }],
   },
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});
  const D = (T.data = T.data || {});

  D.mediaManifest = {
    // Verified entries go here.
  };
})();
