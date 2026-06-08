// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { EXTENSION_PATH, PROFILE_DIR, launchExtension } from './extensionDriver.js';

// Opens just a headed Playwright Chromium with the dev extension loaded (persistent
// profile, so pairing survives) and leaves it open for manual poking — no build, no
// test logic, no profile wipe. Close the window or press Ctrl+C to quit.

const log = (...a) => console.log('[autofill-e2e]', ...a);

const main = async () => {
  if (!fs.existsSync(EXTENSION_PATH)) {
    log('Dev build not found at', EXTENSION_PATH);
    log('  • Build it first: `yarn build:dev` (or run `yarn test:autofill`, which builds).');
    process.exit(2);
  }

  // Clear a stale single-process lock left by a crashed previous session (does NOT wipe
  // the profile — pairing is preserved).
  fs.rmSync(path.join(PROFILE_DIR, 'SingletonLock'), { force: true });

  const { context, extensionId } = await launchExtension();

  try {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`).catch(() => {});
  } catch {}

  log(`Extension loaded (id: ${extensionId}).`);
  log(`Popup: chrome-extension://${extensionId}/popup.html`);
  log('Browser window is open. Close the window or press Ctrl+C to quit.');

  const shutdown = async () => {
    await context.close().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  context.on('close', () => process.exit(0));

  // Keep the process (and the window) alive.
  await new Promise(() => {});
};

main().catch(e => {
  console.error('[autofill-e2e] fatal', e);
  process.exit(1);
});
