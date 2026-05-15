// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { writeLogDirect } from '@/partials/logger/idb';
import { writeLogViaMessage } from '@/partials/logger/contentLogger';
import { sanitizeMeta } from '@/partials/logger/sanitize';
import { LOGGER_CONSTANTS } from './LOGGER_CONSTANTS';

const detectContext = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'background';
  }

  const proto = (typeof location !== 'undefined' && location.protocol) || '';
  const isExtensionPage =
    proto === 'chrome-extension:' ||
    proto === 'moz-extension:' ||
    proto === 'safari-web-extension:';

  if (!isExtensionPage) {
    return 'content';
  }

  const path = (typeof location !== 'undefined' && location.pathname) || '';

  if (path.includes('popup')) {
    return 'popup';
  }

  if (path.includes('install')) {
    return 'install';
  }

  if (path.includes('prompt')) {
    return 'prompt';
  }

  if (path.includes('focus')) {
    return 'focus';
  }

  if (path.includes('devpanel')) {
    return 'devpanel';
  }

  if (path.includes('share')) {
    return 'share';
  }

  return 'extension-page';
};

const CTX = detectContext();
const isContentCtx = CTX === 'content';

const writer = isContentCtx ? writeLogViaMessage : writeLogDirect;
const CATEGORIES = LOGGER_CONSTANTS.CATEGORIES;
const ALLOWED_CATEGORIES = new Set(Object.values(CATEGORIES));

const makeLogger = level => (cat, msg, meta) => {
  try {
    const safeCat = ALLOWED_CATEGORIES.has(cat) ? cat : CATEGORIES.SYSTEM;
    const entry = {
      ts: Date.now(),
      level,
      cat: safeCat,
      ctx: CTX,
      msg: typeof msg === 'string' ? msg : String(msg ?? ''),
      meta: sanitizeMeta(meta)
    };

    const result = writer(entry);

    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch {}
};

export const logger = Object.freeze({
  debug: makeLogger(LOGGER_CONSTANTS.LEVELS.DEBUG),
  info: makeLogger(LOGGER_CONSTANTS.LEVELS.INFO),
  warn: makeLogger(LOGGER_CONSTANTS.LEVELS.WARN),
  error: makeLogger(LOGGER_CONSTANTS.LEVELS.ERROR)
});

export default logger;
