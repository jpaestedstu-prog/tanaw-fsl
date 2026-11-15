# Tanaw — Filipino Sign Language & the Filipino Deaf community

**Tanaw** (Filipino for *to view* or *to look toward*; its root gives *pananaw*, perspective) is a website with two connected worlds:

- **Awareness & Learning** (*Matuto*): what Filipino Sign Language (FSL) is, how signs are built, Deaf etiquette, respectful language, games, everyday scenes, a vocabulary list, practice tools and the **3D Hand Lab**.
- **Deaf Community** (*Pamayanan*): Deaf identity and culture, stories from Deaf Filipino history, the history of FSL, rights under Republic Act No. 11106, observances, and Deaf-led organizations.

It is built with HTML, CSS, vanilla JavaScript and WebGL only: no framework, no library, no backend. It runs offline, even straight from this folder.

**About the 3D hand.** Tanaw includes an **experimental, hands-only 3D prototype** of the manual alphabet and the handshapes signs are built from. It is labeled *Experimental* everywhere it appears and has **not been validated by Deaf FSL experts**. Whole FSL signs are not shown: learners learn them from Deaf teachers. See [`docs/3d-sign-animation.md`](docs/3d-sign-animation.md).

**About accounts.** Login, registration, logout and the administrator console (`admin.html`) are a **frontend demonstration, not secure sign-in**. They run only in the visitor's browser, with no server behind them, and they say so wherever they appear. Everything else in Tanaw works without an account. See [`docs/backend-integration.md`](docs/backend-integration.md).

Tanaw is a student project for the course *I.S. Innovation and New Technologies*.

---

## 1. How to run it

**On the web.** Tanaw is published with GitHub Pages from the `main` branch of <https://github.com/jpaestedstu-prog/tanaw-fsl>:

- Tanaw: <https://jpaestedstu-prog.github.io/tanaw-fsl/>
- The administrator console: <https://jpaestedstu-prog.github.io/tanaw-fsl/admin.html>

A push to `main` updates the live site within a minute or two (raise `CACHE_VERSION` in `sw.js` first: see section 9). As everywhere else, accounts stay in each visitor's own browser, so the console lists the accounts made in that same browser, not other visitors'.

**Option A — open the file.** Double-click `index.html` in a recent Chrome, Edge, Firefox or Safari. Everything works, including offline.

**Option B — local server (recommended for demos).** Needed for installing as an app (PWA), and for the camera and storage in some browsers.

```bash
# from inside the tanaw-fsl folder
python -m http.server 8080
```

Then open <http://localhost:8080>. **For a public site, use a static host that compresses files** (GitHub Pages, Netlify, Cloudflare Pages).

