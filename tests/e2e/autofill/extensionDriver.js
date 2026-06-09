// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global chrome */
// `chrome` is referenced only inside serviceWorker/popup evaluate() callbacks, which run
// in extension contexts where chrome.* is the global API.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

export const EXTENSION_PATH = path.join(REPO_ROOT, '.output', 'chrome-mv3-dev');
export const PROFILE_DIR = path.join(REPO_ROOT, '.wxt', 'e2e-autofill-profile');

// Selectors.
// - crossDomainAccept: real content-script class (crossDomainDialog.js).
// (Unlock detection uses the HashRouter route, not a DOM marker — see waitForUnlock.
// Detection, item selection, autofill, and value read-back all go through the DEV
// background seam, which runs the extension's own code — never the harness's DOM logic.)
export const SELECTORS = {
  crossDomainAccept: '.twofas-pass-cross-domain-dialog-btn-accept'
};

/**
* Launches headed Chromium with the built dev extension and a persistent profile.
* @return {Promise<{context:import('playwright').BrowserContext, serviceWorker:import('playwright').Worker, extensionId:string}>} The launched context.
*/
export const launchExtension = async () => {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  let [serviceWorker] = context.serviceWorkers();

  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30000 });
  }

  const extensionId = new URL(serviceWorker.url()).host;

  return { context, serviceWorker, extensionId };
};

/**
* Returns the id of the active tab in the focused window. After bringing the target
* page to the front, this is the most reliable way to learn its Chrome tabId (which
* Playwright does not expose) — used to drive the extension's autofill at that tab.
* @param {import('playwright').Worker} sw - The extension service worker.
* @return {Promise<number|null>} The active tab id, or null.
*/
export const getActiveTabId = sw =>
  sw.evaluate(async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

      return tabs && tabs[0] ? tabs[0].id : null;
    } catch {
      return null;
    }
  });

/**
* Finds the Chrome tabId whose URL matches (after redirects), falling back to same-origin.
* @param {import('playwright').Worker} sw - The extension service worker.
* @param {string} url - The page URL to match.
* @return {Promise<number|null>} The matched tab id, or null.
*/
export const getTabIdForUrl = (sw, url) =>
  sw.evaluate(async url => {
    const tabs = await chrome.tabs.query({});
    const exact = tabs.find(t => t.url === url);

    if (exact) {
      return exact.id;
    }

    let origin = null;

    try {
      origin = new URL(url).origin;
    } catch {
      origin = null;
    }

    const byOrigin = tabs.find(t => {
      try {
        return new URL(t.url).origin === origin;
      } catch {
        return false;
      }
    });

    return byOrigin ? byOrigin.id : null;
  }, url);

