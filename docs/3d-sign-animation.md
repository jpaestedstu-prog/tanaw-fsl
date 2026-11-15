# The experimental 3D hand

*Tanaw project team, October 2026*

Tanaw includes an **experimental, hands-only 3D prototype**: a jointed hand drawn in the browser with WebGL that shows the manual alphabet, common handshapes, palm orientations and movement types. This document explains what it shows, how it was built, how it was checked, what it cannot do, and what would be needed before Tanaw could show whole FSL signs.

The prototype is **not validated by Deaf FSL experts**. Wherever it appears, Tanaw labels it *Experimental* and sends learners to Deaf teachers for the signs themselves. Tanaw is an academic project for *I.S. Innovation and New Technologies*; formal review by Deaf organizations was not part of its scope, and nothing in it is presented as an approved FSL resource.

## 1. What the prototype shows, and what it does not

| Shows | Count | Notes |
| --- | --- | --- |
| Letters of the one-handed manual alphabet | 25 | A–Z except **T**. J and Z include their movement |
| Handshapes signs are built from | 15 | 5, flat B, bent B, C, O, flat O, S, A, 1, L, V, Y, X, bent 5 (claw), 4 |
| Palm orientations | 5 | Out, in, up, down, sideways |
| Movement types | 6 | Straight, arc, circle, repeated, twist, hold |
| Fingerspelling of any typed word | — | Letters with no model (T, Ñ, NG, digits) are skipped with a note |

**Why T is missing.** FSL shares the one-handed manual alphabet with American Sign Language, except for the letter T, which FSL forms differently (VERA Files, 2015; Wikipedia, *Filipino Sign Language*). We found no reliable description of FSL's T, so the prototype leaves it out instead of guessing or borrowing the American form. Ñ and NG, which are letters of the Filipino alphabet, are left out for the same reason.

**What it cannot show.** A sign also has a **location** on or near the body and **non-manual signals** (face, eyes, mouth, head and body), which carry FSL grammar. A hands-only model has neither, so it cannot show whole FSL signs, and Tanaw does not try. The vocabulary (142 words and phrases) stays a list to learn with a Deaf teacher.

## 2. Where it appears

| Place | What the hand does |
| --- | --- |
| **Start page, second landing** (below the split screen) | Fingerspells MABUHAY when it comes into view, then any name a visitor types |
| **3D Hand Lab** (`#/lab`) | Alphabet, Spell, Handshapes, and Orientation & movement tabs; turn, reset, signer's view, left hand (mirror), x-ray, five styles, speed |
| **Practice → Fingerspelling** | Spells a word letter by letter at the learner's pace; a "Read the hand" drill asks for the word the hand spelled |
| **Read the Hand** game | Six letters and four short words to recognize; kept out of the daily challenge |
| **Lessons** | "How signs are built" (orientation and movement) and "Fingerspelling basics" (the alphabet) |
| **Letter pages** and the **Practice Mirror** | The letter in 3D; the mirror shows it from the signer's side |

Every view carries the *Experimental* badge and a note saying the prototype is not validated by Deaf FSL experts.

## 3. How it was built

- **Renderer.** A small WebGL 1 renderer written for Tanaw (`assets/js/components/hand3d.js`), with no 3D library or downloaded model, so it also works offline and from a folder. The hand is made of tapered capsules for the finger bones, a rounded palm and a forearm, lit with soft wrap lighting. It draws only while something changes.
- **Skeleton and poses.** Each pose is 21 joint angles: for each finger, the knuckle, middle and end joints plus sideways spread; for the thumb, two base angles, roll and two joint bends. Hand position and wrist rotation are stored separately. The poses are in `assets/js/data/hands.js`, each with a written description.
- **Thumb positions.** Where the thumb touches or crosses the fingers (A, E, M, N, O, S…), its angles were fitted during development with a small optimizer that searched for the closest pose that keeps the thumb clear of the fingers and palm. The fitted values are stored in `hands.js`.
- **Fingerspelling.** A word becomes a list of keyframes: move to each letter, hold it, slide sideways for a double letter, and play J and Z with their movement.
- **Loading.** The 3D files load only on pages that use them, and on the start page only as a visitor comes near the second landing. A hand starts only when it comes near the screen, and only after the page has been shown (its first contentful paint, with the fonts loaded), with "Preparing the 3D hand…" until then: the browser cannot show a frame while it sets up WebGL. Shaders compile in the background where the browser supports it (`KHR_parallel_shader_compile`). The context is released when the learner leaves the page.
- **Entry-level phones.** On devices that report little memory or few processor cores, or with the browser's data saver on, the hand draws fewer pixels and turns off antialiasing. If frames still turn out slow (under about 30 per second while the hand moves), the resolution steps down further while the page is open. The poses and models are the same at every level of detail.

## 4. How it was checked

- The team rendered every letter and handshape from the front, the side and the signer's own view, and compared each with written descriptions of the alphabet. Poses that did not match were corrected (for example the thumb of G, the closure of flat O, and the direction of J's hook).
- Automated tests (`tests/features.js`) check that each 3D view draws a hand, that spelling shows every letter in order (also with reduced motion), that turning works with the keyboard, that WebGL contexts are released after 18 page changes, that a hand starts only when it nears the screen, that a low-end device draws fewer pixels, and that every view falls back to text without WebGL.

**This is not validation.** The team is hearing, and no Deaf FSL user has reviewed the poses. Handshapes also vary between signers and regions.

## 5. Accessibility

