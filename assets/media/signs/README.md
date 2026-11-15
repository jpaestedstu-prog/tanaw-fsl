# Validated whole-sign demonstrations would go here

This folder is empty on purpose. **This version of Tanaw shows no demonstrations of whole FSL signs** (`demonstrations: false` in `assets/js/core/config.js`). Learners learn the vocabulary from Deaf teachers. Tanaw never shows invented signs, and never borrows signs from other sign languages.

The manual alphabet and handshapes are shown separately, on the **experimental 3D hand** (`hand3d: true`), which is drawn in the browser and needs no files here. It is labeled as not validated by Deaf FSL experts. See `docs/3d-sign-animation.md` for what it shows, its limits, and what validating it would involve.

## Requirements for every whole-sign demonstration

- **Reference:** signed by a Deaf FSL signer, who gave written consent and named the region or variant. Keep the consent record with the project files, not in this folder.
- **The whole sign:** the face and body are included, because facial expressions are part of FSL grammar.
- **Validation:** accepted separately by at least two qualified Deaf FSL users, at least one of them a Deaf FSL teacher, following the protocol in `docs/3d-sign-animation.md`.
- **Region:** the region or community variant shown (for example Metro Manila or Cebu).

## Files

- **Format:** MP4 (H.264) or WebM, about 720p, no sound needed. Keep each clip short: 2–6 seconds, with a brief neutral pause before and after. A 3D animation rendered to video plays the same way.
- **Name:** the entry id from `assets/js/data/signs.js`.

| Entry | File name |
| --- | --- |
| Thank you / Salamat | `thank-you.mp4` |
| Number 3 | `number-3.mp4` |
| Older brother / Kuya | `older-brother.mp4` |

An optional poster image can use the same name, for example `thank-you.jpg`.

## Registering a demonstration

Copying a file into this folder is not enough. Each one must also be listed in `assets/js/data/media-manifest.js` with its provenance:

- `signer` and `signerIsDeaf`: the Deaf signer (or, for an animation, whose reference was animated);
- `description`: who made it, for example "3D animation by …, from …'s reference";
- `verifiedBy` and `verifierRole`: the Deaf FSL reviewers who approved it;
- `region` and `consent`.

When the first validated demonstrations are ready, set `demonstrations: true` in `assets/js/core/config.js`. The Contributor Studio (`#/studio`) then offers its media tools again, including a generator for `media-manifest.js`. Raise `CACHE_VERSION` in `sw.js` and re-run the checks in `tests/`.
