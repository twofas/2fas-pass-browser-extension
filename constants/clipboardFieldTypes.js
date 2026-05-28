// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// IMPORTANT: This file MUST NOT import from item models (directly or transitively).
// Item models import from `@/partials/functions` (barrel), which eagerly loads
// copyValue.js, which imports from this file. Any model import here would create
// a circular dependency where the regex evaluates before classes are declared.

export const LOGIN_CLIPBOARD_FIELD_TYPES = ['password', 'username', 'name', 'uri'];
export const SECURE_NOTE_CLIPBOARD_FIELD_TYPES = ['text', 'name'];
export const PAYMENT_CARD_CLIPBOARD_FIELD_TYPES = ['cardNumber', 'expirationDate', 'securityCode', 'cardHolder', 'name'];
export const WIFI_CLIPBOARD_FIELD_TYPES = ['wifiPassword', 'ssid', 'name'];

export const CLIPBOARD_FIELD_TYPES = [
  ...new Set([
    ...LOGIN_CLIPBOARD_FIELD_TYPES,
    ...SECURE_NOTE_CLIPBOARD_FIELD_TYPES,
    ...PAYMENT_CARD_CLIPBOARD_FIELD_TYPES,
    ...WIFI_CLIPBOARD_FIELD_TYPES
  ])
];

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const TYPES_GROUP = CLIPBOARD_FIELD_TYPES.join('|');

export const AUTO_CLEAR_CLIPBOARD_REGEX = new RegExp(
  `^autoClearClipboard-(${UUID})\\|(${UUID})\\|(${UUID})\\|(${TYPES_GROUP})$`,
  'i'
);
