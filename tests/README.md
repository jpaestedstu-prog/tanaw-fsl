# Automated checks

These scripts drive the real site in headless Google Chrome. They are for the team, not for visitors, and they are not loaded by the site.

## Setup (once)

1. Install [Node.js](https://nodejs.org/) 18 or newer and Google Chrome.
2. In this `tests` folder, run `npm install`.
3. If Chrome is not at `C:/Program Files/Google/Chrome/Application/chrome.exe`, set `CHROME_PATH` to its location first.

The scripts that reach the 3D hand start Chrome with SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`), its software renderer, so the hand is tested even on machines without a graphics card. SwiftShader is much slower than a real GPU; timings in these runs say nothing about real devices, and screenshots taken with that flag can show pale bands over some cards that visitors do not see (`docs/testing.md`, section 1). The landing, accounts and console scripts need no WebGL and run without it, and the focus-ring script, which measures pixels, lets Chrome choose its renderer.

## Scripts

Run them from this folder. Each prints PASS/FAIL lines, or a list of problems.

| Command | What it checks |
| --- | --- |
| `npm run smoke` | Every route in `routes.json` at 1366, 820, 390 and 320 px wide, and at 1024 and 390 px with 150% text: console errors and warnings, failed loads, sideways scrolling, exactly one `h1` |
| `npm run landing` | The start page's two landings: that the 3D landing comes right after the split screen and waits until it can be seen; and the split screen itself: the concept (two worlds, the seam, no 3D hand), the words clear of the art, the lean, the beads and their cards, sightlines, dragging the eye, entering, keyboard order, the intro, reduced motion, large text, high contrast, and twelve window sizes |
| `npm run accounts` | Login, registration, logout, the account page: validation, password visibility and rules, loading and result states, lockout, session expiry and tampering, other tabs, per-account progress, open redirects, markup in names, closed registration, a browser without Web Crypto, phones |
| `npm run admin` | `admin.html`: that it is a separate page, first-time setup, the gate and who it refuses, keyboard order, every section's features, its numbers against the site's data, the review ledger, CSV safety, site controls seen live in another tab, backup and restore, phones, and axe-core on every section and state in the paper, night and high-contrast looks |
| `npm run flows` | Interaction flows: the landing page's links, the non-3D games played with the keyboard, lessons, exhibits, Stories, scenes, achievements, redirects, motion settings, SVG rejection |
| `npm run nodemos` | Checks of this build's content: no whole-sign demonstrations or placeholders, wording on every page, Vocabulary, word cards, practice tools, class vocabulary, the About page, Stories |
| `npm run features` | The 3D hand, Stories and search, run with WebGL, with reduced motion, on devices reporting little memory or few cores, and with WebGL switched off |
| `npm run axe` (also `axe:dark`, `axe:contrast`, `axe:phone`) | axe-core WCAG 2.0/2.1/2.2 A and AA rules plus best practices, on every route in `routes.json` |
| `npm run axe:states` | axe-core on dialogs, search, game feedback, results screens, the 3D views in use, a card on the seam, the account forms with errors and in their result states, and other temporary states |
| `npm run focus` | Focus-ring contrast: focuses every control on 27 pages in all four themes, and on the console's first-time setup and six sections in its four looks, and compares the ring with the rendered pixels around it (at least 3:1) |
| `npm run offline` | Service worker and offline use, including the 3D, Stories, account and console pages. Start a local server first, from the `tanaw-fsl` folder: `python -m http.server 8765 --bind 127.0.0.1` |
| `npm run reflow` | Every route at the sizes the smoke test skips (a window at 200% zoom, 768, 1024×600, 1920, 2560, a phone on its side), with relaxed spacing, and with WCAG's text-spacing test: sideways scrolling, text cut off, words broken in the middle |
| `npm run sweep` | What the others do not reach: the camera mirror and recording (with Chrome's fake camera), the Conversation Bridge (with stand-ins for speech), your data, the settings, a quiz, a review and a lesson from start to finish, and what happens when things go wrong: damaged saves, full storage, a file that will not load, hostile links, no JavaScript, fast navigation, back and forward, and whether keyboard focus is ever hidden |
| `npm run browsers` | Firefox and WebKit (Safari's engine) through Playwright: every route at three sizes, both landings, accounts, the console, the tools, offline with the server really stopped, and opening the site from its folder. First run `npx playwright install firefox webkit` once. Playwright's WebKit on Windows draws in software and does not apply variable font weights, so text looks thin and frames are slow there; neither says anything about Safari |

`flows`, `nodemos`, `features`, `accounts`, `admin`, `sweep` and `browsers` clear or change Tanaw's saved data in the test browser profile, never in your own browser.

Long pages skip laying out what is far off screen (`content-visibility` in `futura.css`). The scripts that measure or judge a whole page (`smoke`, `reflow`, `axe`, `axe:states`, `browsers`) turn that off first, so nothing escapes them.

Automated checks cannot replace testing with people. See `docs/testing.md` for the screen-reader, low-end phone and Deaf user testing plans.
