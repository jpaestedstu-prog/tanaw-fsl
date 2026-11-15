/* =========================================================================
   Tanaw — feature configuration

   hand3d
     The experimental 3D hand: the 3D Hand Lab, 3D fingerspelling, the Read
     the Hand game and the 3D panels on letters and lessons.
     It models the one-handed manual alphabet that FSL shares with ASL (not
     FSL's T), named handshapes, palm orientation and movement. It has not
     been validated by Deaf FSL experts and is always labeled Experimental.

   stories
     The Stories exhibit: documented moments from Filipino Deaf history, told
     in chapters and drawn only from published sources (data/stories.js).
     It contains no invented or personal testimonies.

   demonstrations
     Verified sign demonstrations from media files with a provenance record
     (assets/js/data/media-manifest.js). OFF: none have been recorded and
     verified. While off, vocabulary entries are words to learn with a Deaf
     teacher, and media-only features (media frames, recognition quizzes on
     media, the Contributor Studio's media tools) stay hidden.
   ========================================================================= */
(function () {
  'use strict';

  const T = (window.Tanaw = window.Tanaw || {});

  T.config = Object.freeze({
    hand3d: true,
    stories: true,
    demonstrations: false,
  });
})();
