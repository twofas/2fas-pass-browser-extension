// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to copy a value to the clipboard.
* @async
* @param {string} value - The value to copy.
* @return {Promise<void>} 
*/
const copyValue = async value => {
  try {
    navigator.clipboard.writeText(value);
  } catch {}

  const autoClearStorage = await storage.getItem('local:autoClearClipboard');

  if (autoClearStorage) {
    if (autoClearStorage === 'default' || autoClearStorage === null) {
      try {
        await browser.alarms.clear('autoClearClipboard');
      } catch {}

      return false;
    }

    const autoClearMinutes = parseInt(autoClearStorage, 10);

    try {
      await browser.alarms.clear('autoClearClipboard');
      await browser.alarms.create('autoClearClipboard', { delayInMinutes: autoClearMinutes });
    } catch {}

    return true;
  }
};

export default copyValue;
