// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import autoClearClipboard from '../utils/alarmsFunctions/autoClearClipboard';
import passwordT2Reset from '../utils/alarmsFunctions/passwordT2Reset';
import { PASSWORD_T2_RESET_REGEX } from '@/constants/regex';

/** 
* Function to handle alarm events.
* @async
* @param {Object} alarm - The alarm object.
* @param {string} alarm.name - The name of the alarm.
* @return {Promise<boolean>} A promise that resolves to true if the alarm is handled successfully, otherwise false.
*/
const onAlarm = async alarm => {
  const { name } = alarm;
  const passwordT2ResetRegexTest = PASSWORD_T2_RESET_REGEX.exec(name);

  try {
    if (passwordT2ResetRegexTest) {
      const loginId = passwordT2ResetRegexTest[1];
      await passwordT2Reset(loginId);
      return true;
    }

    switch (name) {
      case 'autoClearClipboard': {
        await autoClearClipboard();
        return true;
      }
  
      default: {
        return false;
      }
    }
  } catch (e) {
    await CatchError(e);
  }
};

export default onAlarm;