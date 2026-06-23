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
import isSubmitButtonClick from './prompt/isSubmitButtonClick';
import encryptFlushData from './prompt/encryptFlushData';
import ensureLocalKey from './prompt/ensureLocalKey';
import isCryptoAvailable from '@/partials/functions/isCryptoAvailable';
import ifCtxIsInvalid from '@/partials/contentScript/ifCtxIsInvalid';
import checkInitialInputsValues from './prompt/checkInitialInputsValues';
import flushPendingInputs, { BEACON_URL } from './prompt/flushPendingInputs';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  allFrames: true,
  matchAboutBlank: true,
  registration: 'runtime',
  async main (ctx) {
    const localKey = { data: null };
    const timers = {};
    const ignore = { value: false };
    let savePrompt = null;
    const emptyFunc = () => {};
    const latestValues = {};
    const beaconPayloads = {};

    // The top frame is always the page itself; sub-frames must be confirmed
    // same-root-domain by the background (which can see every frame's real origin,
    // including cross-subdomain ones the frame itself cannot read). Fail-closed:
    // a sub-frame that cannot be confirmed never captures credentials (finding #19).
    let eligible = window.top === window.self;

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

      if (savePromptResponse?.eligible === true) {
        eligible = true;
      }
    } catch {
      savePrompt = 'default';
    }

    if (!eligible) {
      return;
    }

    const cryptoAvailable = isCryptoAvailable();
    const encrypted = cryptoAvailable && savePrompt === 'default_encrypted';

    // Pre-fetch the local key now, while the service worker that just injected this
    // script is still alive. Encrypted capture/flush/beacon drop credentials when the
    // key is missing (the unencrypted path does not), so fetching it lazily on the
    // first keystroke — which can hit a recycled worker and fail — is why the encrypted
    // mode fails more often. Caching it here makes the encrypted mode as reliable as the
    // unencrypted one for the page lifetime.
    if (encrypted) {
      await ensureLocalKey(localKey);
    }

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
      document.removeEventListener('click', handleClick, { capture: true });
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

    const flushAndSendPending = async () => {
      trackNewInputs();

      const pendingData = flushPendingInputs(allInputs, timers, latestValues);
      const sendData = encrypted ? await encryptFlushData(pendingData, localKey, encrypted) : pendingData;

      for (const inputData of sendData) {
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

    const handleClick = e => {
      if (ifCtxIsInvalid(ctx, removeListeners)) {
        return;
      }

      if (!isSubmitButtonClick(e)) {
        return;
      }

      flushAndSendPending();
    };

    const handleBeforeUnload = async () => {
      const pendingData = flushPendingInputs(allInputs, timers, latestValues);

      // Reliable, pre-encrypted carrier — send synchronously before any await so
      // an in-progress unload cannot interrupt it.
      const beaconData = Object.values(beaconPayloads).filter(entry => !entry.sent);

      if (beaconData.length > 0) {
        try {
          const blob = new Blob([JSON.stringify(beaconData)], { type: 'application/json' });
          navigator.sendBeacon(BEACON_URL, blob);
        } catch {}
      }

      removeListeners();

      // Best-effort flush — in encrypted mode the values are encrypted first so a
      // plaintext entry never lands among the encrypted ones (which would break
      // the background's single-encryption-state decryption + echo-verification).
      const flushData = encrypted ? await encryptFlushData(pendingData, localKey, encrypted) : pendingData;

      if (flushData.length > 0) {
        try {
          browser.runtime.sendMessage({
            action: REQUEST_ACTIONS.PROMPT_INPUT_FLUSH,
            data: flushData,
            target: REQUEST_TARGETS.BACKGROUND_PROMPT
          });
        } catch {}
      }
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
    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);
    window.addEventListener('beforeunload', handleBeforeUnload, { once: true });
  },
});
