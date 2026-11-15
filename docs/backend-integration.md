# Connecting a real backend

Tanaw's accounts and administrator console are a **frontend demonstration**. The interfaces, validation, roles and states all work, but they run in the visitor's browser with no server behind them. This document says exactly what that means, and where a real backend connects.

## 1. The one rule

**Nothing that runs in a browser can protect anything.** Anyone can open `admin.html`, read every script, edit `localStorage`, and give themselves the administrator role. So in this build:

| Looks like | Actually is |
| --- | --- |
| A separate administrator page | A way of organizing the interface. Anyone can open it |
| The console's gate | A check that decides what the page shows, in a browser its user controls |
| Hidden admin links for non-administrators | Tidiness. The address still works |
| Password hashing (PBKDF2) | A demonstration of good handling. The hash sits beside everything else, readable by anyone with the device |
| Account lockout | A demonstration of the experience. Clearing storage removes it |
| The activity log | A list its subject can edit. It proves nothing |

A real system enforces all of this **on the server, on every request**, whatever the interface shows or hides.

## 2. How the code is arranged for this

```
Pages (views/account.js, admin/*.js)
        │  only ever call
        ▼
core/auth.js          what the interface needs: who is logged in, form rules, events
        │  only ever calls
        ▼
T.backend             core/backend-demo.js  +  admin/demo-admin.js    ← replace these two files
```

Nothing above `T.backend` knows where data lives. To connect a server, write `core/backend-http.js` and `admin/http-admin.js` with the same methods (section 3), load them instead of the demo files in `index.html`, `admin.html` and `sw.js`, and remove the demonstration wording (section 6).

All methods return promises except the four marked **sync**, which must answer before first paint or while drawing.

## 3. The contract

### Sessions and accounts: `T.backend`

| Method | Suggested endpoint | What the server must do |
| --- | --- | --- |
| `supported()` **sync** | none | Return `true`. Only the demo needs Web Crypto in the browser |
| `restoreSession()` **sync** → `{ user, ended }` | none (reads a small cache of the last known user) | Keep a non-secret copy of `{ id, name, email, role, status, mustChange }` for first paint, then confirm it with `GET /session` in the background and call the `onChange` listeners if it differs. A stale copy can only change what is shown, never what is allowed |
| `siteInfo()` **sync** → `{ notice, registration }` | cached from `GET /site` | Public, read-only |
| `onChange(fn)` **sync** | none, or server-sent events | Tell the page when the session, accounts or site settings changed elsewhere. `fn('session' \| 'accounts' \| 'site')` |
| `touch()` | `GET /session` | Re-check the session, for example when a tab becomes visible |
| `hasAdmin()` | none: **remove** | A real system creates its first administrator during deployment. See section 4 |
| `register({ name, email, password, remember })` | `POST /auth/register` | Validate again. Hash the password on the server (Argon2id or similar). Create a `learner`, **ignoring any role sent by the client**. Verify the email. Start a session |
| `createFirstAdmin(input)` | none: **remove** | See section 4 |
| `login({ email, password, remember })` | `POST /auth/login` | Compare hashes. Rate-limit by account and by address. Lock out on the server. Same answer and timing for "no such account" and "wrong password". Set the session cookie |
| `logout()` | `POST /auth/logout` | Revoke the session on the server |
| `updateProfile({ name, email, password })` | `PATCH /me` | Validate again. Require the password, and re-verify the address, for an email change |
| `changePassword({ current, next })` | `POST /me/password` | Verify `current`. End the account's other sessions |
| `deleteAccount({ password })` | `DELETE /me` | Verify the password. Delete or anonymize the person's data, according to your privacy policy |

**Sessions:** use an `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`) cookie, with CSRF protection on every state-changing request. Do not keep tokens in `localStorage`, where any script on the page can read them.

**Errors:** throw `new T.AuthError(message, fields, extra)`. `fields` maps a form field to its message, which the forms show inline and in the summary. `extra.lockedFor` is in seconds.

### Administrator tools: `T.backend.admin`

**Every endpoint here must check, on the server: is there a valid session, and does that account have the administrator role?** This is the check the demo cannot do, and it is what makes an administrator's page safe. Without it, hiding the page achieves nothing.

