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
import sendMessageToTab from '../functions/sendMessageToTab';
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

  // Handle windowClose ONLY if no autofill action is present
  // If autofill is needed, the window will close after autofill completes
  if (closeData?.windowClose && !closeData?.action) {
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

        // For shortcut-initiated autofill, handle cross-domain permission directly
        // instead of delegating to background (so we can wait for result)
        if (closeData.windowClose) {
          // Check if all domains are in the trusted domains list
          const trustedDomains = await storage.getItem('local:crossDomainTrustedDomains') || [];
          const allDomainsTrusted = uniqueDomains.every(domain => trustedDomains.includes(domain));

          if (!allDomainsTrusted) {
            const confirmMessage = getMessage('autofill_cross_domain_warning_popup')
              .replace('DOMAINS', uniqueDomains.join(', '));

            // Focus the tab before showing confirm dialog
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
                message: confirmMessage
              });
            } catch (e) {
              await CatchError(e);

              showToast(getMessage('this_tab_can_t_autofill_t2_failed'), 'info');
              await tryWindowClose();

              return true;
            }

            if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
              // User declined cross-domain autofill
              await tryWindowClose();
              return true;
            }
          }

          // All domains trusted or user confirmed, proceed with autofill (handled below after this block)
          // Don't return here - let it fall through to the autofill logic
        } else {
          // For regular popup, delegate to background
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
            domains: uniqueDomains
          });

          eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
          return true;
        }
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
          try {
            const currentWindow = await browser.windows.getCurrent();

            await browser.windows.update(currentWindow.id, { focused: true });
          } catch { }
        }

        const toastId = showToast(getMessage('this_tab_autofill_partial'), 'info', false);

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

        return true;
      }

      // For shortcut-initiated autofill, close the window after success
      if (closeData.windowClose) {
        await tryWindowClose();
        return true;
      }

      const separateWindow = await popupIsInSeparateWindow();
      await closeWindowIfNotInSeparateWindow(separateWindow);

      if (separateWindow || (!window || typeof window?.close !== 'function' || import.meta.env.BROWSER === 'safari')) {
        showToast(getMessage('this_tab_autofill_success'), 'success');
        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
      }
    } else {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        try {
          const currentWindow = await browser.windows.getCurrent();

          await browser.windows.update(currentWindow.id, { focused: true });
        } catch { }
      }

      const toastId = showToast(getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

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

        // For shortcut-initiated autofill, handle cross-domain permission directly
        if (closeData.windowClose) {
          // Check if all domains are in the trusted domains list
          const trustedDomains = await storage.getItem('local:crossDomainTrustedDomains') || [];
          const allDomainsTrusted = uniqueDomains.every(domain => trustedDomains.includes(domain));

          if (!allDomainsTrusted) {
            const confirmMessage = getMessage('autofill_cross_domain_warning_popup')
              .replace('DOMAINS', uniqueDomains.join(', '));

            // Focus the tab before showing confirm dialog
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
                message: confirmMessage
              });
            } catch (e) {
              await CatchError(e);

              showToast(getMessage('this_tab_can_t_autofill_t2_failed'), 'info');
              await tryWindowClose();

              return true;
            }

            if (confirmResult?.status !== 'ok' || !confirmResult?.confirmed) {
              // User declined cross-domain autofill
              await tryWindowClose();
              return true;
            }
          }

          // All domains trusted or user confirmed, proceed with autofill (handled below)
        } else {
          // For regular popup, delegate to background
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
        await tryWindowClose();
        return true;
      }

      const separateWindow = await popupIsInSeparateWindow();
      await closeWindowIfNotInSeparateWindow(separateWindow);

      if (separateWindow || (!window || typeof window?.close !== 'function' || import.meta.env.BROWSER === 'safari')) {
        showToast(getMessage('this_tab_autofill_success'), 'success');
        eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
      }
    } else if (isOk && hasMissingInputs) {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        try {
          const currentWindow = await browser.windows.getCurrent();

          await browser.windows.update(currentWindow.id, { focused: true });
        } catch { }
      }

      const toastId = showToast(getMessage('notification_card_autofill_partial_message'), 'info', false);

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
      showToast(getMessage('notification_card_autofill_partial_message'), 'info');
      eventBus.emit(eventBus.EVENTS.FETCH.NAVIGATE, { path: '/' });
    } else {
      // Focus popup window when showing KeepItem for shortcut-initiated autofill
      if (closeData.windowClose) {
        try {
          const currentWindow = await browser.windows.getCurrent();

          await browser.windows.update(currentWindow.id, { focused: true });
        } catch { }
      }

      const toastId = showToast(getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

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
