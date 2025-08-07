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
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  all_frames: true,
  match_about_blank: true,
  registration: 'runtime',
  async main (ctx) {
    const localKey = { data: null };
    const timers = {};
    const ignore = { value: false };
    let savePrompt = null;
    const emptyFunc = () => {};

    try {
      if (ctx?.isInvalid) {
        return;
      }

      const savePromptResponse = await browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.GET_SAVE_PROMPT,
        target: REQUEST_TARGETS.BACKGROUND_PROMPT
      });

      if (savePromptResponse?.status === 'ok') {
        savePrompt = savePromptResponse?.data;
      } else {
        savePrompt = 'default';
      }
    } catch {
      savePrompt = 'default';
    }

    const cryptoAvailable = isCryptoAvailable();
    const encrypted = cryptoAvailable && savePrompt === 'default_encrypted';
    
    const passwordInputs = getPasswordInputs();
    const passwordForms = passwordInputs.map(input => input.closest('form'));
    
    const usernameInputs = getUsernameInputs(passwordForms);
    setUsernameSkips(passwordInputs, usernameInputs);
    
    const allInputs = passwordInputs.concat(usernameInputs);
    setIDsToInputs(allInputs);

    const removeListeners = () => {
      browser.runtime.onMessage.removeListener(handlePromptMessage);
      document.removeEventListener('input', handleInput);

      window.removeEventListener('error', emptyFunc);
      window.removeEventListener('unhandledrejection', emptyFunc);
    };
    
    const handlePromptMessage = (request, sender, response) => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      return promptOnMessage(request, sender, response, timers, ignore);
    };

    const handleInput = async e => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      await handleInputEvent(e, allInputs, localKey, timers, ignore, encrypted);
    };

    browser.runtime.onMessage.addListener(handlePromptMessage);
    document.addEventListener('input', handleInput);
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);
    window.addEventListener('beforeunload', removeListeners, { once: true });
  },
});
