// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const VALID_TYPES = new Set(['v1p', 'v1k']);
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const MAX_PARAM_LENGTH = 1000;

const parseShareHash = hash => {
  if (!hash || !hash.startsWith('#/')) {
    return null;
  }

  const parts = hash.slice(2).split('/');

  if (parts.length !== 4) {
    return null;
  }

  const [id, type, nonce, key] = parts;

  if (!id || id.length > MAX_PARAM_LENGTH) {
    return null;
  }

  if (!VALID_TYPES.has(type)) {
    return null;
  }

  if (!nonce || !BASE64URL_RE.test(nonce) || nonce.length > MAX_PARAM_LENGTH) {
    return null;
  }

  if (!key || !BASE64URL_RE.test(key) || key.length > MAX_PARAM_LENGTH) {
    return null;
  }

  return { id, type, nonce, key };
};

export default parseShareHash;
