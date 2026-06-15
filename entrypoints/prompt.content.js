// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import handleInputEvent from './prompt/handleInputEvent';
import promptOnMessage from './prompt/events/promptOnMessage';
import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import getShadowRoots from './content/functions/autofillFunctions/getShadowRoots';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import setIDsToInputs from './prompt/setIDsToInputs';
import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';
import checkInitialInputsValues from './prompt/checkInitialInputsValues';
import flushPendingInputs, { BEACON_URL } from './prompt/flushPendingInputs';

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
    const latestValues = {};
    const beaconPayloads = {};

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

    const documentShadowRoots = getShadowRoots();
    const passwordInputs = getPasswordInputs(documentShadowRoots);
    const passwordForms = passwordInputs
      .map(input => input.closest('form'))
      .filter(Boolean);

    const usernameInputs = getUsernameInputs(passwordForms, documentShadowRoots);
    setUsernameSkips(passwordInputs, usernameInputs, false, passwordForms);

    const allInputs = passwordInputs.concat(usernameInputs);
    setIDsToInputs(allInputs);
    checkInitialInputsValues(allInputs, localKey, encrypted);

    const removeListeners = () => {
      browser.runtime.onMessage.removeListener(handlePromptMessage);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('submit', handleFormSubmit, { capture: true });
      document.removeEventListener('keydown', handleKeydown, { capture: true });
      window.removeEventListener('error', emptyFunc);
      window.removeEventListener('unhandledrejection', emptyFunc);
    };

    const trackNewInputs = () => {
      try {
        const shadowRoots = getShadowRoots();
        const newPasswordInputs = getPasswordInputs(shadowRoots);
        const newPasswordForms = newPasswordInputs
          .map(input => input.closest('form'))
          .filter(Boolean);
        const newUsernameInputs = getUsernameInputs(newPasswordForms, shadowRoots);
        const scannedInputs = newPasswordInputs.concat(newUsernameInputs);
        const newInputs = scannedInputs.filter(input => input && !allInputs.includes(input));

        if (newInputs.length <= 0) {
          return;
        }

        setUsernameSkips(newPasswordInputs, newUsernameInputs, false, newPasswordForms);
        setIDsToInputs(newInputs);
        allInputs.push(...newInputs);
      } catch {}
    };

    const flushAndSendPending = () => {
      trackNewInputs();

      const pendingData = flushPendingInputs(allInputs, timers, latestValues);

      for (const inputData of pendingData) {
        try {
          browser.runtime.sendMessage({
            action: REQUEST_ACTIONS.PROMPT_INPUT,
            data: inputData,
            target: REQUEST_TARGETS.BACKGROUND_PROMPT
          });
        } catch {}
      }
    };

    const handleFormSubmit = () => {
      flushAndSendPending();
    };

    const handleKeydown = e => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      if (e?.key !== 'Enter' || e?.isComposing) {
        return;
      }

      const path = typeof e?.composedPath === 'function' ? e.composedPath() : null;
      const target = (path && path[0]) || e?.target;

      if (!target || target.tagName !== 'INPUT') {
        return;
      }

      const isTracked = target.getAttribute?.('twofas-pass-id') || allInputs.includes(target);
      const form = target.closest?.('form');
      const formHasPassword = form ? form.querySelector('input[type="password"]') : null;

      if (!isTracked && !formHasPassword && target.type !== 'password') {
        return;
      }

      flushAndSendPending();
    };

    const handleBeforeUnload = () => {
      const pendingData = flushPendingInputs(allInputs, timers, latestValues);

      if (pendingData.length > 0) {
        try {
          browser.runtime.sendMessage({
            action: REQUEST_ACTIONS.PROMPT_INPUT_FLUSH,
            data: pendingData,
            target: REQUEST_TARGETS.BACKGROUND_PROMPT
          });
        } catch {}
      }

      const beaconData = Object.values(beaconPayloads).filter(entry => !entry.sent);

      if (beaconData.length > 0) {
        try {
          const blob = new Blob([JSON.stringify(beaconData)], { type: 'application/json' });
          navigator.sendBeacon(BEACON_URL, blob);
        } catch {}
      }

      removeListeners();
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

      await handleInputEvent(e, allInputs, localKey, timers, ignore, encrypted, latestValues, beaconPayloads);
    };

    browser.runtime.onMessage.addListener(handlePromptMessage);
    document.addEventListener('input', handleInput);
    document.addEventListener('submit', handleFormSubmit, { capture: true });
    document.addEventListener('keydown', handleKeydown, { capture: true });
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);
    window.addEventListener('beforeunload', handleBeforeUnload, { once: true });
  },
});
