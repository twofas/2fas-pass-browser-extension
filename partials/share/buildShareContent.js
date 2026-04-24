// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Build an encrypted-share-ready payload from any supported item model.
 * Delegates to the item's own toShareContent() method, which decrypts
 * sensitive fields and clears them from memory after building.
 * @param {Object} item - Item model instance (Login, SecureNote, PaymentCard, or Wifi).
 * @returns {Promise<{contentType: string, contentVersion: number, content: Object}>}
 * @throws {Error} If the item does not implement toShareContent().
 */
async function buildShareContent (item) {
  if (typeof item.toShareContent !== 'function') {
    throw new Error(`Unsupported content type: ${item.contentType}`);
  }

  return item.toShareContent();
}

export default buildShareContent;
