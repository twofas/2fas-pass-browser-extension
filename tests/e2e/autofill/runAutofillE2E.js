// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';
import process from 'node:process';
import targetsRaw from './targets.js';
import { normalizeTargets } from './normalizeTargets.js';
import { RESULT, formatTable, exitCodeFor, colorize } from './report.js';
import {
  EXTENSION_PATH,
  PROFILE_DIR,
  launchExtension,
  pingSeam,
  waitForUnlock,
  getAutofillItem,
  triggerAutofill,
  getActiveTabId,
  getTabIdForUrl,
  waitForExtensionDetection,
  readAutofillValues,
  tryAcceptCrossDomainDialog,
  clickBeforeTest
} from './extensionDriver.js';

const log = (...a) => console.log('[autofill-e2e]', ...a);

// Color PASS green / FAIL red in the terminal. Opt out with NO_COLOR=1.
const useColor = !process.env.NO_COLOR;

const record = (results, target, result, detail = '') => results.push({ url: target.url, result, detail });

/**
* Tests one ALREADY-LOADED target on the foreground by driving the EXTENSION'S OWN code
* end to end: (1) GATE on the extension's detection (checkAutofillInputs via the seam),
* (2) trigger the real autofill (sendAutofillToTab), (3) VERIFY by reading back the
* values of the inputs the extension itself selected (getLoginInputs via the seam). The
* harness performs ZERO DOM / shadow-root / visibility / selector logic — all of that
* lives in the extension, so the test reproduces exactly what the extension does.
* Loading is overlapped by the caller's tab pool; this step stays serial because autofill
* targets the active/foreground tab and background tabs throttle SPA form rendering.
* @param {{page:import('playwright').Page, target:Object, loadResult:{ok:boolean,error?:string}, serviceWorker:import('playwright').Worker, relayPage:import('playwright').Page, item:Object}} ctx - Test context.
* @return {Promise<{result:string, detail:string}>} The PASS/FAIL outcome and detail.
*/
const testLoadedTarget = async ({ page, target, loadResult, serviceWorker, relayPage, item }) => {
  if (!loadResult.ok) {
    return { result: RESULT.FAIL, detail: `load failed: ${loadResult.error}` };
  }

  await page.bringToFront().catch(() => {});
  await page.waitForTimeout(500); // become visible; the content script already attached during preload

  // Pre-test clicks: some pages reveal/enable the login form only after an interaction
  // (e.g. a "Sign in" button or "Use password" toggle). Click the target's `clickBefore`
  // selector(s), in order, BEFORE the extension's detection runs. This is a user-style
  // page interaction, not detection/autofill logic — the extension still owns all input
  // finding + filling. A required selector that never appears is a FAIL.
  if (target.clickBefore.length > 0) {
    const clickErr = await clickBeforeTest(page, target.clickBefore);

    if (clickErr) {
      return { result: RESULT.FAIL, detail: `pre-test click failed — ${clickErr}` };
    }
  }

  const wantUser = target.expect.username;
  const wantPass = target.expect.password;

  // Resolve the Chrome tabId (the active tab of the focused window) — needed to drive
  // the extension's own code via the DEV background seam. Playwright does not expose it.
  let tabId = await getActiveTabId(serviceWorker);

  if (!tabId) {
    tabId = await getTabIdForUrl(serviceWorker, page.url());
  }

  if (!tabId) {
    return { result: RESULT.FAIL, detail: 'could not resolve tabId for the target tab' };
  }

  // GATE — the EXTENSION'S OWN detection. The seam injects the content script first
  // (exactly like sendAutofillToTab) then runs checkAutofillInputs() across all frames.
  // Poll up to 20s: many real login forms render asynchronously after `load`. A miss
  // here means the EXTENSION genuinely cannot find the login fields on this page — a
  // real signal, not a harness DOM-heuristic miss.
  const detection = await waitForExtensionDetection(relayPage, tabId, { wantUser, wantPass, timeoutMs: 20000 });
  const missing = (wantUser && !detection.canAutofillUsername) || (wantPass && !detection.canAutofillPassword);

  if (missing) {
    return { result: RESULT.FAIL, detail: `extension did not detect login inputs (expected user=${wantUser} pass=${wantPass}); got canUser=${detection.canAutofillUsername} canPass=${detection.canAutofillPassword} counts{u:${detection.usernameInputsCount},p:${detection.passwordInputsCount}}; url=${page.url()}` };
  }

  log(`${target.name}: tabId=${tabId} detect{u:${detection.canAutofillUsername},p:${detection.canAutofillPassword}} counts{u:${detection.usernameInputsCount},p:${detection.passwordInputsCount}}`);

  // Fire the real autofill flow (sendAutofillToTab) via the seam. Don't await yet: if a
  // cross-domain trust dialog appears, the flow blocks until we accept it (below).
  const autofillPromise = triggerAutofill(relayPage, tabId, item);

  // Poll for the values to land, reading them back THROUGH THE EXTENSION (readValues
  // seam → getLoginInputs). On every iteration ALWAYS try to accept the cross-domain
  // dialog the instant it appears — any target may show it (e.g. App Store Connect
  // embeds its login form in a cross-domain iframe). The check is non-blocking, so
  // targets without a dialog pay no penalty. The cross-domain path is a two-pass flow
  // (dialog → accept → re-fill), so allow a generous window. Break as soon as the
  // expected fields read back filled.
  let filled = { usernameValues: [], passwordLengths: [] };
  let dialogAccepted = false;
  const xdiag = { present: false, clicked: false, error: '' };
  const deadline = Date.now() + 12000;
  const userIsFilled = f => (f.usernameValues || []).some(v => v === item.username);
  const passIsFilled = f => (f.passwordLengths || []).some(n => n > 0);

  while (Date.now() < deadline) {
    if (!dialogAccepted) {
      const r = await tryAcceptCrossDomainDialog(page);
      xdiag.present = xdiag.present || r.present;

      if (r.error) {
        xdiag.error = r.error;
      }

      if (r.clicked) {
        dialogAccepted = true;
        xdiag.clicked = true;
      }
    }

    await page.waitForTimeout(500);

    const read = await readAutofillValues(relayPage, tabId);

    if (read && typeof read === 'object' && !read.error) {
      filled = read;
    }

    if ((!wantUser || userIsFilled(filled)) && (!wantPass || passIsFilled(filled))) {
      break;
    }
  }

  const autofillResult = await autofillPromise.catch(() => ({ error: 'autofill threw' }));
  const userOk = !wantUser || userIsFilled(filled);
  const passOk = !wantPass || passIsFilled(filled);

  if (userOk && passOk) {
    const shownUser = (filled.usernameValues || []).find(v => v === item.username) || '';
    const maxPwLen = (filled.passwordLengths || []).length ? Math.max(0, ...filled.passwordLengths) : 0;

    return { result: RESULT.PASS, detail: `filled user="${shownUser}" passLen=${maxPwLen}` };
  }

  const xinfo = `xdomain{present:${xdiag.present},clicked:${xdiag.clicked}${xdiag.error ? `,err:${xdiag.error}` : ''}}`;

  return { result: RESULT.FAIL, detail: `not filled (expected user=${wantUser} pass=${wantPass}); got userValues=${JSON.stringify(filled.usernameValues)} passLengths=${JSON.stringify(filled.passwordLengths)}; autofill=${JSON.stringify(autofillResult)} ${xinfo}` };
};