/**
* Reads the popup's current HashRouter route (e.g. '/connect', '/fetch', '/').
* @param {import('playwright').Page} page - The popup page.
* @return {string} The route path, or '' if unknown.
*/
const popupRoute = page => {
  try {
    const hash = new URL(page.url()).hash || '';
    const path = hash.replace(/^#/, '');

    return path === '' ? '/' : path;
  } catch {
    return '';
  }
};

/**
* Waits until the popup reaches its unlocked items view (ThisTab, route '/').
*
* Detection uses the HashRouter route, NOT a DOM element: the RouteGuard keeps the
* popup on '/connect' while not unlocked and only allows the protected index route
* '/' once unlocked, so reaching '/' means unlocked regardless of whether the vault
* has any items (the previous `#search` marker did not render on an empty vault).
*
* Opens the popup once as a tab and polls IN PLACE — it must never reload it (the
* Connect screen shows a QR code the user scans; a reload regenerates the QR / tears
* down the in-progress WebSocket connection). The route is required to stay '/' for
* two consecutive polls to ignore the brief pre-redirect '/' on initial boot.
* @param {import('playwright').BrowserContext} context - The browser context.
* @param {string} extensionId - The extension id.
* @param {{timeoutMs?:number,pollMs?:number,onWaiting?:Function,onState?:Function,onTick?:Function}} [opts] - Wait options.
* @return {Promise<import('playwright').Page|null>} The unlocked popup page (kept open, reused as the message relay), or null on timeout.
*/
export const waitForUnlock = async (context, extensionId, opts = {}) => {
  const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;
  const pollMs = opts.pollMs ?? 1500;
  const url = `chrome-extension://${extensionId}/popup.html`;
  let page = await context.newPage();
  await page.goto(url).catch(() => {});

  try {
    const started = Date.now();
    const deadline = started + timeoutMs;
    const ticksPerHeartbeat = Math.max(1, Math.round(20000 / pollMs));
    let ticks = 0;
    let lastRoute = null;
    let stableUnlocked = 0;

    while (Date.now() < deadline) {
      if (page.isClosed()) {
        page = await context.newPage();
        await page.goto(url).catch(() => {});
        lastRoute = null;
      }

      const route = popupRoute(page);

      if (route === '/') {
        stableUnlocked++;

        if (stableUnlocked >= 2) {
          return page; // keep the popup open — it is reused as the message relay
        }
      } else {
        stableUnlocked = 0;
      }

      if (ticks === 0 && opts.onWaiting) {
        opts.onWaiting(route);
      } else if (route !== lastRoute && lastRoute !== null && opts.onState) {
        opts.onState(route);
      } else if (opts.onTick && ticks % ticksPerHeartbeat === 0) {
        opts.onTick(Math.round((Date.now() - started) / 1000), route);
      }

      lastRoute = route;
      ticks++;
      await page.waitForTimeout(pollMs).catch(() => {});
    }

    if (!page.isClosed()) {
      await page.close().catch(() => {});
    }

    return null;
  } catch (e) {
    if (!page.isClosed()) {
      await page.close().catch(() => {});
    }

    throw e;
  }
};

/**
* Verifies the DEV autofill seam is present in the loaded build — independent of
* pairing/unlock. Sends an unknown 'e2e' action; the seam replies with
* {error:'unknown e2e action: ...'}. If nothing answers (resolves undefined), the
* loaded build has no seam (e.g. a production build, or the dev build was not rebuilt
* after editing the seam). This is the fail-fast preflight: it distinguishes "seam
* missing" from "vault empty" before the user spends time pairing.
* @param {import('playwright').BrowserContext} context - The browser context.
* @param {string} extensionId - The extension id.
* @return {Promise<boolean>} True if the seam responded (is live in the running SW).
*/
export const pingSeam = async (context, extensionId) => {
  const page = await context.newPage();

  try {
    await page.goto(`chrome-extension://${extensionId}/popup.html`).catch(() => {});
    await page.waitForTimeout(800);

    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await page.evaluate(async () => {
        try {
          return await chrome.runtime.sendMessage({ target: 'e2e', action: '__ping__' });
        } catch (e) {
          return { __threw: e?.message || String(e) };
        }
      }).catch(() => null);

      if (res && typeof res === 'object' && typeof res.error === 'string' && res.error.includes('unknown e2e action')) {
        return true;
      }

      await page.waitForTimeout(400);
    }

    return false;
  } finally {
    await page.close().catch(() => {});
  }
};

