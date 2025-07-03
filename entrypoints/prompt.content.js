// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleInputEvent from './prompt/handleInputEvent';
import promptOnMessage from './prompt/events/promptOnMessage';
import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import setIDsToInputs from './prompt/setIDsToInputs';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'runtime',
  async main () {
    let localKey = { data: null };
    let timers = {};
    const emptyFunc = () => {};
    
    try {
      browser.runtime.onMessage.addListener(promptOnMessage);

      const passwordInputs = getPasswordInputs();
      const passwordForms = passwordInputs.map(input => input.closest('form'));
      
      const usernameInputs = getUsernameInputs(passwordForms);
      setUsernameSkips(passwordInputs, usernameInputs);

      const allInputs = passwordInputs.concat(usernameInputs);

      setIDsToInputs(allInputs);

      const handleInput = async e => await handleInputEvent(e, allInputs, localKey, timers);
      document.addEventListener('input', handleInput);

      window.addEventListener('error', emptyFunc);
      window.addEventListener('unhandledrejection', emptyFunc);

      window.addEventListener('beforeunload', () => {
        browser.runtime.onMessage.removeListener(promptOnMessage);
        document.removeEventListener('input', handleInput);

        window.removeEventListener('error', emptyFunc);
        window.removeEventListener('unhandledrejection', emptyFunc);
      }, { once: true });
    } catch (e) {
      handleError(e);
    }
  },
});
