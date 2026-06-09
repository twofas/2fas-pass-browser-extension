// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { getLogStats } from '@/partials/logger/idb';
import { buildLogsExport } from '@/partials/logger/buildExport';

const triggerDownload = (filename, jsonString) => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

// Safari has no `browser.downloads` API, and downloading from the toolbar popup
// produces a wrong ("Unknown") filename + empty-origin prompt. We therefore open
// the Safari-only `safari-download` entrypoint in its own tab; it reads the logs
// straight from IndexedDB and builds the file on a button click (a real gesture
// in a normal tab is what makes Safari honor the `download` filename).
const openSafariDownloadTab = () => browser.tabs.create({ url: browser.runtime.getURL('/safari-download.html') });

export const exportLogsToFile = async ({ bytesUsed } = {}) => {
  if (import.meta.env.BROWSER === 'safari') {
    const stats = await getLogStats().catch(() => null);

    if (!stats || stats.entryCount === 0) {
      return { exported: false, reason: 'empty' };
    }

    await openSafariDownloadTab();

    return { exported: true, entryCount: stats.entryCount };
  }

  const result = await buildLogsExport({ bytesUsed });

  if (!result) {
    return { exported: false, reason: 'empty' };
  }

  triggerDownload(result.filename, result.content);

  return { exported: true, entryCount: result.entryCount };
};
