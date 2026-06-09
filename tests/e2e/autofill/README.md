# Autofill E2E harness

Real-browser end-to-end tests for the full autofill flow: **input detection → optional
cross-domain dialog acceptance → real decrypted value-setting** in page inputs.

These tests load the **actual built extension** in Chromium (Playwright), require a
**real connected + unlocked** extension (paired with the mobile app), and run against an
**array of live URLs**.

## Prerequisites

1. `yarn test:autofill` **builds the dev extension itself** (`wxt build --mode development`)
   before launching, so you don't pre-build. That build always contains the DEV autofill
   seam, which is gated by `import.meta.env.DEV` (a production build never has it). The
   harness still fails fast with a clear message if, somehow, the loaded build lacks it.
2. Playwright + its Chromium browser installed (`yarn add -D playwright` already adds the
   package; `npx playwright install chromium` fetches the browser if missing).
3. The connected (test) vault must contain **at least one Login in Security Tier "Secret"
   (tier 2) that has BOTH a username and a password** — the harness picks that item from the
   full vault (via a DEV-only service-worker seam that calls `getItems(['Login'])`, not the
   virtualized popup UI) and autofills it; it does **not** need to match the page.
4. You at the keyboard once per run: a popup tab opens in the launched window; scan its QR
   with the mobile app to connect, then unlock.

## ⚠️ Why a FRESH profile every run (read this)

The harness **wipes its profile (`.wxt/e2e-autofill-profile`) before every run** and pairs
from scratch. This is deliberate, not an oversight:

A **persistent** Chromium profile caches the extension's MV3 **service worker** and keeps
serving the **stale cached SW** across rebuilds. The new build's seam is present on disk but
**absent from the running SW**, so every seam message resolves `undefined` and the harness
looks broken (vault count `0`, "no response from e2e seam"). `chrome.runtime.reload()` breaks
Playwright's CDP link, and deleting only the SW-cache dirs corrupts the extension load — so a
**first-time (fresh) profile**, which registers the SW from disk, is the reliable fix.

The cost is connecting (scan QR) + unlocking **once per run**, which the harness prompts for
and waits on (up to 10 minutes). Because we re-pair each run, build-time key regeneration is
irrelevant.

## Running

```bash
yarn test:autofill
```

The harness:

1. **Builds** the dev extension (`wxt build --mode development --mv3`), then launches headed
   Chromium with it and a **freshly wiped** profile.
2. **Preflight:** verifies the DEV autofill seam is live in the running SW (independent of
   pairing). If not, it exits immediately.
3. Opens a **2FAS Pass popup tab** and waits for it to reach the unlocked items view.
   **Scan the QR code shown in that tab** with your mobile app and unlock. The harness polls
   the popup in place and **never reloads it**, so the QR stays valid — do not close or reload
   that tab while it waits.
4. Tests every URL (see **Speed** below) by driving the extension's OWN code via the DEV
   background seam: it **gates** on the extension's detection (`checkAutofillInputs()`),
   triggers the real autofill (`sendAutofillToTab`), **always accepts the cross-domain trust
   dialog** the moment it appears, and **verifies** by reading back the values of the inputs
   the extension itself selected (`getLoginInputs()`). The harness does NO DOM / shadow-root /
   visibility / selector logic of its own — see **Why the harness never inspects the DOM**.
5. Prints a `PASS / FAIL` table and exits non-zero if anything FAILed.

It is a **manual / on-demand** check — it is **not** wired into `yarn all-build`, `yarn dev`,
or plain `yarn test`. Run it yourself before shipping autofill-affecting changes.

## Speed (tab pool)

Network load dominates, so the harness overlaps it. It preloads up to **`AUTOFILL_POOL`**
tabs (default **10**) in parallel, tests them **in order on the foreground one at a time**
(autofill must target the active tab, and background tabs throttle SPA form rendering), and
recycles each finished tab to preload the next URL. The window stays full, so by the time a
target is tested its page has usually finished loading — the per-target cost is mostly just
the form-render + fill wait, not the network round-trip.

