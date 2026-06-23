// SPDX-License-Identifier: BUSL-1.1
//
// Throwaway probe: launch the dev extension, open the popup, ask the background for a
// Connect QR session, and print the qrData payload. Proves (a) qrData is extractable
// programmatically and (b) the WS reaches the relay (a qrData implies a live session).
/* global chrome */
// `chrome` is referenced only inside page.evaluate() callbacks, which run in the
// extension page context where chrome.* is the global API.
import process from 'node:process';
import { launchExtension } from '../autofill/extensionDriver.js';

const { context, extensionId } = await launchExtension();
const page = await context.newPage();
await page.goto(`chrome-extension://${extensionId}/popup.html`);
await page.waitForTimeout(2000);

const res = await page.evaluate(async () => {
  try {
    return await chrome.runtime.sendMessage({ action: 'wsConnectQr', target: 'background_ws' });
  } catch (e) {
    return { __err: e?.message || String(e) };
  }
});

console.log('STATUS:', res?.status);
const qrData = res?.state?.qrData;
console.log('QRDATA_PRESENT:', Boolean(qrData));
if (qrData) {
  console.log('QRDATA_LEN:', qrData.length);
  console.log('QRDATA:', qrData);
  try { console.log('DECODED:', atob(qrData).slice(0, 80) + '…'); } catch {}
} else {
  console.log('FULL_RESULT:', JSON.stringify(res)?.slice(0, 600));
}
await context.close();
process.exit(0);
