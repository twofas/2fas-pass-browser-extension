// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTO_CLEAR_CLIPBOARD_REGEX } from '@/constants';

const deleteExistingClearClipboardAlarms = async () => {
  const existingAlarms = await browser.alarms.getAll();

  for (const alarm of existingAlarms) {
    if (AUTO_CLEAR_CLIPBOARD_REGEX.test(alarm.name)) {
      await browser.alarms.clear(alarm.name);
    }
  }
};

/**
* Function to copy a value to the clipboard.
* @async
* @param {string} value - The value to copy.
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the item being copied.
* @param {string} itemType - The type of the item being copied ('password', 'username', 'uri', 'name', 'text', 'cardNumber', 'expirationDate', 'securityCode', 'cardHolder').
* @return {Promise<void>}
*/
const copyValue = async (value, deviceId, vaultId, itemId, itemType) => {
  if (!value || typeof value !== 'string') {
    value = '';
  }

  if (!navigator?.clipboard) {
    throw new Error('Clipboard API not supported');
  }

  try {
    await navigator.clipboard.writeText(value);
  } catch {
    throw new Error('Failed to copy to clipboard');
  }

  const autoClearStorage = await storage.getItem('local:autoClearClipboard');

  if (autoClearStorage) {
    if (autoClearStorage === 'default' || autoClearStorage === null) {
      try {
        await deleteExistingClearClipboardAlarms();
      } catch {}

      return false;
    }

    const autoClearMinutes = parseInt(autoClearStorage, 10);

    try {
      await deleteExistingClearClipboardAlarms();
    } catch {}

    try {
      await browser.alarms.create(`autoClearClipboard-${deviceId}|${vaultId}|${itemId}|${itemType}`, { delayInMinutes: autoClearMinutes });
    } catch {}

    return true;
  }
};

export default copyValue;
