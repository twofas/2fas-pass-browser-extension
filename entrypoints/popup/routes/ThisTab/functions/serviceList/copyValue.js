// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTO_CLEAR_CLIPBOARD_REGEX } from '@/constants/regex';

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
* @param {string} itemId - The ID of the item being copied.
* @param {string} itemType - The type of the item being copied ('password', 'username', 'uri).
* @return {Promise<void>} 
*/
const copyValue = async (value, itemId, itemType) => {
  if (!navigator?.clipboard) {
    // @TODO: handle error (toast?)
    return false;
  }

  try {
    navigator.clipboard.writeText(value);
  } catch {
    return false; // @TODO: handle error (toast?)
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
      await browser.alarms.create(`autoClearClipboard.${itemId}.${itemType}`, { delayInMinutes: autoClearMinutes });
    } catch {}

    return true;
  }
};

export default copyValue;