/**
* Runs the autofill E2E suite across all targets.
* @return {Promise<void>} Resolves after exiting the process.
*/
const main = async () => {
  if (!fs.existsSync(EXTENSION_PATH)) {
    log('SETUP FAILURE: dev build not found at', EXTENSION_PATH);
    log('  • `yarn test:autofill` builds it first (wxt build --mode development) — did the build step fail?');
    process.exit(2);
  }

  // Always start from a FRESH profile. A persistent Chromium profile caches the
  // extension's MV3 service worker and keeps serving the STALE cached SW across
  // rebuilds — so the DEV autofill seam from the new build is absent at runtime and
  // every seam message resolves `undefined` (the bug that made this harness look
  // broken). A first-time (fresh) profile registers the SW from disk, so the current
  // build's seam is always live. The trade-off is pairing + unlocking once per run,
  // which the harness already prompts for and waits on. (Surgical SW-cache deletion
  // was tried and corrupts the extension load; full wipe is the reliable option.)
  try {
    fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
    log('Fresh profile at', PROFILE_DIR, '— you will connect (scan QR) + unlock once for this run.');
  } catch (e) {
    log('Could not reset profile:', e?.message || e);
  }

  const targets = normalizeTargets(targetsRaw);
  const results = [];
  const { context, serviceWorker, extensionId } = await launchExtension();

  try {
    // Preflight: confirm the loaded build actually contains the DEV autofill seam,
    // BEFORE asking the user to spend time pairing. Catches "forgot to rebuild" /
    // "loaded a prod build" with a clear message instead of a confusing empty vault.
    log('Verifying the DEV autofill seam is present in the loaded build…');
    const seamLive = await pingSeam(context, extensionId);

    if (!seamLive) {
      log('SETUP FAILURE: the loaded extension build has no DEV autofill seam.');
      log('  • test:autofill builds with --mode development, so this is unexpected — confirm the build produced a DEV build.');
      log('  • The seam is DEV-only (import.meta.env.DEV) — a production build will never have it.');
      await context.close().catch(() => {});
      process.exit(2);
    }

    log('Checking connection/unlock…');

    // waitForUnlock returns the popup page (kept open) — reused as the message relay
    // for the DEV background seam (the popup is a real extension context with chrome.runtime).
    const relayPage = await waitForUnlock(context, extensionId, {
      onWaiting: route => {
        log('A 2FAS Pass popup tab has opened in the Chromium window.');

        if (route === '/connect') {
          log('→ Scan its QR code with your mobile app and unlock. Do NOT close or reload that tab.');
        } else {
          log(`→ Complete connect/unlock in that tab (current screen: "${route}"). Do NOT close or reload it.`);
        }

        log('Waiting for the unlocked items view (route "/"), up to 10 min…');
      },
      onState: route => log(`popup moved to "${route}"`),
      onTick: (secs, route) => log(`…still waiting (${secs}s, popup at "${route}")`)
    });

    if (!relayPage) {
      log('SETUP FAILURE: extension never reached the unlocked items view within timeout.');
      await context.close().catch(() => {});
      process.exit(2);
    }

    // Pick the autofill item from the FULL vault via the DEV background seam (not the
    // popup UI, which virtualizes its list): a Login in Security Tier "Secret" (2) that
    // has BOTH a username and a password.
    const item = await getAutofillItem(relayPage);
    log(`Unlocked. Vault has ${item.total} Login item(s).`);

    if (!item.itemId) {
      log('SETUP FAILURE: no Login in Security Tier "Secret" with BOTH a username and a password was found.');

      if (item.error) {
        log(`  • seam error: ${item.error}`);
      } else {
        log('  • add such a login (Secret tier, with both a username and a password) to the connected vault.');
      }

      await context.close().catch(() => {});
      process.exit(2);
    }

    log(`Using item: username="${item.username}".`);

    // Sliding-window tab pool. The autofill+assert step is serial (it targets the
    // active/foreground tab, and background tabs throttle SPA form rendering), but the
    // dominant cost — network load — is overlapped: we preload up to POOL tabs in
    // PARALLEL, test in order on the foreground, and recycle each finished tab to
    // preload the next URL. The window stays full (POOL loads always in flight), so by
    // the time we reach target i its load has already finished — no network wait in the
    // hot path. Tune the width with AUTOFILL_POOL (default 10).
    const POOL = Math.max(1, Math.min(Number(process.env.AUTOFILL_POOL) || 10, targets.length));
    log(`Running ${targets.length} target(s), preloading up to ${POOL} tab(s) in parallel…`);

    const openPages = [];
    const inFlight = new Map(); // targetIndex -> { page, gotoPromise }
    let nextToLoad = 0;

    const startLoad = (targetIndex, page) => {
      const t = targets[targetIndex];
      const gotoPromise = page
        .goto(t.url, { waitUntil: 'load', timeout: 30000 })
        .then(() => ({ ok: true }))
        .catch(e => ({ ok: false, error: e?.message || String(e) }));

      inFlight.set(targetIndex, { page, gotoPromise });
    };

    // Prime the pool: open POOL tabs and kick off the first POOL loads concurrently.
    for (let i = 0; i < POOL && nextToLoad < targets.length; i++) {
      const page = await context.newPage();
      openPages.push(page);
      startLoad(nextToLoad, page);
      nextToLoad++;
    }

    // Consume targets in order; recycle each finished tab to preload the next URL.
    for (let ti = 0; ti < targets.length; ti++) {
      const slot = inFlight.get(ti);
      inFlight.delete(ti);

      const loadResult = await slot.gotoPromise;
      const { result, detail } = await testLoadedTarget({ page: slot.page, target: targets[ti], loadResult, serviceWorker, relayPage, item });

      record(results, targets[ti], result, detail);
      log(`[${ti + 1}/${targets.length}] ${colorize(result, result, useColor)}  ${targets[ti].url}${detail ? `  — ${detail}` : ''}`);

      if (nextToLoad < targets.length) {
        startLoad(nextToLoad, slot.page); // recycle this tab for the next URL
        nextToLoad++;
      }
    }

    await Promise.all(openPages.map(p => p.close().catch(() => {})));
  } finally {
    console.log('\n' + formatTable(results, { color: useColor }) + '\n');
    await context.close().catch(() => {});
  }

  process.exit(exitCodeFor(results, { setupFailure: false }));
};

main().catch(e => {
  console.error('[autofill-e2e] fatal', e);
  process.exit(2);
});