/**
* Asks the DEV-only background seam (message relayed through the popup page) for one
* Login that is Secret-tier with BOTH a username and a password, plus the full Login
* count — read from the WHOLE vault, not the virtualized popup list. Retries briefly
* in case the service worker is still waking. Messaging (not a raw SW-global evaluate)
* is required: a real message runs the background startup before dispatching.
* @param {import('playwright').Page} relayPage - An open extension page (the popup) used to message the background.
* @return {Promise<{total:number,deviceId?:string,vaultId?:string,itemId?:string,username?:string,error?:string}>} The item info.
*/
export const getAutofillItem = async relayPage => {
  let last = { total: 0, error: 'no response' };

  for (let attempt = 0; attempt < 10; attempt++) {
    last = await relayPage.evaluate(async () => {
      try {
        return await chrome.runtime.sendMessage({ target: 'e2e', action: 'getAutofillItem' });
      } catch (e) {
        return { total: 0, error: e?.message || String(e) };
      }
    }).catch(e => ({ total: 0, error: e?.message || String(e) }));

    // sendMessage resolves to undefined when no handler answered (e.g. seam not in
    // the loaded build). Normalise so callers never read props of undefined.
    if (!last || typeof last !== 'object') {
      last = { total: 0, error: 'no response from e2e seam (DEV build / live SW expected — see preflight)' };
    }

    if (last.itemId || (typeof last.total === 'number' && last.total > 0)) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return last;
};

/**
* Triggers the real sendAutofillToTab flow for a specific item via the DEV-only
* background seam (message relayed through the popup page).
* @param {import('playwright').Page} relayPage - An open extension page (the popup) used to message the background.
* @param {number} tabId - The target tab id.
* @param {{deviceId:string,vaultId:string,itemId:string}} item - The item to autofill.
* @return {Promise<{ok?:boolean,error?:string}>} The trigger result.
*/
export const triggerAutofill = (relayPage, tabId, item) =>
  relayPage.evaluate(async ({ tabId, item }) => {
    try {
      return await chrome.runtime.sendMessage({
        target: 'e2e',
        action: 'autofill',
        tabId,
        deviceId: item.deviceId,
        vaultId: item.vaultId,
        itemId: item.itemId
      });
    } catch (e) {
      return { error: e?.message || String(e) };
    }
  }, { tabId, item }).catch(e => ({ error: e?.message || String(e) }));

/**
* Runs the EXTENSION'S OWN login-input detection for a tab via the DEV background seam
* (relayed through the popup). The seam injects the content script first (exactly like
* sendAutofillToTab) and OR-aggregates checkAutofillInputs() across every frame. The
* harness asks the extension "what can you autofill here?" — it never inspects the DOM,
* shadow roots, selectors, or visibility itself. This is the form-present GATE.
* @param {import('playwright').Page} relayPage - The popup relay page.
* @param {number} tabId - The target tab id.
* @return {Promise<{canAutofillUsername:boolean,canAutofillPassword:boolean,usernameInputsCount:number,passwordInputsCount:number,error?:string}>} The extension's detection result.
*/
export const detectLoginInputs = (relayPage, tabId) =>
  relayPage.evaluate(async tabId => {
    try {
      return await chrome.runtime.sendMessage({ target: 'e2e', action: 'detect', tabId });
    } catch (e) {
      return { error: e?.message || String(e) };
    }
  }, tabId).catch(e => ({ error: e?.message || String(e) }));

/**
* Polls the extension's detection (detectLoginInputs) until it reports the expected
* login inputs, or the timeout elapses. Real login pages (Auth0/Okta/SPA apps like
* Vanguard) inject their form asynchronously, well after `load`, so a single check would
* miss them. "Not detected" at timeout is a REAL signal that the extension cannot find
* the fields on this page — not a harness DOM-heuristic miss.
* @param {import('playwright').Page} relayPage - The popup relay page.
* @param {number} tabId - The target tab id.
* @param {{wantUser:boolean,wantPass:boolean,timeoutMs?:number,pollMs?:number}} opts - Expectations + timing.
* @return {Promise<{canAutofillUsername:boolean,canAutofillPassword:boolean,usernameInputsCount:number,passwordInputsCount:number}>} The last detection result.
*/
export const waitForExtensionDetection = async (relayPage, tabId, opts) => {
  const wantUser = opts.wantUser;
  const wantPass = opts.wantPass;
  const timeoutMs = opts.timeoutMs ?? 20000;
  const pollMs = opts.pollMs ?? 500;
  const deadline = Date.now() + timeoutMs;
  let last = { canAutofillUsername: false, canAutofillPassword: false, usernameInputsCount: 0, passwordInputsCount: 0 };

  while (Date.now() < deadline) {
    const res = await detectLoginInputs(relayPage, tabId);

    if (res && typeof res === 'object' && !res.error) {
      last = res;
    }

    const userReady = !wantUser || last.canAutofillUsername;
    const passReady = !wantPass || last.canAutofillPassword;

    if (userReady && passReady) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, pollMs));
  }

  return last;
};