```bash
AUTOFILL_POOL=5 yarn test:autofill   # narrower window (less RAM / gentler on flaky networks)
```

## Adding / changing URLs

Edit [`targets.js`](./targets.js). Each entry is a string or an object:

```js
export default [
  'https://logon.vanguard.com/logon',                              // expects username + password
  { url: 'https://accounts.google.com/signin',
    expect: { username: true, password: false } },                 // username-first page
  'https://appstoreconnect.apple.com/login',                       // login form in a cross-domain iframe
  { url: 'https://example.com/account',
    clickBefore: '#open-login' },                                  // click to reveal the login form first
  { url: 'https://example.com/checkout',
    clickBefore: ['#sign-in', 'button.use-password'] },            // multiple clicks, in order
];
```

- `expect` defaults to `{ username: true, password: true }`.
- `clickBefore` — a CSS selector (or array of selectors clicked in order) to click **before**
  input detection, for pages that reveal/enable the login form only after an interaction
  (e.g. a "Sign in" button or "Use password" toggle). Each selector is searched across all
  frames (top frame and iframes), waited for (up to 8s), then clicked. A required selector
  that never appears is a **FAIL** (`pre-test click failed — <selector>: …`).
- **Cross-domain dialogs are always accepted automatically** — no per-target flag needed.
  When autofill into a cross-domain iframe triggers the trust dialog, the harness clicks
  *Accept* the moment it appears (the legacy `crossDomain: true` flag is still parsed but
  has no effect). To make this work, the content script's shadow root is opened in DEV
  builds only (`mode: import.meta.env.DEV ? 'open' : 'closed'`) so Playwright can pierce
  it; production stays `closed`.

## Result meaning

**Every target is treated as a guaranteed login page.** Detection AND verification both run
the **extension's own code** (via the seam), so a FAIL means the extension itself couldn't
do it — never a harness DOM heuristic.

- **PASS** — the extension **detected** the expected inputs and, after autofill, **read its
  own filled value back** (a username input whose value === the test item's username, and/or
  a password input with length > 0).
- **FAIL** (blocks build) — page failed to load, the **extension** did not detect an expected
  username/password input (polls up to 20s for async/SPA forms), the tab couldn't be
  resolved, or autofill didn't land the value in the extension's own detected inputs.
- A target that is genuinely username-first (e.g. Google) should declare
  `expect: { username: true, password: false }` so the absent password field isn't a FAIL.
- Exit code: `0` ok, `1` at least one FAIL, `2` setup failure (no dev build with the seam /
  never unlocked / no Secret-tier Login with both a username and a password).

## Why the harness never inspects the DOM

The harness must validate the **extension**, not a parallel reimplementation of it. So it
never runs its own `querySelectorAll`, shadow-DOM traversal, visibility check, or
username/password heuristic — those would inevitably drift from the extension's real
`getUsernameInputs` / `getPasswordInputs` / `isVisible` / `getShadowRoots`, letting the suite
pass while the extension regresses (or vice-versa). Instead, three DEV-only seam actions run
the extension's actual code in the page:

- **`detect`** → `injectCSIfNotAlready` + `checkAutofillInputs()` across all frames (the GATE).
- **`autofill`** → the real `sendAutofillToTab`.
- **`readValues`** → reads the values of the inputs `getLoginInputs()` selects (VERIFY); returns
  username values and password **lengths** only (password content never leaves the frame).

`getLoginInputs()` is the single source of truth shared by `checkAutofillInputs()`,
`autofill()`, and the read seam, so detection, filling, and verification can never disagree
about what "the login fields" are. The harness only orchestrates: launch, unlock, resolve the
Chrome tabId, trigger, click the cross-domain dialog (simulating the user), and assert on seam
data. All seams are `import.meta.env.DEV`-gated and stripped from production.
