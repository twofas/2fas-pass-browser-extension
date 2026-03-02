// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '.';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import sendMessageToTab from '@/partials/functions/sendMessageToTab';
import resolveCrossDomainPermissions from '@/partials/functions/resolveCrossDomainPermissions';
import saveCrossDomainPreferences from '@/partials/functions/saveCrossDomainPreferences';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import wsNotify from './wsNotify.js';

const closePopupWindow = async () => {
  try {
    const extURL = browser.runtime.getURL('/popup.html');
    const popupTabs = await browser.tabs.query({ url: extURL });

    if (popupTabs?.length > 0) {
      await browser.windows.remove(popupTabs[0].windowId);
    }
  } catch { }
};

const focusPopupWindow = async () => {
  try {
    const extURL = browser.runtime.getURL('/popup.html');
    const popupTabs = await browser.tabs.query({ url: extURL });

    if (popupTabs?.length > 0) {
      await browser.windows.update(popupTabs[0].windowId, { focused: true });
    }
  } catch { }
};

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

  // Handle windowClose ONLY if no autofill action is present
  // If autofill is needed, the window will close after autofill completes
  if (closeData?.windowClose && !closeData?.action) {
    await closePopupWindow();
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

    try {
      const resolution = await resolveCrossDomainPermissions(tabId, 'login');

      if (resolution.allBlocked) {
        actionData.crossDomainAllowedDomains = [];
      } else if (resolution.needsDialog) {
        if (closeData.windowClose) {
          try {
            const tab = await browser.tabs.get(tabId);

            await browser.windows.update(tab.windowId, { focused: true });
            await browser.tabs.update(tabId, { active: true });
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch { }

          let confirmResult;

          try {
            confirmResult = await sendMessageToTab(tabId, {
              action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
              target: REQUEST_TARGETS.CONTENT,
              unknownDomains: resolution.unknownDomains,
              theme: await storage.getItem('local:theme')
            });
          } catch (e) {
            await CatchError(e);

            wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info' });
            await closePopupWindow();

            return true;
          }

          if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
            await closePopupWindow();
            return true;
          }

          await saveCrossDomainPreferences(confirmResult.domainPreferences);
          actionData.crossDomainAllowedDomains = [...resolution.crossDomainAllowedDomains, ...(confirmResult.allowedDomains || [])];
        } else {
          const storageKey = `session:autofillData-${tabId}`;

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
            domains: [...resolution.trustedDomains, ...resolution.untrustedDomains, ...resolution.unknownDomains]
          });

          wsNotify('navigate', { path: '/' });
          return true;
        }
      } else if (resolution.crossDomainAllowedDomains.length > 0) {
        actionData.crossDomainAllowedDomains = resolution.crossDomainAllowedDomains;
      }
    } catch (e) {
      await CatchError(e);
    }

    actionData.iframePermissionGranted = true;

    const autofillRes = await sendMessageToAllFrames(tabId, actionData);
    const isOk = autofillRes?.some(frameResponse => frameResponse.status === 'ok');
    const allFieldsFilled = autofillRes?.every(frameResponse => {
      if (frameResponse.status !== 'ok') {
        return frameResponse.message === 'No input fields found';
      }

      const couldFillUsername = !actionData.username || frameResponse.canAutofillUsername !== false;
      const couldFillPassword = !actionData.password || frameResponse.canAutofillPassword !== false;

      return couldFillUsername && couldFillPassword;
    });

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

      if (!allFieldsFilled) {
        // Focus popup window when showing KeepItem for shortcut-initiated autofill
        if (closeData.windowClose) {
          await focusPopupWindow();
        }

        const toastId = crypto.randomUUID();

        wsNotify('toast', { message: getMessage('this_tab_autofill_partial'), type: 'info', autoClose: false, toastId });

        wsNotify('navigate', {
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

        return true;
      }

      // For shortcut-initiated autofill, close the window after success
      if (closeData.windowClose) {
        await closePopupWindow();
        return true;
      }

      const separateWindow = await popupIsInSeparateWindow();

      if (!separateWindow) {
        await closePopupWindow();
      }

      // In background context, always notify popup (it may be in a separate window or Safari)
      wsNotify('toast', { message: getMessage('this_tab_autofill_success'), type: 'success' });
      wsNotify('navigate', { path: '/' });
    } else {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        await focusPopupWindow();
      }

      const toastId = crypto.randomUUID();

      wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info', autoClose: false, toastId });

      wsNotify('navigate', {
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

    try {
      const resolution = await resolveCrossDomainPermissions(tabId, 'card');

      if (resolution.allBlocked) {
        actionData.crossDomainAllowedDomains = [];
      } else if (resolution.needsDialog) {
        if (closeData.windowClose) {
          try {
            const tab = await browser.tabs.get(tabId);

            await browser.windows.update(tab.windowId, { focused: true });
            await browser.tabs.update(tabId, { active: true });
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch { }

          let confirmResult;

          try {
            confirmResult = await sendMessageToTab(tabId, {
              action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
              target: REQUEST_TARGETS.CONTENT,
              unknownDomains: resolution.unknownDomains,
              theme: await storage.getItem('local:theme')
            });
          } catch (e) {
            await CatchError(e);

            wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info' });
            await closePopupWindow();

            return true;
          }

          if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
            await closePopupWindow();
            return true;
          }

          await saveCrossDomainPreferences(confirmResult.domainPreferences);
          actionData.crossDomainAllowedDomains = [...resolution.crossDomainAllowedDomains, ...(confirmResult.allowedDomains || [])];
        } else {
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
            domains: [...resolution.trustedDomains, ...resolution.untrustedDomains, ...resolution.unknownDomains]
          });

          wsNotify('navigate', { path: '/' });
          return true;
        }
      } else if (resolution.crossDomainAllowedDomains.length > 0) {
        actionData.crossDomainAllowedDomains = resolution.crossDomainAllowedDomains;
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
      // For shortcut-initiated autofill, close the window after success
      if (closeData.windowClose) {
        await closePopupWindow();
        return true;
      }

      const separateWindow = await popupIsInSeparateWindow();

      if (!separateWindow) {
        await closePopupWindow();
      }

      // In background context, always notify popup (it may be in a separate window or Safari)
      wsNotify('toast', { message: getMessage('this_tab_autofill_success'), type: 'success' });
      wsNotify('navigate', { path: '/' });
    } else if (isOk && hasMissingInputs) {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        await focusPopupWindow();
      }

      const toastId = crypto.randomUUID();

      wsNotify('toast', { message: getMessage('notification_card_autofill_partial_message'), type: 'info', autoClose: false, toastId });

      wsNotify('navigate', {
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
      wsNotify('toast', { message: getMessage('notification_card_autofill_partial_message'), type: 'info' });
      wsNotify('navigate', { path: '/' });
    } else {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        await focusPopupWindow();
      }

      const toastId = crypto.randomUUID();

      wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info', autoClose: false, toastId });

      wsNotify('navigate', {
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

    wsNotify('navigate', navigationPayload);
  }

  if (closeData?.returnToast) {
    setTimeout(() => {
      wsNotify('toast', { message: closeData.returnToast.text, type: closeData.returnToast.type || 'info' });
    }, 200);
  }

  return true;
};

export default handleCloseSignalPullRequestAction;
