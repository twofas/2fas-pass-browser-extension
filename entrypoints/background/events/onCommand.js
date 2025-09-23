// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { shortcutAutofill } from '../utils';

/** 
* Function to handle command events.
* @async
* @param {string} command - The command to handle.
* @return {Promise<boolean>} A promise that resolves to true if the command is handled successfully, otherwise false.
*/
const onCommand = async command => {
  try {
    switch (command) {
      case '2fas_pass_shortcut_autofill': {
        await shortcutAutofill();
        return true;
      }
  
      default: return false;
    }
  } catch (e) {
    await CatchError(e);
  }
};

export default onCommand;
