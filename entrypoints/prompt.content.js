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
import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'runtime',
  async main (ctx) {
    let localKey = { data: null };
    let timers = {};
    let ignore = { value: false };
    const emptyFunc = () => {};

    const handlePromptMessage = (request, sender, response) => promptOnMessage(request, sender, response, timers, ignore);
    const cryptoAvailable = isCryptoAvailable();
    
    try {
      browser.runtime.onMessage.addListener(handlePromptMessage);

      const passwordInputs = getPasswordInputs();
      const passwordForms = passwordInputs.map(input => input.closest('form'));
      
      const usernameInputs = getUsernameInputs(passwordForms);
      setUsernameSkips(passwordInputs, usernameInputs);

      const allInputs = passwordInputs.concat(usernameInputs);

      setIDsToInputs(allInputs);

      const handleInput = async e => await handleInputEvent(e, allInputs, localKey, timers, ignore, cryptoAvailable);
      document.addEventListener('input', handleInput);

      window.addEventListener('error', emptyFunc);
      window.addEventListener('unhandledrejection', emptyFunc);

      const removeListeners = () => {
        browser.runtime.onMessage.removeListener(handlePromptMessage);
        document.removeEventListener('input', handleInput);

        window.removeEventListener('error', emptyFunc);
        window.removeEventListener('unhandledrejection', emptyFunc);
      };

      ctx.onInvalidated(removeListeners);
      window.addEventListener('beforeunload', removeListeners, { once: true });
    } catch (e) {
      handleError(e);
    }
  },
});
