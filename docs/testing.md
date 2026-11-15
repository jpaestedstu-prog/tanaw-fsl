# Testing Tanaw

*Last full run: 2 November 2026, on Windows 11: Google Chrome 156 for everything, Microsoft Edge 156 for the landing, account and console checks, and Firefox 132 and WebKit 18.2 (Safari's engine) through Playwright. The scripts are in `tests/` (see `tests/README.md`). In the suites that reach the 3D hand, WebGL is provided by SwiftShader, Chrome's software renderer, so the 3D views are tested without a graphics card.*

Automated checks prove that pages load, work with a keyboard and pass the rules a machine can check. They cannot tell us whether Tanaw is clear, respectful and useful for Deaf people and learners, or whether the 3D hand looks right to Deaf FSL users. Sections 2–5 are the plans for that part, which needs people.

## 1. Automated results

| Check | Result |
| --- | --- |
| JavaScript syntax (all 84 files: the site and these tests) | All pass |
| **Smoke test** (`smoke.js`): 68 routes, including two not-found pages, at 1366, 820, 390 and 320 px wide, plus 1024 and 390 px at 150% text | No console errors or warnings, no failed loads, no sideways scrolling, exactly one `h1` per page |
| **Other sizes and spacing** (`reflow.js`): the same routes at a window at 200% zoom (640 px), 768, 1024×600, 1920, 2560, a phone on its side, relaxed spacing, and WCAG's text-spacing test | 10 / 10 pass: no sideways scrolling, no text cut off, no words broken in the middle except long web addresses, which have nowhere else to break |
| **The landings** (`landing.js`) | 76 / 76 pass: the split screen comes first, the 3D landing right after it, one `h1`; the 3D hand loads only as a visitor nears it and greets only once it can be seen, and nothing moves when it does; and the split screen itself: the concept, the words clear of the art, the lean, the beads and their cards, sightlines, dragging the eye, entering, keyboard order, the intro, reduced motion, large text, high contrast, twelve window sizes |
| **Accounts** (`accounts.js`) | 87 / 87 pass: validation, password visibility and rules, loading and result states, lockout and its countdown, session expiry and tampering, other tabs, per-account progress, open redirects, markup in names, closed registration, a browser without Web Crypto, a browser that blocks storage, phones |
| **The console** (`admin.js`) | 146 / 146 pass: a separate page, first-time setup, the gate and who it refuses, keyboard order, every section's features, its numbers against the site's data, the review ledger, CSV safety, site controls seen live in another tab, backup and restore, phones, 150% text, and axe-core on every section and state in the paper, night and high-contrast looks |
| **Interaction flows** (`flows.js`) | 42 / 42 pass: both landings' links and every feature card, all six non-3D games to a perfect score with the keyboard (and by swiping), lessons, exhibits, Stories, scenes, achievements, redirects, motion settings, SVG rejection |
| **This build's content** (`nodemos.js`) | 29 / 29 pass: no page mentions placeholders, "awaiting verification" or locked sign features; word cards, "I can sign this", Vocabulary filter, mirror, fingerspelling, quiz, review, class vocabulary (pack import brings words only), the About page's 3D section and status table, Stories |
| **3D hand, Stories, search** (`features.js`) | 62 / 62 pass, in four runs: **with WebGL** (Lab letters, keyboard turning, spelling every letter in order, gap notes, handshapes, demonstrations, settings; fingerspelling and its drill; all ten rounds of *Read the Hand*; the two lessons' 3D steps; letter pages; the mirror; the second landing's greeting and "Fingerspell your name"; that a hand far below the screen waits; search by keyboard and button, including Stories loaded on demand; the 3D note's link to the About page; Stories from the hub to the journal; WebGL contexts released after 18 page changes), **with reduced motion** (every letter still shown), **on devices reporting little memory or few cores** (fewer pixels, no smoothing) and **without WebGL** (every 3D view falls back to text) |
| **Everything else** (`sweep.js`) | 95 / 95 pass: the camera mirror and recording, with Chrome's fake camera, and its error messages; the Conversation Bridge, with stand-ins for speech; your data (export, import, reset); every display setting; a quiz, a review and a lesson from start to finish; damaged saved data, full storage, a file that will not load, 27 odd or hostile links; printing; Windows' contrast themes; no JavaScript; fast navigation, back and forward; keyboard focus never hidden behind a bar on 8 pages at 2 sizes |
| **Firefox and WebKit** (`browsers.js`) | 49 / 49 pass in each: 68 routes at three sizes, both landings, accounts, the console, the 3D hand, the tools, offline with the server really stopped, opened from the folder |
| **Microsoft Edge** | The landings 76 / 76, accounts 87 / 87, the console 146 / 146 |
| **axe-core 4.10** (WCAG 2.0, 2.1 and 2.2 A and AA, plus best practices) | **0 violations** on 67 routes in light, dark, light high-contrast and dark high-contrast themes at desktop size, and at phone size; 0 in 35 temporary states (dialogs, search with and without results, game feedback, results, lesson questions, the 3D views in use, a card on the seam, the second landing's hand, the account forms with errors and in their result states, and others) in light and dark |
| **Focus rings** (`focusring.js`) | All 6,112 focus rings on 27 pages in four themes, and on the console's first-time setup and six sections in its four looks, have at least 3:1 contrast with the rendered pixels around them (measured from screenshots, so gradients and layered backgrounds count; rings drawn inside an element, as on the 3D stage, are measured against the pixels inside) |
| **Offline** (`offline.js`, local HTTP server) | Service worker caches all 98 entries on its list; with the network off, never-visited pages (including the 3D Lab, fingerspelling, *Read the Hand*, a story, login and registration), a full reload, both landings with the hand, `admin.html`, all three fonts and the landing's materials work |

**Decorative motion stops.** On all 68 routes, nothing decorative is still animating 6 seconds after load, or 6 seconds after scrolling to the end of the page.

**What the Firefox and WebKit runs do and do not show.** They ran on Windows. Playwright's WebKit there draws in software, at a few frames a second, and does not apply variable font weights, so text looks thin in it; Firefox and Chrome both apply them, and Safari is expected to, but real Safari on a Mac or iPhone has not been tried. Everything worked in it, but it says nothing about how Safari looks or how fast it runs.

**A note on test screenshots.** Forcing Chrome to composite through SwiftShader (`--use-angle=swiftshader`) paints pale bands over some cards, and their brightness changes between two captures of an unchanged page. The same pixels are correct and stable on a real GPU, with Chrome's default settings and with `--disable-gpu`, so visitors do not see this. Do not judge the look of the site from screenshots taken with that flag. `focusring.js` measures pixels, so it does not use it.

### Lighthouse 12 (simulated mid-range phone on slow 4G)

Served with gzip compression, as GitHub Pages, Netlify and most static hosts do:

| Page | Performance | Accessibility | Best practices | SEO | Largest paint | Blocking time | Layout shift | Transferred |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Start (`#/`), both landings | 86 | 100 | 100 | 100 | 3.5 s | 160 ms | 0.006 | 281 KiB |
| Learning hub | 92 | 100 | 100 | 100 | 3.1 s | 0 ms | 0.006 | 267 KiB |
| 3D Hand Lab | 87 | 100 | 100 | 100 | 3.8 s | 50 ms | 0.006 | 291 KiB |
| Vocabulary | 92 | 100 | 100 | 100 | 3.2 s | 0 ms | 0.006 | 266 KiB |
| Community hub | 91 | 100 | 100 | 100 | 3.3 s | 0 ms | 0.006 | 271 KiB |
| Stories | 86 | 100 | 100 | 100 | 3.8 s | 10 ms | 0.006 | 314 KiB |
| A lesson | 90 | 100 | 100 | 100 | 3.3 s | 0 ms | 0.000 | 302 KiB |
| Log in | 90 | 100 | 100 | 100 | 3.4 s | 0 ms | 0.006 | 276 KiB |
| `admin.html` (first-time setup) | 96 | 100 | 100 | 60 | 2.5 s | 30 ms | 0.000 | 193 KiB |

The console's SEO score is low on purpose: it asks search engines not to list it.

**The 3D Hand Lab** scored 64 before the hand's start-up work in this round, with 1,110 ms of blocking time. **The start page** scored 82 when the hand started as soon as the page was idle (314 ms of blocking time); now it starts only as a visitor comes near.

Served **without** compression (for example `python -m http.server`), performance drops further, because every file is sent at full size. **Host Tanaw on a static host that compresses files.**

### A simulated entry-level phone

Chrome with its CPU slowed 6×, slow 4G, a 390 × 844 screen, and a device reporting 2 GB of memory. **This is not a real phone:** the graphics chip here is not slowed down, so frame rates are optimistic. Section 3 is still needed.

| Page | First paint | Largest paint | Longest task | Notes |
| --- | --- | --- | --- | --- |
| Start | 1.3 s | 3.4 s | 0.6 s | None of the 3D hand's code has loaded |
| Second landing, scrolled to | | | 0.2 s | The greeting starts about 1 s after starting to scroll; the hand draws at 1.25× instead of 2×, without smoothing |
| 3D Hand Lab | 1.2 s | 3.8 s | 0.6 s | The same lower detail |
| Vocabulary | 1.2 s | 2.8 s | 0.3 s | |

Comparing the same page five times each, with and without skipping the layout of far off-screen sections (`content-visibility`), the start page's longest task went from about 1.1 s to 0.6 s and its total blocking work from about 2.0 s to 1.1 s; Vocabulary's from 0.44 s to 0.23 s and from about 1.0 s to 0.6 s.

## 2. Screen readers (manual, not yet done)

Run each task with at least two set-ups: **NVDA + Chrome or Firefox** on Windows (free), **TalkBack + Chrome** on Android, and, if available, **VoiceOver + Safari** on an iPhone or Mac. Note exactly what is spoken, and anything confusing, repeated or missing.

| # | Task | Expected |
| --- | --- | --- |
| 1 | Open the start page; move by headings and landmarks | Both worlds are headings, each with its Enter link and its list of stations; the everyday scenes are a named list between them; the second landing follows with its own heading, form and "Choose a world" links; header, main and footer landmarks are announced |
| 1d | Second landing: type a name in "Fingerspell your name in 3D" and press Enter | The letters are read one by one; the greeting, which plays by itself, is not read out |
| 1a | Registration: submit the empty form, follow a link in the error list, type a password | The list of errors is read; the link moves to the field; the strength changes are read without interrupting typing |
| 1b | Log in with a wrong password, then the right one; open the account menu; log out | The problem is read; the welcome is read; the menu's state is announced; the logged-out message is read |
| 1c | `admin.html`: move through the rail; on People, sort a column and open Manage | The current section is announced; the new sort is announced; focus moves into the dialog and back |
| 2 | Choose Awareness & Learning, then any station | The new page title is announced and focus lands on the page's main heading |
| 3 | In a lesson, answer a question **wrongly**, then correctly | The whole feedback (verdict, answer, explanation) is read **once**, then the Continue button |
| 4 | 3D Hand Lab: choose a letter, then tab to the hand and press the arrow keys | The letter's description is read; the hand is announced as an image with a description of the pose |
| 5 | Press Ctrl+K, type "rights", move with the arrow keys, press Enter | The search field, the number of results and the active result are announced; Enter opens it |
| 6 | Stories: open a story, press → twice, answer the question | Each chapter title is read; the answer's feedback is read once |
| 7 | Timeline game: move a card with the arrow buttons | "…: now position N of 5" is announced after each move |
| 8 | Vocabulary: search "salamat", open a word, tick "I can sign this" | The result count is announced; the checkbox state is announced |
| 9 | Open Display settings; change the theme; press Esc | Focus moves into the dialog, controls are labeled, Esc closes it and focus returns to the button |
| 10 | Class vocabulary: add a word | The new word appears in the list and a confirmation is announced |

Record results in a table: task, set-up, what was spoken, problem, severity (blocker / serious / minor), fix.

## 3. Low-end phones and slow connections (manual, not yet done)

- **Real device (best):** an entry-level Android phone (about 2 GB of memory or less) on mobile data, Chrome browser.
- **Otherwise:** Chrome DevTools → Performance → CPU **6× slowdown**, and Network → **Slow 4G**.

Check, and time with a stopwatch where it applies:

1. The start page is readable and usable within about 5 seconds on a first visit; both worlds' Enter buttons show without scrolling on a typical phone.
1a. Scrolling on to the second landing: the hand appears within a few seconds and spells *Mabuhay* smoothly; scrolling does not stutter while it starts.
2. The 3D Hand Lab turns smoothly by drag; spelling MABUHAY shows every letter; the phone does not get hot after two minutes.
2a. Creating an account feels responsive: password hashing runs on the phone, and takes longer there than on a laptop.
3. Scrolling stays smooth on long pages: Vocabulary (142 words), History, a scene, a story.
4. Typing in the Vocabulary search and in the search dialog does not lag.
5. The Practice Mirror starts and stops the camera; recording a 10-second clip does not freeze the phone.
6. After one visit, the site opens offline (airplane mode) when installed or served over https.
7. With **Reduce motion** on (Display settings), everything still works, and the 3D hand steps between poses.

## 4. Screen sizes, zoom and text spacing

Automated (section 1): widths from 320 to 2560 px, a window at 200% zoom, a phone on its side, 150% text at 1024 and 390 px wide, relaxed spacing, and WCAG's text-spacing test. These check layout, so also try by hand:

- **Real browser zoom at 400%** on a laptop (WCAG 1.4.10), and **150% text** at sizes between the ones tested.
- **Phone in landscape**: lessons, games, the 3D Hand Lab and the Conversation Bridge's full-screen text are comfortable to use, not only free of overflow (WCAG 1.3.4).
- **Printing** a lesson, a scene and the Emergency Card's page: black on white, no navigation.
- **Windows' contrast themes** on a real Windows machine: settings, the 3D Lab, a game, the console's chart.

## 5. Feedback from Deaf users and learners (recommended before wider use)

Formal review by Deaf organizations is not required for this academic version. If Tanaw is used beyond the classroom, its content and the 3D hand should be checked by Deaf people first.

**Principles**

- Recruit through Deaf-led organizations or a Deaf FSL teacher, not only through the team's own circles.
- Pay or otherwise compensate participants for their time.
- Book a **qualified FSL interpreter** for every session with Deaf participants, and explain consent in FSL.
- Take notes only. Do not record faces or signing unless a participant agrees in writing; never publish recordings.
- Participants may skip any task or stop at any time.

**Who:** 3–5 Deaf adults who use FSL; 3–5 hearing FSL learners; if possible, 1–2 hard of hearing participants and 1–2 screen-reader users.

**Session (45–60 minutes):** welcome and consent (10 min), tasks (25 min), conversation (15 min), thanks.

**Tasks**

1. From the start page, find out when Deaf Awareness Week is.
2. Find what the FSL Act says about hospitals.
3. In the 3D Hand Lab, look at five letters of your choice, and spell your name.
4. Play one game of your choice.
5. Read one story.
6. Find the word "doctor" and mark it as learned.
7. Explore the Deaf Community section freely for three minutes.

**Questions for Deaf participants**

- Is anything inaccurate, outdated or disrespectful? What should change or be removed?
- Do the 3D letters and handshapes look right? Which ones would you correct, and how? How is FSL's T formed where you sign?
- Is the hand's "Experimental, not validated" label clear enough?
- Do the Stories tell these histories accurately? Who should tell them?
- Do the names (*Matuto*, *Pamayanan*), the eye, the split horizon and the capiz and banig designs feel right?

**Questions for learners:** Where did you get stuck? Was it clear that the 3D hand is an experiment and that whole signs come from a Deaf teacher? What would make you come back?

**Afterwards:** log every issue (what, who found it, severity, decision, fix), fix blockers first, and tell participants what changed because of them. Update the status on the About page only with the reviewers' permission, and name reviewers only if they agree.

## 6. Re-running everything after a change

From `tests/`: `npm run smoke`, `npm run reflow`, `npm run landing`, `npm run accounts`, `npm run admin`, `npm run flows`, `npm run nodemos`, `npm run features`, `npm run sweep`, `npm run browsers`, the `axe` scripts, `npm run focus`, and (with a local server) `npm run offline`. If any file changed, raise `CACHE_VERSION` in `sw.js`, and if a file was added or removed, update its `APP_SHELL` list.