/**
* Reads back, VIA THE EXTENSION, the values of the exact inputs autofill() targets —
* through the DEV background seam (relayed through the popup), which injects the content
* script and aggregates getLoginInputs() values across every frame. The harness verifies
* fills with this, so it never inspects the DOM, shadow roots, or visibility itself: it
* uses the extension's own selection logic. Password CONTENT never leaves the frame —
* only lengths are returned.
* @param {import('playwright').Page} relayPage - The popup relay page.
* @param {number} tabId - The target tab id.
* @return {Promise<{usernameValues:string[],passwordLengths:number[],error?:string}>} The read-back values.
*/
export const readAutofillValues = (relayPage, tabId) =>
  relayPage.evaluate(async tabId => {
    try {
      return await chrome.runtime.sendMessage({ target: 'e2e', action: 'readValues', tabId });
    } catch (e) {
      return { error: e?.message || String(e) };
    }
  }, tabId).catch(e => ({ error: e?.message || String(e) }));

/**
* Accepts the cross-domain trust dialog IF it is showing right now — a quick,
* non-blocking check meant to be called repeatedly during the fill poll, so targets
* that never show a dialog pay no fixed-wait penalty. Clicking it simulates the USER
* accepting (legitimate harness UI interaction, not detection). The dialog lives in the
* TOP frame's shadow root, which is `mode: 'closed'` in production but **open in DEV
* builds** (see entrypoints/content/index.js) precisely so Playwright's CSS locators
* can pierce it here.
* @param {import('playwright').Page} page - The target page.
* @return {Promise<{present:boolean,clicked:boolean,error?:string}>} Whether the accept button was present and whether it was clicked this call.
*/
export const tryAcceptCrossDomainDialog = async page => {
  const accept = page.locator(SELECTORS.crossDomainAccept).first();
  let present = false;

  try {
    present = (await accept.count()) > 0;

    if (present && await accept.isVisible()) {
      await accept.click({ timeout: 2000 });

      return { present: true, clicked: true };
    }
  } catch (e) {
    return { present, clicked: false, error: (e?.message || String(e)).slice(0, 120) };
  }

  return { present, clicked: false };
};

/**
* Clicks each pre-test selector (in order) BEFORE the extension's detection runs — for
* pages that reveal/enable the login form only after an interaction (e.g. a "Sign in"
* button or a "Use password" toggle). This is a user-style page interaction, NOT
* detection/autofill logic — the extension still owns all input finding + filling.
* Each selector is searched across ALL frames (top frame first, then iframes), polling
* up to `timeoutMs` for it to appear and become visible, then clicked. A short settle
* follows each click so its reveal/transition can start before the next step.
* @param {import('playwright').Page} page - The target page.
* @param {string[]} selectors - CSS selectors to click, in order.
* @param {{timeoutMs?:number}} [opts] - Timing options.
* @return {Promise<string|null>} Null on success, or an error string naming the failing selector.
*/
export const clickBeforeTest = async (page, selectors, opts = {}) => {
  const timeoutMs = opts.timeoutMs ?? 8000;

  for (const selector of selectors) {
    const deadline = Date.now() + timeoutMs;
    let found = null;

    while (Date.now() < deadline && !found) {
      for (const frame of page.frames()) {
        const loc = frame.locator(selector).first();

        try {
          if ((await loc.count()) > 0 && (await loc.isVisible())) {
            found = loc;
            break;
          }
        } catch {
          // Frame detached / cross-origin eval race — skip and retry on the next poll.
        }
      }

      if (!found) {
        await page.waitForTimeout(250).catch(() => {});
      }
    }

    if (!found) {
      return `${selector}: not found/visible in any frame`;
    }

    try {
      await found.click({ timeout: 5000 });
    } catch (e) {
      return `${selector}: ${(e?.message || String(e)).split('\n')[0]}`;
    }

    await page.waitForTimeout(400).catch(() => {});
  }

  return null;
};
