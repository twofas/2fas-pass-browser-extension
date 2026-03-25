// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Create a new shared secret via the 2FAS Share API.
 * @param {Object} params - Secret parameters.
 * @param {string} params.data - Base64-encoded encrypted payload.
 * @param {number} params.validForSeconds - How long the secret stays valid (300, 1800, 3600, 86400, 604800, or 2592000).
 * @param {boolean} params.singleUse - If true, the secret is deleted after the first retrieval.
 * @returns {Promise<{id: string, createdAt: string, validUntil: string, singleUse: boolean}>} Created secret metadata.
 * @throws {Error} On non-OK HTTP responses, with a `status` property containing the HTTP status code.
 */
async function createSecret ({ data, validForSeconds, singleUse }) {
  const response = await fetch(`${import.meta.env.VITE_SHARE_API_URL}/secret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, validForSeconds, singleUse })
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Retrieve a shared secret by its ID.
 * @param {string} id - The secret identifier.
 * @returns {Promise<{id: string, data: string, singleUse: boolean, validUntil: string}>}
 * @throws {Error} On non-OK HTTP responses, with a `status` property.
 */
async function getSecret (id) {
  const response = await fetch(`${import.meta.env.VITE_SHARE_API_URL}/secret/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export { createSecret, getSecret };
