// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '@/partials/WebSocket';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import closeWindowIfNotInSeparateWindow from '../functions/closeWindowIfNotInSeparateWindow';
import sendMessageToAllFrames from '../functions/sendMessageToAllFrames';
import tryWindowClose from '../browserInfo/tryWindowClose';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/** 
* Handles the close signal for the pull request action.
* @param {string} newSessionId - The new session ID.
* @param {string} uuid - The unique identifier for the user.
* @param {Object} closeData - The data related to the close action.
* @param {Object} state - The current state of fetch action.
* @return {Promise<void>} 
*/
const handleCloseSignalPullRequestAction = async (newSessionId, uuid, closeData, state) => {
  await addNewSessionIdToDevice(uuid, newSessionId); // FUTURE - Change to deviceId instead of uuid?

  try {
    const socket = TwoFasWebSocket.getInstance();
    socket.close();
  } catch { }

  if (closeData?.windowClose) {
    await tryWindowClose();
  }

  if (closeData?.action === 'autofill') {
    const tabId = state.data.tabId;
    const actionData = closeData.actionData;

    try {
      await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);
    } catch (e) {
      await CatchError(e);
    }

    let hasPasswordInAnyFrame = false;

    try {
      const inputCheckResults = await sendMessageToAllFrames(tabId, {
        action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
        target: REQUEST_TARGETS.CONTENT
      });

      hasPasswordInAnyFrame = inputCheckResults?.some(r => r.canAutofillPassword) || false;
    } catch (e) {
      await CatchError(e);
    }

    actionData.hasPasswordInAnyFrame = hasPasswordInAnyFrame;

    let needsPermission = false;

    try {
      const permissionResults = await sendMessageToAllFrames(tabId, {
        action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
        target: REQUEST_TARGETS.CONTENT,
        autofillType: 'login'
      });

      const crossDomainFrames = permissionResults?.filter(r => r.needsPermission) || [];
      needsPermission = crossDomainFrames.length > 0;

      if (needsPermission) {
        const uniqueDomains = [...new Set(crossDomainFrames.map(f => f.frameInfo?.hostname).filter(Boolean))];
        const storageKey = `session:autofillData-${tabId}`;

        // FUTURE - improve that
        await storage.setItem(storageKey, JSON.stringify({
          actionData,
          closeData: {
            vaultId: closeData.vaultId,
            deviceId: closeData.deviceId,
            itemId: closeData.itemId,
            s_password: closeData.s_password,
            hkdfSaltAB: closeData.hkdfSaltAB,
            sessionKeyForHKDF: closeData.sessionKeyForHKDF
          }
        }));

        browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.AUTOFILL_WITH_PERMISSION,
          target: REQUEST_TARGETS.BACKGROUND,
          tabId,
          storageKey,
          domains: uniqueDomains
        });

        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
        return true;
      }
    } catch (e) {
      await CatchError(e);
    }

    actionData.iframePermissionGranted = true;

    const autofillRes = await sendMessageToAllFrames(tabId, actionData);
    const isOk = autofillRes?.some(frameResponse => frameResponse.status === 'ok');

    if (isOk) {
      try {
        await sendMessageToAllFrames(tabId, {
          action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
          target: REQUEST_TARGETS.PROMPT
        });
      } catch { }

      try {
        await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.IGNORE_SAVE_PROMPT,
          target: REQUEST_TARGETS.BACKGROUND_PROMPT,
          tabId
        });
      } catch { }

      const separateWindow = await popupIsInSeparateWindow();
      await closeWindowIfNotInSeparateWindow(separateWindow);

      if (separateWindow || (!window || typeof window?.close !== 'function' || import.meta.env.BROWSER === 'safari')) {
        showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
      }
    } else {
      const toastId = showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

      eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, {
        path: '/',
        options: {
          state: {
            action: 'autofillT2Failed',
            vaultId: closeData.vaultId,
            deviceId: closeData.deviceId,
            itemId: closeData.itemId,
            s_password: closeData.s_password,
            hkdfSaltAB: closeData.hkdfSaltAB,
            sessionKeyForHKDF: closeData.sessionKeyForHKDF,
            toastId
          }
        }
      });
    }
  }

  if (closeData?.action === 'autofillCard') {
    const tabId = state.data.tabId;
    const actionData = closeData.actionData;

    try {
      await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);
    } catch (e) {
      await CatchError(e);
    }

    let needsPermission = false;

    try {
      const permissionResults = await sendMessageToAllFrames(tabId, {
        action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
        target: REQUEST_TARGETS.CONTENT,
        autofillType: 'card'
      });

      const crossDomainFrames = permissionResults?.filter(r => r.needsPermission) || [];
      needsPermission = crossDomainFrames.length > 0;

      if (needsPermission) {
        const uniqueDomains = [...new Set(crossDomainFrames.map(f => f.frameInfo?.hostname).filter(Boolean))];
        const storageKey = `session:autofillCardData-${tabId}`;

        await storage.setItem(storageKey, JSON.stringify({
          actionData,
          closeData: {
            vaultId: closeData.vaultId,
            deviceId: closeData.deviceId,
            itemId: closeData.itemId,
            s_cardNumber: closeData.s_cardNumber,
            s_expirationDate: closeData.s_expirationDate,
            s_securityCode: closeData.s_securityCode,
            hkdfSaltAB: closeData.hkdfSaltAB,
            sessionKeyForHKDF: closeData.sessionKeyForHKDF
          }
        }));

        browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.AUTOFILL_CARD_WITH_PERMISSION,
          target: REQUEST_TARGETS.BACKGROUND,
          tabId,
          storageKey,
          domains: uniqueDomains
        });

        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
        return true;
      }
    } catch (e) {
      await CatchError(e);
    }

    actionData.iframePermissionGranted = true;

    const autofillRes = await sendMessageToAllFrames(tabId, actionData);

    const relevantResponses = autofillRes?.filter(r => r && r.status && r.message !== 'No input fields found') || [];

    const isOk = relevantResponses.some(frameResponse => frameResponse.status === 'ok');
    const isPartial = relevantResponses.some(frameResponse => frameResponse.status === 'partial');

    const allFilledFields = relevantResponses.reduce((acc, r) => {
      if (r.filledFields) {
        Object.keys(r.filledFields).forEach(field => {
          if (r.filledFields[field]) {
            acc[field] = true;
          }
        });
      }

      return acc;
    }, {});

    const allMissingInputFields = relevantResponses
      .flatMap(r => r.missingInputFields || [])
      .filter((field, index, self) => self.indexOf(field) === index)
      .filter(field => !allFilledFields[field]);
    const hasMissingInputs = allMissingInputFields.length > 0;

    if (isOk && !isPartial && !hasMissingInputs) {
      const separateWindow = await popupIsInSeparateWindow();
      await closeWindowIfNotInSeparateWindow(separateWindow);

      if (separateWindow || (!window || typeof window?.close !== 'function' || import.meta.env.BROWSER === 'safari')) {
        showToast(browser.i18n.getMessage('this_tab_autofill_success'), 'success');
        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
      }
    } else if (isOk && hasMissingInputs) {
      const toastId = showToast(browser.i18n.getMessage('this_tab_autofill_some_fields_not_available'), 'info', false);

      eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, {
        path: '/',
        options: {
          state: {
            action: 'autofillCardT2Failed',
            vaultId: closeData.vaultId,
            deviceId: closeData.deviceId,
            itemId: closeData.itemId,
            s_cardNumber: closeData.s_cardNumber,
            s_expirationDate: closeData.s_expirationDate,
            s_securityCode: closeData.s_securityCode,
            hkdfSaltAB: closeData.hkdfSaltAB,
            sessionKeyForHKDF: closeData.sessionKeyForHKDF,
            toastId
          }
        }
      });
    } else if (isPartial) {
      showToast(browser.i18n.getMessage('this_tab_autofill_some_fields_not_available'), 'info');
      eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
    } else {
      const toastId = showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

      eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, {
        path: '/',
        options: {
          state: {
            action: 'autofillCardT2Failed',
            vaultId: closeData.vaultId,
            deviceId: closeData.deviceId,
            itemId: closeData.itemId,
            s_cardNumber: closeData.s_cardNumber,
            s_expirationDate: closeData.s_expirationDate,
            s_securityCode: closeData.s_securityCode,
            hkdfSaltAB: closeData.hkdfSaltAB,
            sessionKeyForHKDF: closeData.sessionKeyForHKDF,
            toastId
          }
        }
      });
    }
  }

  if (closeData?.returnUrl) {
    const navigationPayload = { path: closeData.returnUrl };

    if (closeData?.returnState) {
      navigationPayload.options = { state: closeData.returnState };
    }

    eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, navigationPayload);
  }

  if (closeData?.returnToast) {
    setTimeout(() => {
      showToast(closeData.returnToast.text, closeData.returnToast.type || 'info');
    }, 200);
  }

  return true;
};

export default handleCloseSignalPullRequestAction;
