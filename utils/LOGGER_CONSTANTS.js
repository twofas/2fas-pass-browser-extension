// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const MAX_BYTES_VALUE = 5 * 1024 * 1024;
const TRIM_BATCH_VALUE = Math.floor(MAX_BYTES_VALUE * 0.10);

export const LOGGER_CONSTANTS = Object.freeze({
  LEVELS: Object.freeze({
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  }),
  CATEGORIES: Object.freeze({
    WS: 'WS',
    STORAGE: 'STORAGE',
    AUTOFILL: 'AUTOFILL',
    USER_ACTION: 'USER_ACTION',
    SYSTEM: 'SYSTEM',
    AUTH: 'AUTH',
    CRYPTO: 'CRYPTO',
    ITEM: 'ITEM',
    NAVIGATION: 'NAVIGATION',
    BACKGROUND: 'BACKGROUND',
    CONTENT: 'CONTENT',
    ERROR: 'ERROR'
  }),
  CATEGORY_EMOJI: Object.freeze({
    WS: '☁️',
    STORAGE: '📖',
    AUTOFILL: '📝',
    USER_ACTION: '🌀',
    SYSTEM: '💡',
    AUTH: '🔌',
    CRYPTO: '🔐',
    ITEM: '🗂️',
    NAVIGATION: '🧭',
    BACKGROUND: '⚙️',
    CONTENT: '📄',
    ERROR: '‼️'
  }),
  LEVEL_EMOJI: Object.freeze({
    debug: '🔍',
    info: '❔',
    warn: '⚠️',
    error: '❌'
  }),
  MAX_BYTES: MAX_BYTES_VALUE,
  TRIM_BATCH_BYTES: TRIM_BATCH_VALUE,
  BROADCAST_CHANNEL: 'twofas-logs',
  IDB: Object.freeze({
    NAME: 'twofas-logs',
    VERSION: 1,
    STORE_LOGS: 'logs',
    STORE_META: 'meta',
    META_BYTES_USED: 'bytesUsed',
    META_LAST_TRIM: 'lastTrimAt'
  })
});
