// SPDX-License-Identifier: BUSL-1.1
//
// Combined CONNECT + AUTOFILL phase (semi-automated).
//
// Launches the dev extension, starts a Connect QR session, RENDERS + OPENS the QR for
// you to scan once (the only manual step — the emulator camera cannot scan QR on
// Apple-Silicon, see README), waits for the extension to reach the unlocked items view,
// then runs the FULL autofill suite (the exact same runTargets() as the standalone
// harness) and prints a PASS/FAIL table.
//
// Pre-req: a dev build at .output/chrome-mv3-dev (run `yarn build:dev`), and you scan
// the QR with a 2FAS Pass app whose vault has a Secret-tier Login with BOTH a username
// and a password (Phase 1's emulator vault has `John`/`Doe`, but the emulator can't scan
// — scan with a physical phone that has such a login).
/* global chrome */
// `chrome` is referenced only inside popup.evaluate() callbacks, which run in the
// extension page context where chrome.* is the global API.
import fs from 'node:fs';
import process from 'node:process';
import { execFile } from 'node:child_process';
import qrcode from 'qrcode';
import { EXTENSION_PATH, PROFILE_DIR, launchExtension, pingSeam, getAutofillItem } from '../autofill/extensionDriver.js';
import { runTargets } from '../autofill/runAutofillE2E.js';
import { normalizeTargets } from '../autofill/normalizeTargets.js';
import targetsRaw from '../autofill/targets.js';
import { formatTable, exitCodeFor } from '../autofill/report.js';

const log = (...a) => console.log('[connect-autofill]', ...a);
const useColor = !process.env.NO_COLOR;
const QRPNG = '/tmp/2fas_connect_qr.png';
const popupRoute = page => { try { const h = new URL(page.url()).hash.replace(/^#/, ''); return h === '' ? '/' : h; } catch { return '?'; } };

const main = async () => {
  if (!fs.existsSync(EXTENSION_PATH)) {
    log('SETUP FAILURE: dev build not found at', EXTENSION_PATH, '— run `yarn build:dev` first.');
    process.exit(2);
  }

  // Fresh profile so the MV3 service worker (with the DEV autofill seam) registers from disk.
  try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); log('Fresh profile at', PROFILE_DIR); } catch (e) { log('Could not reset profile:', e?.message || e); }

  const targets = normalizeTargets(targetsRaw);
  const results = [];
  const { context, serviceWorker, extensionId } = await launchExtension();

  try {
    log('Verifying the DEV autofill seam is present…');
    if (!(await pingSeam(context, extensionId))) {
      log('SETUP FAILURE: the loaded build has no DEV autofill seam (build with `yarn build:dev`).');
      process.exit(2);
    }

    // Start a Connect QR session and render + open the QR for scanning.
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForTimeout(2000);

    const res = await popup.evaluate(async () => chrome.runtime.sendMessage({ action: 'wsConnectQr', target: 'background_ws' }));
    const qrData = res?.state?.qrData;

    if (!qrData) {
      log('SETUP FAILURE: could not start a Connect QR session:', JSON.stringify(res)?.slice(0, 200));
      process.exit(2);
    }

    await qrcode.toFile(QRPNG, qrData, { width: 900, margin: 4, errorCorrectionLevel: 'L' });
    execFile('open', [QRPNG], () => {}); // macOS: open the QR in Preview for easy scanning

    log('');
    log('==================== ACTION NEEDED (the only manual step) ====================');
    log(`A QR window opened (${QRPNG}); it is also shown in the Chromium popup tab.`);
    log('SCAN it with a 2FAS Pass app that has a Secret-tier Login (username + password)');
    log('to connect + unlock the extension. Do not close the Chromium window.');
    log('=============================================================================');
    log('');

    // Poll the popup until it reaches the unlocked items view ('/'), up to 10 min.
    const started = Date.now();
    const deadline = started + 10 * 60 * 1000;
    let stable = 0, lastRoute = null, ticks = 0;

    while (Date.now() < deadline) {
      const r = popupRoute(popup);

      if (r === '/') { stable++; if (stable >= 2) { break; } } else { stable = 0; }
      if (r !== lastRoute) { log(`popup at "${r}"`); lastRoute = r; }
      if (ticks > 0 && ticks % 20 === 0) { log(`…still waiting for scan/unlock (${Math.round((Date.now() - started) / 1000)}s)`); }
      ticks++;
      await popup.waitForTimeout(1500);
    }

    if (popupRoute(popup) !== '/') {
      log('SETUP FAILURE: extension never reached the unlocked items view within 10 min (was the QR scanned?).');
      process.exit(2);
    }

    log('Connected + unlocked ✔');

    const item = await getAutofillItem(popup);
    log(`Vault has ${item.total} Login item(s).`);

    if (!item.itemId) {
      log('SETUP FAILURE: the connected vault has no Secret-tier Login with BOTH a username and a password.');
      if (item.error) { log(`  • seam error: ${item.error}`); }
      process.exit(2);
    }

    log(`Using item: username="${item.username}".`);

    const targetResults = await runTargets({ context, serviceWorker, relayPage: popup, item, targets, log, useColor });
    results.push(...targetResults);
  } finally {
    console.log('\n' + formatTable(results, { color: useColor }) + '\n');
    await context.close().catch(() => {});
  }

  process.exit(exitCodeFor(results, { setupFailure: false }));
};

main().catch(e => {
  console.error('[connect-autofill] fatal', e);
  process.exit(2);
});
