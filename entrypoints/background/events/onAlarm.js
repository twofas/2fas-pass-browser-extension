// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { autoClearClipboard, sifT2Reset } from '../utils';
import { SIF_T2_RESET_REGEX, AUTO_CLEAR_CLIPBOARD_REGEX } from '@/constants';

/** 
* Function to handle alarm events.
* @async
* @param {Object} alarm - The alarm object.
* @param {string} alarm.name - The name of the alarm.
* @return {Promise<boolean>} A promise that resolves to true if the alarm is handled successfully, otherwise false.
*/
const onAlarm = async alarm => {
  const { name } = alarm;
  const sifT2ResetRegexTest = SIF_T2_RESET_REGEX.exec(name);
  const autoClearClipboardRegexTest = AUTO_CLEAR_CLIPBOARD_REGEX.exec(name);

  try {
    if (sifT2ResetRegexTest) {
      const itemId = sifT2ResetRegexTest[1];
      await sifT2Reset(itemId);
      return true;
    } else if (autoClearClipboardRegexTest) {
      const [, itemId, itemType] = autoClearClipboardRegexTest;
      await autoClearClipboard(itemId, itemType);
    } else {
      return false;
    }
  } catch (e) {
    await CatchError(e);
  }
};

export default onAlarm;