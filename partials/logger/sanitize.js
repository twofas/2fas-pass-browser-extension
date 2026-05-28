// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const MAX_STRING_LEN = 256;
const MAX_DEPTH = 6;

const ALLOWED_KEY_HINTS = new Set([
  'itemid',
  'vaultid',
  'deviceid',
  'tabid',
  'windowid',
  'keyboardshortcut'
]);

const REDACT_KEY_HINTS = [
  'password',
  'secret',
  'token',
  'apikey',
  'authtoken',
  'mnemonic',
  'seed',
  'nonce',
  'iv',
  'privatekey',
  'publickey',
  'lkey',
  'localkey',
  's_password',
  's_text',
  'notes',
  'note',
  'words'
];

const REDACT_EXACT_KEYS = new Set([
  'password',
  's_password',
  's_text',
  'lkey',
  'localkey',
  'persistentprivatekey',
  'persistentpublickey',
  'nonce',
  'iv',
  'key',
  'seed',
  'mnemonic',
  'secret',
  'token',
  'apikey',
  'authtoken',
  'value',
  'notes',
  'note',
  'text',
  'masterkey',
  'externalkey',
  'trustedkey',
  'salt'
]);

const isRedactedKey = key => {
  const lower = String(key).toLowerCase();

  if (ALLOWED_KEY_HINTS.has(lower)) {
    return false;
  }

  if (REDACT_EXACT_KEYS.has(lower)) {
    return true;
  }

  for (let i = 0; i < REDACT_KEY_HINTS.length; i++) {
    if (lower.includes(REDACT_KEY_HINTS[i])) {
      return true;
    }
  }

  if (lower === 'username' || lower === 'email') {
    return true;
  }

  return false;
};

const redactStringValue = (key, value) => {
  const lower = String(key).toLowerCase();

  if (lower === 'username' || lower === 'email') {
    return `[REDACTED len=${value.length}]`;
  }

  return '[REDACTED]';
};

const truncateString = value => {
  if (value.length <= MAX_STRING_LEN) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LEN)}…[truncated len=${value.length}]`;
};

const sanitizeValue = (key, value, depth, seen) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (isRedactedKey(key)) {
    if (typeof value === 'string') {
      return redactStringValue(key, value);
    }

    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'function') {
    return '[function]';
  }

  if (typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value);
  }

  if (value instanceof ArrayBuffer) {
    return `[binary ArrayBuffer len=${value.byteLength}]`;
  }

  if (ArrayBuffer.isView(value)) {
    return `[binary ${value.constructor?.name || 'TypedArray'} len=${value.byteLength}]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message || ''),
      code: value.code
    };
  }

  if (depth >= MAX_DEPTH) {
    return '[max-depth]';
  }

  if (seen.has(value)) {
    return '[circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const out = value.map((item, i) => sanitizeValue(String(i), item, depth + 1, seen));
    seen.delete(value);

    return out;
  }

  if (typeof value === 'object') {
    const out = {};
    const keys = Object.keys(value);

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out[k] = sanitizeValue(k, value[k], depth + 1, seen);
    }

    seen.delete(value);

    return out;
  }

  return '[unknown]';
};

export const sanitizeMeta = meta => {
  if (meta === null || meta === undefined) {
    return {};
  }

  if (typeof meta !== 'object') {
    return { value: sanitizeValue('value', meta, 0, new WeakSet()) };
  }

  try {
    return sanitizeValue('root', meta, 0, new WeakSet());
  } catch {
    return { sanitizeError: true };
  }
};