| Method | Suggested endpoint | Notes for the server |
| --- | --- | --- |
| `listUsers()` | `GET /admin/users` | Never return hashes or tokens. Paginate |
| `createUser({ name, email, role })` → `{ user, temp }` | `POST /admin/users` | Prefer an emailed invitation to a temporary password |
| `setRole(id, role)` | `PUT /admin/users/:id/role` | Refuse to remove the last administrator |
| `setStatus(id, 'active' \| 'disabled')` | `PUT /admin/users/:id/status` | Disabling ends the account's sessions at once |
| `unlock(id)` | `POST /admin/users/:id/unlock` | |
| `resetPassword(id)` → temporary password | `POST /admin/users/:id/reset` | Prefer an emailed reset link, so an administrator never sees a password |
| `removeUser(id)` | `DELETE /admin/users/:id` | Refuse to remove the last administrator |
| `stats()` | `GET /admin/stats` | Only what the console needs. Never journals or reflections |
| `listEvents()` / `clearEvents()` | `GET /admin/events` | An append-only audit log, written by the server. **Remove `clearEvents`** |
| `site()` | `GET /admin/site` | |
| `setNotice(notice \| null)` | `PUT /admin/site/notice` | Sanitize. Visible to every visitor |
| `setRegistration('open' \| 'closed')` | `PUT /admin/site/registration` | The server must refuse registrations too, not just the page |
| `listReviews()` | `GET /admin/reviews` | |
| `saveReview(key, record, meta)` | `PUT /admin/reviews/:key` | Record who changed what and when. See section 5 |
| `usage()` | none: **remove** | Describes browser storage only |
| `exportData()` / `importData(text)` | database backups: **remove** | Backups belong to the server, and must not travel through a browser |
| `addSamples()` / `removeSamples()` | none: **remove** | For demonstrating the console only |
| `resetAll()` | none: **remove** | |

### Progress: `core/store.js`

Each account's progress is kept under its own key (`tanaw.state.v1.u.<id>`), selected with `T.store.useProfile()`. To sync it, add `GET`/`PUT /me/progress` beside the existing `saveNow()`, keep `localStorage` as the offline copy, and merge by timestamp when a device returns online. Progress, journals and reflections are personal data, so **do a privacy assessment first** and tell people plainly what leaves their device.

## 4. The first administrator

The demo creates one with a form on `admin.html`: whoever opens it first becomes the administrator. That is acceptable only because nothing here is protected, and it avoids shipping a built-in password. **Never keep this flow with a real backend.** Create the first administrator during deployment, for example with a command run on the server, and remove `hasAdmin()`, `createFirstAdmin()` and `gateSetup()` in `admin/console.js`.

## 5. The review ledger

The ledger (`admin/review.js`) lists every piece of content and records whether anyone has reviewed it. It starts empty, and shows how much a Deaf reviewer has looked at as the console's headline number.

A real version should keep each review's history rather than overwriting it, and let reviewers record their own reviews with their own accounts, since a review of Deaf content should come from Deaf reviewers rather than be typed in on their behalf. It deliberately **does not change any public label**: the "Experimental" and "not reviewed by Deaf organizations" wording changes only when the team decides, with the reviewers' permission, as `docs/testing.md` section 5 says.

## 6. Demonstration wording to change

Only once a real backend is connected, and only for what it actually makes true:

- `views/account.js`: `demoLine()`, the threshold page's side panel, `.account__demo`, and the "Forgot your password?" text
- `core/shell.js`: `.account-menu__note`
- `admin/console.js`: `.c-strip`, `.c-gate__demo`, `.c-gate__truth`
- `admin/system.js`: the `READINESS` table and `.c-truth`
- `views/about.js`: the status row, the limits and the privacy list
- `index.html`: the footer note
- `README.md`, section 8

## 7. Minimum before real people use it

- All of section 3 on the server, including role checks on every admin endpoint
- HTTPS everywhere, secure cookies, CSRF protection, a Content Security Policy
- Rate limiting and lockout on the server
- Email verification and a real password reset
- A privacy assessment under the Philippine [Data Privacy Act of 2012 (RA 10173)](https://www.privacy.gov.ph/data-privacy-act/), a privacy notice, and data deletion on request
- An independent security review
- Testing with Deaf users, including whether the account flows work well for people whose first language is FSL