- Every pose has a written description, shown beside the hand and given to screen readers as the canvas's label.
- The hand turns with the arrow keys (Home resets the view), as well as by dragging.
- With **reduced motion**, the hand steps from pose to pose instead of gliding, so every letter is still shown.
- Without WebGL, each stage says so, and the letters and descriptions still work.
- "Left hand" mirrors the hand for left-handed signers, and "Signer's view" shows it from behind, as the learner would see their own hand.

## 6. The research behind the hands-only scope

### Cueto and colleagues (De La Salle University, 2020)

The only published evaluation of 3D FSL animation we found. The team animated an Aesop's fable in Blender from a Deaf signer's reference video; five Deaf FSL signers, with 5–18 years of signing experience, rated it on a 6-point scale.

| Statement | Average (out of 6) |
| --- | --- |
| The animation is accurate. | 3.4 |
| The animation is natural looking. | 3.4 |
| I understand the performed signs. | 3.0 |
| The avatar is eye-catching and child friendly. | 3.2 |
| Layout of video is organized. | 3.6 |
| I would use this video as learning reference. | 5.2 |

Reported problems: wrong handshapes (a thumb not pointing; fingers fully folded instead of half bent), no facial expressions, rig limits, and differences between how schools sign. The handshapes in the signs they animated (5, 1, S, C, L, X, 4, flat O, bent 5) are among those in Tanaw's Handshapes tab.

### The World Federation of the Deaf and WASLI (2018)

Their joint statement on signing avatars cautions against avatars **replacing** human signers, accepts them for pre-recorded content only when Deaf people have advised on the signing, and asks that sign language work document the variants a community uses.

### What this means for Tanaw

The Deaf evaluators valued 3D material as a learning reference (5.2 of 6), but the whole animated signs scored low on accuracy and understanding even with a Deaf signer's reference, and the face was missing. Tanaw therefore keeps to **building blocks** (letters, handshapes, orientation, movement), where a hand alone is enough, labels them as experimental, and leaves whole signs to Deaf teachers.

## 7. Before the hand could be called validated

1. **Review.** At least two qualified Deaf FSL users, one of them a Deaf FSL teacher, check every letter, handshape and movement separately, for handshape, orientation, movement and naturalness, and say whether they would recognize it without a label.
2. **FSL's own letters.** T, Ñ and NG are modeled from their guidance.
3. **Variants.** Where signers in different regions form a letter differently, the variant is named.
4. **Pass rule and record.** Both reviewers accept each pose; reviewer names (or chosen names), roles and dates are recorded with the project files; the *Experimental* label is replaced by the review status.
5. **Feedback.** Learners and Deaf users can report a pose that looks wrong; reported poses are hidden until re-reviewed.

Compensate Deaf reviewers for their time, and credit them as they wish.

## 8. Toward whole signs

Whole signs need arms, body and a face, animated from a consenting Deaf signer's reference, and validation sign by sign by qualified Deaf FSL users (option A below). A pilot of 10–20 entries from one lesson, in one regional variant, would measure the effort.

| Option | Verdict |
| --- | --- |
| **A. Hand-keyframed 3D animation** from a Deaf signer's reference, reviewed by Deaf FSL users | Preferred next step, as a pilot |
| **B. Motion capture of a Deaf signer**, retargeted to an avatar | Possible later; the face is the hard part |
| **C. AI-generated or text-to-sign animation** | Rejected: it would produce signing no one has validated |
| **D. Videos of Deaf signers** | Supported by Tanaw's media pipeline (`demonstrations` switch) if ever chosen |

Validated whole-sign clips would be listed in `assets/js/data/media-manifest.js` with the signer, the reviewers, the region and the consent, and switched on with `demonstrations: true` in `assets/js/core/config.js`.

## 9. Switches

`assets/js/core/config.js`:

```js
T.config = Object.freeze({
  hand3d: true,          // the experimental 3D hand (start page's second landing, Lab, fingerspelling, lessons, letter pages, mirror, Read the Hand)
  stories: true,         // the Stories exhibit (documented history)
  demonstrations: false, // whole-sign demonstrations: only with validated media
});
```

Setting `hand3d: false` removes every 3D view; the pages fall back to their text versions.

## Sources

- Cueto, M., He, W., Untiveros, R., Zuñiga, J. and Rivera, J. P. (2020). *Translating an Aesop's Fable to Filipino Sign Language through 3D Animation.* Proceedings of the 9th Workshop on the Representation and Processing of Sign Languages, LREC 2020, pp. 39–44. <https://aclanthology.org/2020.signlang-1.7/>
- World Federation of the Deaf and World Association of Sign Language Interpreters (2018). *WFD and WASLI Statement on Use of Signing Avatars* (14 March 2018, updated 14 April 2018). <https://wfdeaf.org/wp-content/uploads/WFD-and-WASLI-Statement-on-Avatar-FINAL-14032018-Updated-14042018.pdf>
- VERA Files (2015). *Kinds of sign language in the Philippines.* <https://verafiles.org/articles/kinds-of-sign-language-in-the-philippines>
- Wikipedia. *Filipino Sign Language.* <https://en.wikipedia.org/wiki/Filipino_Sign_Language>
- Martinez, L. B. and Cabalfin, E. P. G. (2008). *Sign Language and Computing in a Developing Country: A Research Roadmap for the Next Two Decades in the Philippines.* PACLIC 22, pp. 438–444. <https://aclanthology.org/Y08-1046/>
