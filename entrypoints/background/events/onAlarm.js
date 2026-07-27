// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { autoClearClipboard, sifT2Reset } from '../utils';
import { SIF_T2_RESET_REGEX } from '@/constants';
import { AUTO_CLEAR_CLIPBOARD_REGEX } from '@/constants/clipboardFieldTypes';
import { resumeWsSession } from '../websocket/wsManager.js';
import { KEEPALIVE_ALARM, stopKeepalive } from '../websocket/connect/keepalive.js';

/** 
* Function to handle alarm events.
* @async
* @param {Object} alarm - The alarm object.
* @param {string} alarm.name - The name of the alarm.
* @return {Promise<boolean>} A promise that resolves to true if the alarm is handled successfully, otherwise false.
*/
const onAlarm = async alarm => {
  const { name } = alarm;

  try {
    if (name === KEEPALIVE_ALARM) {
      // Safari woke the SW for the keepalive tick. Run the session-resume decision
      // tree: enforce the timeout, re-open a push/fetch socket, or re-mint a QR (the
      // popup-open gate for QR lives inside resumeWsSession). Stop the wake cycle when
      // there is nothing to keep alive.
      const result = await resumeWsSession();

      if (result?.status === 'none' || result?.status === 'error' || result?.status === 'idle') {
        await stopKeepalive();
      }

      return true;
    }

    const sifT2ResetRegexTest = SIF_T2_RESET_REGEX.exec(name);

    if (sifT2ResetRegexTest) {
      const [, deviceId, vaultId, itemId] = sifT2ResetRegexTest;
      logger.info(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'AlarmHandler - sifT2Reset alarm', { deviceId, vaultId, itemId });
      await sifT2Reset(deviceId, vaultId, itemId);
      return true;
    }

    const autoClearClipboardRegexTest = AUTO_CLEAR_CLIPBOARD_REGEX.exec(name);

    if (autoClearClipboardRegexTest) {
      const [, deviceId, vaultId, itemId, itemType] = autoClearClipboardRegexTest;
      logger.info(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'AlarmHandler - autoClearClipboard alarm', { deviceId, vaultId, itemId, itemType });
      await autoClearClipboard(deviceId, vaultId, itemId, itemType);
      return true;
    }

    logger.debug(LOGGER_CONSTANTS.CATEGORIES.SYSTEM, 'AlarmHandler - unknown alarm', { name });
    return false;
  } catch (e) {
    await CatchError(e);
  }
};

export default onAlarm;