**The administrator console** is a separate page: open `admin.html` (<http://localhost:8080/admin.html>). The first time, it asks you to create this browser's first administrator; there is no built-in password. Administrators also get a link to it in their account menu.

Automated tests ran on Chrome, Edge, Firefox and WebKit (Safari's engine, through Playwright on Windows). Real Safari on a Mac or iPhone has not been tried.

| Feature | Works in |
| --- | --- |
| Everything except live captions | Current Chrome, Edge, Firefox, Safari |
| The 3D hand | Browsers with WebGL (all of the above on most devices). Without WebGL, each 3D view says so and shows the letters and descriptions as text |
| Live captions (speech-to-text) | Chrome, Edge, Safari (Web Speech API). Chrome and Edge use the browser maker's online speech service |
| Page transitions between worlds | Browsers with the View Transitions API; others change pages instantly |
| Offline install (PWA) | Option B or any https host (service workers need http/https) |
| Accounts | Pages on https, on localhost, or opened from the folder (password hashing needs a secure page). On a plain `http://192.168…` address, the forms explain this instead of working |
| The console seeing the site's accounts | Chrome and Edge from the folder, or any browser through Option B. **Firefox keeps each local file's storage apart**, so from the folder `admin.html` cannot see accounts made in `index.html`; the console says so. Use Option B in Firefox |

---

## 2. This version at a glance

| Area | Status |
| --- | --- |
| **Split-screen landing** (first on the start page) | Complete and tested. The two worlds meet at a seam you can lean toward or drag; the everyday scenes sit along it |
| **3D sign language landing** (second, right below it) | Complete and tested. An experimental 3D hand fingerspells a greeting and your name; the two worlds as portals. It starts only when the visitor reaches it |
| **Login, registration, logout, account page** | **Frontend demonstration, tested.** Validation, password visibility and rules, loading, error, lockout, success and logged-out states; each account's progress kept apart. Not secure sign-in |
| **Administrator console** (`admin.html`) | **Frontend demonstration, tested.** A separate page: overview, people, review ledger, activity, site controls, system. Not a security boundary |
| **3D Hand Lab** and 3D across the site | **Experimental prototype.** 25 letters (A–Z without FSL's T), 15 handshapes, 5 palm orientations, 6 movement types, fingerspelling of any word. Not validated by Deaf FSL experts |
| Lessons (17), games (7, including the experimental *Read the Hand*), everyday scenes (7), Conversation Bridge, Your journey | Complete and tested |
| **Stories** (6) | Documented moments from Filipino Deaf history, told in chapters, each with its source; a question and a private reflection at the end. Not personal testimonies |
| Deaf Community exhibits: identity & culture, history voyage, rights map, calendar, organizations & sources | Complete and tested |
| **Vocabulary** (142 words and phrases) | Meaning, Filipino term, culture notes and an **"I can sign this"** mark per word. No whole-sign demonstrations |
| Practice: mirror (with a 3D letter reference), spaced review, concept quiz, fingerspelling with the 3D hand and a reading drill | Complete |
| **Search** (Ctrl K / ⌘ K) | One search across pages, lessons, games, scenes, words, history, rights and stories, with quick actions such as "fingerspell this in 3D" |
| **Class vocabulary** (for teachers) | Teachers add the words their class needs and share them as a small offline file |
| Review by Deaf organizations | Not part of this academic version. Every page says what it is based on; the About page shows the status of each kind of content |

The switches are in `assets/js/core/config.js`:

```js
T.config = Object.freeze({
  hand3d: true,          // the experimental 3D hand (start page's second landing, Lab, fingerspelling, lessons, letter pages, mirror, Read the Hand)
  stories: true,         // the Stories exhibit (documented history)
  demonstrations: false, // whole-sign demonstrations: only with validated media
});
```

---

## 3. The creative direction

**The start page has two landings, always in this order: first the split screen, then the 3D sign language landing.** Both are part of the project's identity.

**Tanaw means "to look toward", so looking toward a world opens it.** The first landing is a split screen: two worlds meeting at a seam, with Tanaw's eye on it.

- **Awareness & Learning is capiz light**: a window of translucent shell panes, as in Filipino homes, with a sun behind it that follows the pointer. Indigo and sun gold.
- **Deaf Community is banig weave**: a plaited mat whose strands really pass over and under, and a circle of people seen from above. Whoever the pointer comes near takes the turn, and everyone's sightlines meet there. Sea teal and gumamela coral.
- **The seam connects them.** Move toward a world and it widens while the eye looks that way. Drag the eye to pull the horizon; pull it all the way and you enter. The seven everyday scenes sit along the seam as beads, because that is literally where the two worlds meet: each opens a small card, half Learning and half Community.
- **The second landing is a night horizon with the hand.** Below the split screen, under a sky over a glowing floor, an experimental 3D hand fingerspells *Mabuhay* as it comes into view, and then any name a visitor types. Two portals below it lead into the worlds.
- **Typography**: Bricolage Grotesque for the landing's world titles, Space Grotesk for headings, and Atkinson Hyperlegible Next, designed for legibility, for text. A dark *Gabi* (night) theme is the default; a light *Araw* (day) theme and a high-contrast theme are one tap away.
- **Tanaw's eye keeps people company on the account pages**: it follows what you type and looks away while you type a password.
- **The administrator console is *Tanawan*, "the lookout"** (*tanaw* + *-an*): a paper logbook, ruled and inked, with the seam running down its rail. Its headline number is how much of the content a Deaf reviewer has looked at, and it says zero, because that is the truth.

Deliberate constraints:

- **Hands appear only in the labeled 3D prototype.** Illustrations draw people as head-and-shoulder shapes, so no drawing can be mistaken for an FSL sign. The split-screen landing has no hands on it; the second landing's hand carries the Experimental label.
- **No sound-based metaphors** and **no deafness simulations**. The capiz panes carry no ring patterns, which could read as sound waves.
- **Motion is optional.** Decorative animations stop within five seconds; *Reduce motion* turns off the intro, the lean, transitions, parallax and tilting cards, and the 3D hand then steps from pose to pose instead of gliding. Every effect is an extra on a page that works without it: dragging always has the Enter links as its keyboard and single-tap alternative.

---

## 4. Site map

| World | Route | What it is |
| --- | --- | --- |
| — | `#/` | The start page. First the split-screen landing, then the 3D sign language landing and its portals, then what you can do, where to start, everyday scenes with the observance countdown, and an honest note |
| Learning | `#/learn` | Hub: today's goal, next step, stations |
| Learning | `#/learn/path`, `#/learn/:id` | 17 lessons on four "islands"; the lesson player (two lessons include 3D steps) |
| Learning | `#/play`, `#/play/:id` | Seven games and a daily challenge |
| Learning | `#/scenes`, `#/scenes/:id` | Seven everyday scenes (clinic, sari-sari store, jeepney, classroom, family, government office, disaster) |
| Learning | `#/library`, `#/sign/:id` | Vocabulary: search, topics, "Learned / Not yet" filter, word pages (letters show the 3D hand) |
| Learning | `#/lab` | **3D Hand Lab**: Alphabet, Spell, Handshapes, Orientation & movement |
| Learning | `#/practice/…` | Practice Mirror, spaced review, quiz, fingerspelling |
| Learning | `#/bridge` | Conversation Bridge: big text, captions, text-to-speech, phrases, Emergency Card |
| Community | `#/community` | Hub of the exhibits |
| Community | `#/community/identity` | Many ways of being Deaf, visual etiquette, words that respect, sign names, myths & facts |
| Community | `#/community/stories`, `#/community/stories/:id` | Six stories from Deaf Filipino history, read chapter by chapter |
| Community | `#/community/history` | FSL history from 1907, as a voyage (swipe, arrows, keyboard, or list view) |
| Community | `#/community/rights` | RA 11106 as a map of daily places |
| Community | `#/community/calendar` | Observances with countdowns and `.ics` calendar files |
| Community | `#/community/connect` | Deaf-led organizations, programs, and every source |
| Shared | `#/journey` | Progress, achievements as a constellation, journal, data export/import |
| Shared | `#/about` | Status of the content, the 3D hand, principles, roadmap |
| Shared | `#/studio` | Class vocabulary (for teachers) |
| Accounts | `#/login`, `#/register` | Log in and create an account, on a threshold between the two worlds (demonstration) |
| Accounts | `#/account` | Your details, password, data and deleting the account; asks you to log in first |
| Console | `admin.html` | **A separate page.** Its gate: first-time setup, login, or a clear refusal |
| Console | `admin.html#/overview` | Reviewed by a Deaf reviewer, accounts, logins per day; the two worlds' content with the log on the seam between them |
| Console | `admin.html#/people` | Accounts: search, roles, disable, unlock, temporary passwords, delete, labeled sample learners |
| Console | `admin.html#/review` | The review ledger: every piece of content and whether anyone has reviewed it |
| Console | `admin.html#/activity` | What happened in this browser; filter, download |
| Console | `admin.html#/site` | A notice on every public page; who can register |
| Console | `admin.html#/system` | What a real console needs, this browser's data, backup, restore, start again |

Old addresses (`#/culture?s=…`, `#/progress`, `#/signin`, `#/signup`) redirect to their new homes.

### Games

| Game | Teaches | How you play |
| --- | --- | --- |
| Sightlines | Deaf etiquette | Eight illustrated moments; the scene responds to your choice |
| Myth or Fact? | Awareness | Swipe the card, use ← →, or press the buttons |
| Word Lens | Respectful language | Find the outdated word in a sentence, then choose a respectful one |
| Rights Match | RA 11106 | Match situations to the section of the law that covers them |
| Timeline | History | Put moments in order by dragging or with the move buttons |
| Read the Hand *(experimental)* | Reading fingerspelling | The 3D hand spells six letters and four short words; choose what it shows. Kept out of the daily challenge |
| Five Parts | Sign structure | Quick-fire sorting of clues into the five sign parameters |

Every game works with a keyboard alone; gestures are shortcuts. No game tests FSL vocabulary signs.

---

## 5. What changed

### November 2026

- **Live on GitHub Pages** (15 November): the site and the console are online (section 1), served from the same files as this folder and tested again there.
- **Both landings, in order.** The start page opens on the split-screen landing, with the 3D sign language landing right below it. Neither replaces the other.
- **The split-screen landing is back, and more than it was.** It was removed in October when the landing was rebuilt around the 3D hand, a decision taken without being asked for. The original concept and identity are restored from the 24 October copy. New: the lean, the draggable eye, the scenes on the seam, sightlines that follow the pointer, the intro, the entering transition, and real capiz and banig materials.
- **The 3D sign language landing is kept as it was designed** on 31 October, compared pixel by pixel with that copy. Its heading is now an `h2`, because the page has one `h1`, and the hand now waits until the visitor gets there, so the first landing stays quick.
- **Accounts** (frontend demonstration): login, registration, logout, an account page, per-account progress.
- **Administrator console** (frontend demonstration): a separate page, `admin.html`, with its own look and navigation.
- **A clean place to connect a backend**: every account call goes through one object, `T.backend`, and [`docs/backend-integration.md`](docs/backend-integration.md) maps each method to an endpoint.
- **Unchanged on purpose**: the 3D hand's poses and the Lab's page (`hands.js`, `lab.js`) and the files of the Deaf Community exhibits are byte-for-byte what they were. The engine (`hand3d.js`) changed only in how it starts and how it behaves on slow devices: its model, poses and look on capable devices are the same. `lab.css` gained one layout rule and a loading state, and the hero areas of the two hubs share the landing's new capiz and banig materials.
- **Faster on slow phones**: long pages skip laying out what is far off screen, and the hand starts only near the screen, compiles its shaders in the background, and draws fewer pixels on devices with little memory or few cores.
- **Tested in more places**: Firefox and WebKit, Windows' contrast themes, printing, 200% zoom, the WCAG text-spacing test, very wide screens, phones on their side, a fake camera for the mirror, and what happens when things go wrong.

Problems found and fixed in this round:

| Problem | Fix |
| --- | --- |
| The original landing's people ran into "Pamayanan · Community", and its labels crowded the headline | The art moved clear of the words; a test now measures this |
| Floating sign-part labels looked like buttons, right beside real links | Drawn as points of light with a word beside them |
| Enter moved away as the pointer approached it, because the words followed the seam | Words hold still while their own world opens |
| The beads ran away from the pointer | The seam rests while the pointer is near the middle |
| Switching to Reduce motion mid-lean left the seam stuck off-center | It returns to the middle at once |
| After a long registration, the welcome message was off screen | The result starts at the top of the page |
| The "passwords do not match" error never fired for keyboard users, who tab to the reveal button first | Checked on leaving the button too |
| Progress earned a moment before opening the registration page was not offered | The guest's data is saved first |
| Footer headings in capital letters could be read letter by letter by screen readers | Small capitals, which keep the words normal |
| Several pages still said Tanaw has no accounts | Reworded |
| At 150% text, the header ran off the side of the screen. This predates accounts at 1024 px; the account button made it worse | The header measures itself and gives up labels, then the status chip and the name, as it needs to |
| At 150% text on phones, the 3D Hand Lab overflowed by 36 px and word pages by 6–8 px | One layout rule in the Lab, and word chips that wrap |
| At 150% text, the landing's words were cut off or ran into the art | The landing grows to fit its words, and the decoration makes way for them |
| On tablets, the landing's station links were cut off early | They use the full width, and only the lead sentence keeps a short measure |
| The account pages' side panel failed contrast in the light theme | The panel has its own dark backing in every theme |
| On the console, focus rings were hard to see on the skip link, the current section and the chart's bars | Each ring now contrasts with what it sits on; the focus-ring test covers the console |
| Opening the console jumped focus past the skip link and the rail | A fresh page starts at the top; focus moves to the heading only after the gate or a change of section |
| Damaged saved progress made the site claim the browser was blocking storage, and it then never saved again | It says what happened, starts fresh and keeps saving |
| Printing a page in the dark theme gave pale text on white paper, and gradient headings vanished | Pages print black on white, without the navigation |
| In Windows' contrast themes, the console's chart disappeared, every tab looked selected, and art ran behind text | Selected things take the system's highlight, meters are drawn in the text color, decoration goes |
| A very short recording in the Practice Mirror gave no clip and no message | It says the recording was too short |
| Importing the wrong file asked "Replace your current progress?" before saying it could not be used | The file is checked first |
| With JavaScript off, "Loading…" stayed on screen beside the explanation | Only the explanation shows |
| Long words broke in the middle on narrow vocabulary tiles ("Interpret-er") | The tiles keep enough width at any text size |
| Long lesson and game titles were cut off with "…" on phones | They wrap |
| The people art kept animating while off screen, because the rule pausing it was overridden | It pauses, and plays when it comes into view |
| On wide screens, a landing style removed the Learning hub lattice's perspective | The style applies only to the landing |
| The `hand3d` and `stories` switches left links and pages behind when turned off | Both now turn their feature off completely |
| Logging in, registering or setting up the first administrator while another tab was open (such as the public site beside the console) ended the new session at once: the person was logged out, and after first-time setup the console said "Something went wrong" | The account is saved before the session, so the other tab never sees a session whose account it cannot find. The account and console tests now do all three with another tab open |
| On GitHub Pages, every site of one account shares one address and one set of caches, and Tanaw's offline update deleted every cache that was not its own | It deletes only Tanaw's old caches, and puts its own back if another site's update clears them |
| In the Practice Mirror, if the camera had stopped sending a picture (unplugged, or taken by another app), Record failed silently with an error in the console | It says recording could not start, and to stop and start the camera |

### October 2026

- **3D Hand Lab and the 3D hand across the site** (fingerspelling with a reading drill, two lessons, letter pages, Practice Mirror, *Read the Hand*). A WebGL renderer written for Tanaw, poses with fitted thumb positions, signer's view, left-hand mirror, x-ray, five styles, keyboard turning, and a text fallback without WebGL.
- **Stories restored, redesigned** as six documented stories from Deaf Filipino history, with a source for every chapter, a question at the end and a private reflection saved to the journal.
- **Search** (Ctrl K / ⌘ K or the Search button) across the whole site, with quick actions.
- **New identity**: a dark default theme, glass surfaces, Space Grotesk headings; light and high-contrast themes kept.
- **About page rewritten**: the status of each kind of content, the 3D hand's design and limits, the academic context.

Fixed during that round's testing:

| Problem | Fix |
| --- | --- |
| After visiting the Games page, opening any game showed "Game not found" | The router now loads every file a page needs, even when one of its views is already defined |
| *Read the Hand* could not start | A missing reference in the game code |
| With reduced motion, fingerspelling skipped to the last letter | The hand steps from letter to letter, holding each one |
| A slow frame (a busy phone, the first shader compile) could skip letters | Playback pauses through long frames instead of jumping ahead |
| Setting up the 3D hand inside the page transition froze the page for a moment on slow devices | The hand is set up after the new page has been painted |
| Game feedback stayed below the fold with reduced motion | It is always scrolled into view (instantly when motion is reduced) |
| The phone header overflowed (390–430 px) once XP grew | Below 520 px the header shows the daily ring and streak without XP, below 430 px the logo alone |
| Cards kept tilting after switching to *Reduce motion*, until the page was reloaded | The setting applies immediately |
| Search missed the Stories unless their page had been opened, and "story" ranked History entries (from "hi*story*") first | Search loads the Stories when it opens; a page named by a keyword, then results of the kind searched for, come first |
| Opening the 3D Hand Lab or a story from a link made the page jump (layout shift 0.10) | The station bar's row is reserved from the first paint on those pages too (0.003) |

---

## 6. Content and verification policy

- **No invented or generated signs.** Tanaw does not invent or AI-generate FSL signs. The 3D hand follows published descriptions of the manual alphabet and handshapes, leaves out what it cannot model (FSL's T, Ñ, NG), and is labeled experimental and not validated.
- **No invented voices.** No testimonials, endorsements or personal stories are written on anyone's behalf. The Stories retell documented events and cite their sources. Listing an organization does not mean it endorses Tanaw.
- **Sourced facts.** Law and history statements come from RA 11106, Proclamation No. 829 (s. 1991), the PFD, the WFD and the other sources in **Connect → Sources**.
- **Honest status.** Pages say what their content is based on and that it has not been reviewed by Deaf organizations; the About page shows the status of each kind of content.
- **Deaf people decide.** If Tanaw is used beyond the classroom, decisions about how FSL, Deaf culture and stories are represented belong to Deaf contributors and Deaf-led partners.

---

## 7. What remains

**Needs people, not code** (recommended, not required for the course):

1. Screen-reader sessions with NVDA and TalkBack (ten tasks in [`docs/testing.md`](docs/testing.md), section 2).
2. A real entry-level Android phone on mobile data, including the start page's second landing and the 3D Hand Lab (section 3), and real Safari on an iPhone or Mac.
3. Feedback from Deaf FSL users and FSL learners before any use beyond the classroom (section 5), and validation of the 3D hand as described in [`docs/3d-sign-animation.md`](docs/3d-sign-animation.md), section 7.

**Needs a backend** (see [`docs/backend-integration.md`](docs/backend-integration.md)): real authentication and role checks on a server, password recovery, sync between devices, a shared review ledger, a site notice every visitor sees. The frontend is ready for these; they need a server and a privacy assessment.

**Later:** FSL's own T, Ñ and NG in 3D (from Deaf teachers' guidance); whole signs with arms, body and face, validated sign by sign; personal stories told in FSL by Deaf storytellers, with consent; a way to report a problem with any content; a Filipino-language interface.

---

## 8. Data, privacy and limitations

- Progress, learned words, explored exhibits, game records, journal, settings, phrases, class vocabulary and the Emergency Card are stored in this browser's **localStorage** only. They do not sync; use **Your journey → Export/Import**. Clearing site data erases them.
- The camera starts only when you press **Start camera**; clips stay in memory unless downloaded.
- There are no cookies, analytics or trackers. External links open other websites.
- **Accounts and the console are a demonstration, not secure sign-in.** Passwords are hashed (PBKDF2-SHA-256, 210,000 rounds, a random salt) and never stored as typed, but there is no server: anyone using this browser could read or change the stored data or give themselves any role. Each account's progress is kept apart for convenience on a shared device, not for secrecy. A separate administrator page protects nothing by itself. Please do not reuse a real password.
- The 3D hand runs in the browser; it needs WebGL.
- Tanaw does not recognize or translate signing, and does not replace qualified FSL interpreters or Deaf teachers.

---

## 9. Project structure

```
tanaw-fsl/
├── index.html                The public site's shell: header, search, station navigation, tab bar, footer, scripts
├── admin.html                The administrator console: a separate page with its own layout (not access control)
├── manifest.webmanifest      PWA manifest (http/https only)
├── sw.js                     Service worker: caches every file for offline use
├── docs/
│   ├── 3d-sign-animation.md  The experimental 3D hand: design, checks, limits, path to validation
│   ├── backend-integration.md  Where a real backend connects, and what must move to it
│   └── testing.md            Test results and manual testing plans
├── tests/                    Automated browser checks (Node + headless Chrome)
└── assets/
    ├── css/                  tokens, base, layout, components, worlds, horizon (the first landing), pages, tools,
    │                         community, play, lab (3D views), futura (identity layer and the second landing),
    │                         accounts, admin
    ├── fonts/                Atkinson Hyperlegible Next, Space Grotesk, Bricolage Grotesque (SIL OFL)
    ├── img/                  Icons, and the two world materials: capiz.svg and banig.svg
    ├── media/signs/          Validated whole-sign demonstrations would go here (empty on purpose)
    ├── media/stories/        Stories told by Deaf storytellers would go here (empty on purpose)
    └── js/
        ├── core/             config (feature switches), util, icons, store, settings, ui, media, progress,
        │                     srs, router, shell, auth (accounts, as pages see them),
        │                     backend-demo (the pretend server: replace it to connect a real one)
        ├── data/             signs, lessons, concepts, culture, phrases, media-manifest,
        │                     scenes, games, stories, hands (3D poses)
        ├── components/       art (SVG), widgets, sign-ui, steps, runner, fx (motion), horizon (the first landing's
        │                     behaviour), forms, palette (search), hand3d (WebGL renderer), hand-ui (3D interface)
        ├── views/            home (both landings, loaded first) and every other page (loaded on demand)
        ├── admin/            The console: console (gate, rail, router), overview, people, review, activity,
        │                     site, system, boot, demo-admin (the pretend server's administrator side)
        └── app.js            Routes, redirects, start-up
```

Scripts are classic `<script>` files and data lives in `.js` files, so the site runs from `file://`. The 3D files load only on pages that use them, and the public site never loads the console's code.

**Maintenance:** after changing any file, raise `CACHE_VERSION` in `sw.js`, or installed copies keep the old version. If you add or remove a file, update `APP_SHELL` in `sw.js`.

---

## 10. Quality checks (2 November 2026)

Full results and how to re-run them: [`docs/testing.md`](docs/testing.md) and [`tests/README.md`](tests/README.md).

- All 84 JavaScript files (the site and its tests) pass a syntax check.
- **68 routes at sixteen sizes and settings**: 320 to 2560 px wide, a window at 200% zoom, a phone on its side, 150% text, relaxed spacing and WCAG's text-spacing test. No console errors or warnings, no failed loads, no sideways scrolling, one `h1` per page, no text cut off.
- **axe-core** (WCAG 2.0/2.1/2.2 A and AA plus best practices): **0 violations** on 67 routes in light, dark and both high-contrast themes at desktop size and at phone size, in 35 temporary states in light and dark, and on every section and state of the console in its looks.
- **537 automated interaction checks** pass in Chrome: 76 of the landings, 87 of accounts, 146 of the console, 42 site-wide flows, 29 of this build's content, 62 of the 3D hand, Stories and search, and 95 of everything else, including the camera mirror, the Conversation Bridge, damaged data, hostile links, printing and Windows' contrast themes.
- **Other browsers:** the landing, account and console checks also pass on Microsoft Edge. A 49-check run covering every route passes on Firefox and on WebKit, Safari's engine.
- All **6,112 focus rings** checked (27 pages in four themes, and the console's setup page and six sections in its four looks) have at least 3:1 contrast with the pixels around them.
- **Offline:** the service worker caches all 98 entries on its list; never-visited pages (including the 3D Lab, a story and the account pages), a full reload, both landings and `admin.html` work with the network off, with all three fonts.
- **Lighthouse (simulated phone, compressed hosting):** the start page, with both landings, scores 86 for performance, the 3D Hand Lab 87 (up from 64), and other pages 86–96. Accessibility and best practices are 100 on all nine pages measured, and SEO 100 on all but the console, which asks search engines not to list it. Layout shift is at most 0.006.

**Again on the live site, 15 November 2026** (<https://jpaestedstu-prog.github.io/tanaw-fsl/>):

- All 126 files in the repository are served exactly as they are in this folder.
- **542 automated interaction checks** pass in Chrome: 76 of the landings, 89 of accounts, 148 of the console, 42 site-wide flows, 29 of this build's content, 62 of the 3D hand, Stories and search, and 96 of everything else. Of the 5 added since 2 November, four log in, register and set up the first administrator while another tab is open, and one presses Record after the camera has stopped.
- No problems on 68 routes at six sizes; **0 axe-core violations** on 67 routes and in 35 temporary states (light theme, desktop size); the offline test passes, including `admin.html` and never-visited pages.
- **The site and the console together:** an account registered on the site appears in the console's People list, and a notice and closed registration set in the console reach the site in another tab at once, with no errors or failed requests.
- **Firefox and WebKit** (Safari's engine): every route, both landings, registration, login, and the console beside the site.
- Tanaw and the account's other GitHub Pages site share one address; each keeps its own offline cache.

**Not done:** testing with Deaf users and FSL learners, real screen-reader sessions, a real low-end Android phone on mobile data, and real Safari on a Mac or iPhone.

---

## 11. Sources

- Republic Act No. 11106, the Filipino Sign Language Act (2018) — <https://lawphil.net/statutes/repacts/ra2018/ra_11106_2018.html>
- Philippine Federation of the Deaf, History — <https://pfdeaf.org/history/>
- Martinez, L. B. and Cabalfin, E. P. G. (2008). *Sign Language and Computing in a Developing Country.* PACLIC 22 — <https://aclanthology.org/Y08-1046/>
- Cueto, M. et al. (2020). *Translating an Aesop's Fable to Filipino Sign Language through 3D Animation.* LREC 2020 Sign Language Workshop — <https://aclanthology.org/2020.signlang-1.7/>
- WFD and WASLI Statement on Use of Signing Avatars (2018) — <https://wfdeaf.org/wp-content/uploads/WFD-and-WASLI-Statement-on-Avatar-FINAL-14032018-Updated-14042018.pdf>
- VERA Files (2015), *Kinds of sign language in the Philippines* — <https://verafiles.org/articles/kinds-of-sign-language-in-the-philippines>
- Wikipedia, *Filipino Sign Language* — <https://en.wikipedia.org/wiki/Filipino_Sign_Language>
- ABS-CBN News (6 April 2020), *Interpreters seek awareness after online 'mockery' of sign language insets* — <https://news.abs-cbn.com/news/04/06/20/interpreters-seek-awareness-after-online-mockery-of-sign-language-insets>
- Philippine Daily Inquirer (2020), *CHR asks netizens to stop ridiculing sign language interpreters on TV* — <https://newsinfo.inquirer.net/1256031/chr-asks-netizens-to-stop-ridiculing-sign-language-interpreters-in-tv-programs>

All sources used by the site are listed on its **Connect → Sources** page.

---

## 12. Credits

- Typefaces: **Atkinson Hyperlegible Next** (Braille Institute), **Space Grotesk** (The Space Grotesk Project Authors) and **Bricolage Grotesque** (The Bricolage Grotesque Project Authors; reduced to one weight and basic Latin letters for the landing's titles), SIL Open Font License (see `assets/fonts/`).
- Icons and illustrations are original and contain no handshapes; the 3D hand is drawn by Tanaw's own WebGL code.
- Tanaw is a student technology-innovation project. It is not affiliated with, or endorsed by, the organizations, schools or agencies it references.
