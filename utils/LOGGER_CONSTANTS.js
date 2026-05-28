// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const MAX_BYTES_VALUE = 5 * 1024 * 1024;
const TRIM_BATCH_VALUE = Math.floor(MAX_BYTES_VALUE * 0.10);

const LEVEL_NAMES = ['debug', 'info', 'warn', 'error'];

const CATEGORY_NAMES = [
  'WS',
  'STORAGE',
  'AUTOFILL',
  'USER_ACTION',
  'SYSTEM',
  'AUTH',
  'CRYPTO',
  'ITEM',
  'NAVIGATION',
  'BACKGROUND',
  'CONTENT',
  'ERROR'
];

const CONTEXT_NAMES = [
  'background',
  'popup',
  'content',
  'install',
  'prompt',
  'focus',
  'devpanel',
  'share',
  'extension-page'
];

const LEVEL_EMOJI_ARR = ['🔍', '❔', '⚠️', '❌'];

const CATEGORY_EMOJI_ARR = [
  '☁️',
  '📖',
  '📝',
  '🌀',
  '💡',
  '🔌',
  '🔐',
  '🗂️',
  '🧭',
  '⚙️',
  '📄',
  '‼️'
];

const buildIdMap = names => {
  const map = {};

  for (let i = 0; i < names.length; i++) {
    map[names[i]] = i;
  }

  return Object.freeze(map);
};

const buildEnum = names => {
  const map = {};

  for (let i = 0; i < names.length; i++) {
    const key = names[i].toUpperCase().replace(/-/g, '_');

    map[key] = i;
  }

  return Object.freeze(map);
};

export const LOGGER_CONSTANTS = Object.freeze({
  LEVELS: buildEnum(LEVEL_NAMES),
  CATEGORIES: buildEnum(CATEGORY_NAMES),
  CONTEXTS: buildEnum(CONTEXT_NAMES),
  LEVEL_NAMES: Object.freeze(LEVEL_NAMES),
  CATEGORY_NAMES: Object.freeze(CATEGORY_NAMES),
  CONTEXT_NAMES: Object.freeze(CONTEXT_NAMES),
  CONTEXT_IDS: buildIdMap(CONTEXT_NAMES),
  LEVEL_EMOJI: Object.freeze(LEVEL_EMOJI_ARR),
  CATEGORY_EMOJI: Object.freeze(CATEGORY_EMOJI_ARR),
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
