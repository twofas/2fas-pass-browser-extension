// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Safari-only log-download entrypoint. Reads the logs from IndexedDB and builds
// the export file using the SHARED serializer (no duplicated format logic).
// Safari ignores `blob:` downloads (WebKit 190351) and caps a `data:` URL at
// ~2GB, so a `data:` URL is used. The download fires on the button click — a
// real user gesture in a normal tab makes Safari honor the `download` filename.

import { buildLogsExport } from '@/partials/logger/buildExport';

const utf8ToBase64 = str => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
};

const init = async () => {
  const hintEl = document.getElementById('hint');
  const anchor = document.getElementById('download');

  try {
    await initI18n();
  } catch {}

  hintEl.textContent = getMessage('settings_logs_safari_hint');
  anchor.textContent = getMessage('settings_logs_download_button');

  try {
    const result = await buildLogsExport();

    if (!result) {
      hintEl.textContent = getMessage('settings_logs_empty_toast');
      anchor.style.display = 'none';

      return;
    }

    anchor.href = `data:application/octet-stream;base64,${utf8ToBase64(result.content)}`;
    anchor.download = result.filename;
    anchor.removeAttribute('aria-disabled');
  } catch {
    hintEl.textContent = getMessage('settings_logs_download_error');
    anchor.style.display = 'none';
  }
};

init();
