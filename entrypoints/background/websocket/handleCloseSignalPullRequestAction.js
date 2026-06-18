// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import addNewSessionIdToDevice from './utils/addNewSessionIdToDevice';
import TwoFasWebSocket from '.';
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import sendMessageToTab from '@/partials/functions/sendMessageToTab';
import resolveCrossDomainPermissions from '@/partials/functions/resolveCrossDomainPermissions';
import focusTabForDialog from '@/partials/functions/focusTabForDialog';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import wsNotify from './wsNotify.js';
import protectActionDataPassword from '../utils/protectActionDataPassword';
import protectCardActionData from '../utils/protectCardActionData';
import { closePopupWindow, finishLoginAutofill, finishCardAutofill } from './utils/finishPullRequestAutofill.js';

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
        // The decrypted SIF (Top/Highly Secret pull) must not sit in session storage as a
        // plaintext password while the cross-domain dialog is pending (finding #5). Wrap it
        // with the local key up front; it is unwrapped back to plaintext just before the fill.
        const protectedResult = await protectActionDataPassword(actionData);

        if (protectedResult.status !== 'ok') {
          wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info' });

          if (closeData.windowClose) {
            await closePopupWindow();
          }

          return true;
        }

        const dialogActionData = protectedResult.actionData;

        if (closeData.windowClose) {
          const storageKey = `session:autofillData-${tabId}`;

          await storage.setItem(storageKey, JSON.stringify({
            actionData: dialogActionData,
            closeData: {
              vaultId: closeData.vaultId,
              deviceId: closeData.deviceId,
              itemId: closeData.itemId,
              s_password: closeData.s_password,
              encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
              windowClose: true
            },
            trustedDomains: resolution.crossDomainAllowedDomains
          }));

          logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - handleCloseSignalPullRequestAction (autofillData windowClose dialog)');

          await focusTabForDialog(tabId);

          try {
            await sendMessageToTab(tabId, {
              action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
              target: REQUEST_TARGETS.CONTENT,
              unknownDomains: resolution.unknownDomains,
              storageKey,
              theme: await storage.getItem('local:theme')
            });
          } catch (e) {
            await CatchError(e);
            await storage.removeItem(storageKey);

            wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info' });
            await closePopupWindow();
          }

          return true;
        } else {
          const storageKey = `session:autofillData-${tabId}`;

          await storage.setItem(storageKey, JSON.stringify({
            actionData: dialogActionData,
            closeData: {
              vaultId: closeData.vaultId,
              deviceId: closeData.deviceId,
              itemId: closeData.itemId,
              s_password: closeData.s_password,
              encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64
            }
          }));

          logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - handleCloseSignalPullRequestAction (autofillData)');

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
      } else {
        actionData.crossDomainAllowedDomains = resolution.crossDomainAllowedDomains || [];
      }
    } catch (e) {
      await CatchError(e);
      actionData.crossDomainAllowedDomains = [];
    }

    actionData.iframePermissionGranted = true;

    const autofillRes = await sendMessageToAllFrames(tabId, actionData);

    await finishLoginAutofill(tabId, actionData, closeData, autofillRes);

    return true;
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
        // The decrypted card SIF (Top/Highly Secret pull) must not sit in session storage as
        // plaintext while the cross-domain dialog is pending (finding #5). Wrap the card fields
        // with the local key up front; they are unwrapped back to plaintext just before the fill.
        const protectedResult = await protectCardActionData(actionData);

        if (protectedResult.status !== 'ok') {
          wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info' });

          if (closeData.windowClose) {
            await closePopupWindow();
          }

          return true;
        }

        const dialogActionData = protectedResult.actionData;

        if (closeData.windowClose) {
          const storageKey = `session:autofillCardData-${tabId}`;

          await storage.setItem(storageKey, JSON.stringify({
            actionData: dialogActionData,
            closeData: {
              vaultId: closeData.vaultId,
              deviceId: closeData.deviceId,
              itemId: closeData.itemId,
              s_cardNumber: closeData.s_cardNumber,
              s_expirationDate: closeData.s_expirationDate,
              s_securityCode: closeData.s_securityCode,
              encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64,
              windowClose: true
            },
            trustedDomains: resolution.crossDomainAllowedDomains
          }));

          logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - handleCloseSignalPullRequestAction (autofillCardData windowClose dialog)');

          await focusTabForDialog(tabId);

          try {
            await sendMessageToTab(tabId, {
              action: REQUEST_ACTIONS.SHOW_CROSS_DOMAIN_CONFIRM,
              target: REQUEST_TARGETS.CONTENT,
              unknownDomains: resolution.unknownDomains,
              storageKey,
              theme: await storage.getItem('local:theme')
            });
          } catch (e) {
            await CatchError(e);
            await storage.removeItem(storageKey);

            wsNotify('toast', { message: getMessage('this_tab_can_t_autofill_t2_failed'), type: 'info' });
            await closePopupWindow();
          }

          return true;
        } else {
          const storageKey = `session:autofillCardData-${tabId}`;

          await storage.setItem(storageKey, JSON.stringify({
            actionData: dialogActionData,
            closeData: {
              vaultId: closeData.vaultId,
              deviceId: closeData.deviceId,
              itemId: closeData.itemId,
              s_cardNumber: closeData.s_cardNumber,
              s_expirationDate: closeData.s_expirationDate,
              s_securityCode: closeData.s_securityCode,
              encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64
            }
          }));

          logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - handleCloseSignalPullRequestAction (autofillCardData)');

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
      } else {
        actionData.crossDomainAllowedDomains = resolution.crossDomainAllowedDomains || [];
      }
    } catch (e) {
      await CatchError(e);
      actionData.crossDomainAllowedDomains = [];
    }

    actionData.iframePermissionGranted = true;

    const autofillRes = await sendMessageToAllFrames(tabId, actionData);

    await finishCardAutofill(tabId, actionData, closeData, autofillRes);

    return true;
  }

  if (closeData?.returnToast) {
    wsNotify('toast', { message: closeData.returnToast.text, type: closeData.returnToast.type || 'info' });
  }

  if (closeData?.returnUrl) {
    const navigationPayload = { path: closeData.returnUrl };

    if (closeData?.returnState) {
      navigationPayload.options = { state: closeData.returnState };
    }

    if (closeData?.clearPopupState) {
      navigationPayload.resetStore = true;
    }

    wsNotify('navigate', navigationPayload);
  }

  return true;
};

export default handleCloseSignalPullRequestAction;
