// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { readAllLogs, getLogStats } from '@/partials/logger/idb';

const fileSafeTimestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

const serializeLegend = legend => {
  const lines = Object.entries(legend).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`);

  return `{\n${lines.join(',\n')}\n  }`;
};

const serializeMeta = meta => {
  const lines = Object.entries(meta).map(([k, v]) => {
    if (k === 'legend' && v && typeof v === 'object' && !Array.isArray(v)) {
      return `  ${JSON.stringify(k)}: ${serializeLegend(v)}`;
    }

    return `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  });

  return `{\n${lines.join(',\n')}\n}`;
};

const serializeExport = data => {
  const metaPretty = serializeMeta(data.meta)
    .split('\n')
    .map((line, idx) => idx === 0 ? line : `  ${line}`)
    .join('\n');

  const total = data.logs.length;
  const entryLines = data.logs.map((entry, idx) => {
    const trailing = idx === total - 1 ? '' : ',';
    return `    ${JSON.stringify(entry)}${trailing}`;
  });

  if (entryLines.length === 0) {
    return `{\n  "meta": ${metaPretty},\n  "logs": []\n}\n`;
  }

  return `{\n  "meta": ${metaPretty},\n  "logs": [\n${entryLines.join('\n')}\n  ]\n}\n`;
};

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

const buildLegend = () => ({
  keys: {
    t: 'timestamp (ms)',
    l: 'level',
    c: 'category',
    x: 'context',
    m: 'message',
    e: 'meta',
    s: 'size (bytes)',
    i: 'id'
  },
  l: [...LOGGER_CONSTANTS.LEVEL_NAMES],
  c: [...LOGGER_CONSTANTS.CATEGORY_NAMES],
  x: [...LOGGER_CONSTANTS.CONTEXT_NAMES]
});

export const exportLogsToFile = async ({ bytesUsed } = {}) => {
  const [logsForExport, manifest, browserInfo, statsResult] = await Promise.all([
    readAllLogs(),
    Promise.resolve(browser.runtime.getManifest()),
    storage.getItem('local:browserInfo').catch(() => null),
    typeof bytesUsed === 'number' ? Promise.resolve(null) : getLogStats().catch(() => null)
  ]);

  if (!logsForExport || logsForExport.length === 0) {
    return { exported: false, reason: 'empty' };
  }

  const exportObject = {
    meta: {
      exportedAt: new Date().toISOString(),
      appVersion: manifest?.version || 'unknown',
      appName: manifest?.name || 'unknown',
      browser: import.meta.env.BROWSER,
      browserName: browserInfo?.browserName || null,
      browserVersion: browserInfo?.browserVersion || null,
      entryCount: logsForExport.length,
      bytesUsed: typeof bytesUsed === 'number' ? bytesUsed : (statsResult?.bytesUsed || 0),
      legend: buildLegend()
    },
    logs: logsForExport
  };

  const filename = `2fas-pass-logs-${import.meta.env.BROWSER}-${manifest?.version || 'unknown'}-${fileSafeTimestamp()}.json`;
  triggerDownload(filename, serializeExport(exportObject));

  return { exported: true, entryCount: logsForExport.length };
};
