# Stories: documented history now, Deaf storytellers later

## What the Stories exhibit holds in this version

The **Stories** exhibit (`#/community/stories`) retells six documented moments from Filipino Deaf history, from the first school for the Deaf (1907) to FSL on Philippine screens (2020). Each story is a few short chapters, and **every chapter names its source** from the list in `assets/js/data/culture.js` (shown on Connect → Sources). They are histories drawn from published records, not personal testimonies, and nothing in them is written on behalf of a Deaf person.

They live in `assets/js/data/stories.js` (`D.storyList`). Each entry has:

| Field | What it is |
| --- | --- |
| `id`, `title`, `fil`, `era`, `tone`, `icon`, `summary` | How the story appears on its card |
| `chapters` | `{ kicker, title, text, src }`, where `src` is a source id from `culture.js` |
| `check` | One question at the end: `{ prompt, options, answer, explain }` (`answer` is the index of the correct option) |
| `reflect` | A reflection prompt; learners can save their answer to their private journal |

To add a documented story, write it only from published sources, give every chapter a `src`, and raise `CACHE_VERSION` in `sw.js`.

## This folder: for stories told by Deaf Filipinos

This folder is empty on purpose. It is reserved for **stories told by Deaf Filipinos themselves, in FSL**, which this version does not include. The Tanaw team does not write, imagine or retell Deaf people's personal stories. Adding them would need a story player built with the storytellers, and every step below. The process is a proposal, to be finalized with Deaf partners.

1. **The storyteller leads.** A Deaf storyteller decides what to share, how to tell it in FSL, and how they are named: a full name, a chosen name, or "Anonymous".
2. **Informed consent, explained in FSL.** Consent is recorded in writing: where the story appears, for how long, and how it may be used. Keep the consent record with the project files, not in this folder.
3. **Deaf-led review.** A Deaf reviewer checks the video, captions and transcript with the storyteller.
4. **Accessible by default.** Every story has FSL video, captions and a written transcript.
5. **The right to change or withdraw.** If a storyteller asks, edit or remove the story right away, and raise `CACHE_VERSION` in `sw.js` so installed copies drop it.

Suggested files: FSL video as MP4 (H.264) or WebM at about 720p, a WebVTT captions file, and an optional poster image, all named after the story id. Ask the storyteller before showing anyone else who appears in the background, or blur them.
