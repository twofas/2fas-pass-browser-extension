// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, popupIsInSeparateWindow, closeWindowIfNotInSeparateWindow, encryptValueForTransmission, resolveCrossDomainPermissions, aggregateLoginAutofillResponses } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import protectActionDataPassword from '@/entrypoints/background/utils/protectActionDataPassword';
import { acquireAutofillTab, showT2Toast, showGenericToast } from './autofillPopupShared';
import { PULL_REQUEST_TYPES } from '@/constants';
import Login from '@/models/itemModels/Login';

/**
* Handles the autofill action for Login items.
* @async
* @param {Login} item - The Login item to autofill.
* @param {function} navigate - The navigate function.
* @return {Promise<void>}
*/
const handleLoginAutofill = async (item, navigate) => {
  const isHighlySecret = item.securityType === SECURITY_TIER.HIGHLY_SECRET;
  const onTabError = isHighlySecret ? showT2Toast : showGenericToast;

  logger.info(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'Popup-ThisTab - login autofill triggered', {
    itemId: item?.id,
    deviceId: item?.deviceId,
    vaultId: item?.vaultId,
    securityType: item?.securityType
  });

  const prolog = await acquireAutofillTab(onTabError, 'login');

  if (!prolog) {
    return;
  }

  const { tab, cryptoAvailableRes } = prolog;
  const hasPassword = item.sifExists;
  const hasUsername = item?.content.username && item.content.username.length > 0;
  let passwordDecrypt = true;
  let pageHasPasswordInputs = false;

  if (isHighlySecret) {
    let canAutofill = false;
    let canAutofillPassword = false;

    try {
      const inputTests = await sendMessageToAllFrames(tab.id, {
        action: REQUEST_ACTIONS.CHECK_AUTOFILL_INPUTS,
        target: REQUEST_TARGETS.CONTENT
      });

      canAutofillPassword = inputTests.some(input => input.canAutofillPassword);
      const canAutofillUsername = inputTests.some(input => input.canAutofillUsername);
      canAutofill = canAutofillPassword || canAutofillUsername;
    } catch {
      canAutofill = false;
    }

    if (!canAutofill) {
      showT2Toast();
      return;
    }

    pageHasPasswordInputs = canAutofillPassword;

    if (canAutofillPassword) {
      if (!hasPassword) {
        navigate(
          '/fetch', {
            state: {
              action: PULL_REQUEST_TYPES.SIF_REQUEST,
              from: 'autofill',
              data: {
                itemId: item.id,
                deviceId: item.deviceId,
                vaultId: item.vaultId,
                tabId: tab.id,
                cryptoAvailable: cryptoAvailableRes.cryptoAvailable,
                contentType: Login.contentType
              }
            }
          }
        );

        return;
      }
    } else {
      passwordDecrypt = false;
    }
  } else if (item.securityType === SECURITY_TIER.SECRET) {
    if (!hasPassword && hasUsername) {
      passwordDecrypt = false;
    } else if (!hasPassword && !hasUsername) {
      showToast(getMessage('this_tab_autofill_no_username_and_password'), 'error');
      return;
    }
  }

  let decryptedPassword = '';
  let encryptedValueB64 = null;

  if (passwordDecrypt) {
    try {
      const decryptedValue = await item.decryptSif();
      decryptedPassword = decryptedValue.password;
    } catch (e) {
      showToast(getMessage('error_autofill_failed'), 'error');
      await CatchError(e);
      return;
    }

    if (decryptedPassword) {
      const cryptoAvailable = cryptoAvailableRes.status === 'ok' && cryptoAvailableRes.cryptoAvailable;

      if (!cryptoAvailable) {
        encryptedValueB64 = decryptedPassword;
      } else {
        const passwordResult = await encryptValueForTransmission(decryptedPassword);

        if (passwordResult.status !== 'ok') {
          showToast(getMessage('error_autofill_failed'), 'error');
          return;
        }

        encryptedValueB64 = passwordResult.data;
      }
    } else {
      passwordDecrypt = false;
    }

    decryptedPassword = '';
  }

  const actionData = {
    action: REQUEST_ACTIONS.AUTOFILL,
    username: item.content.username,
    target: REQUEST_TARGETS.CONTENT,
    cryptoAvailable: cryptoAvailableRes.cryptoAvailable,
    iframePermissionGranted: true,
    crossDomainAllowedDomains: []
  };

  if (passwordDecrypt) {
    actionData.password = encryptedValueB64;
  }

  encryptedValueB64 = null;

  try {
    const resolution = await resolveCrossDomainPermissions(tab.id, 'login', {
      hasUsername,
      hasPassword: passwordDecrypt
    });

    if (resolution.allBlocked) {
      actionData.crossDomainAllowedDomains = [];
    } else if (resolution.needsDialog) {
      const storageKey = `session:autofillData-${tab.id}`;

      // Never persist a plaintext password at rest while the dialog is pending (finding #5).
      // protectActionDataPassword wraps it with the local key (no-op when crypto is available);
      // the background unwraps it back to plaintext just before the fill.
      const protectedResult = await protectActionDataPassword(actionData);

      if (protectedResult.status !== 'ok') {
        showToast(getMessage('error_autofill_failed'), 'error');
        return;
      }

      await storage.setItem(storageKey, JSON.stringify({
        actionData: protectedResult.actionData,
        closeData: {
          vaultId: item.vaultId,
          deviceId: item.deviceId,
          itemId: item.id,
          securityType: item.securityType
        }
      }));

      browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.AUTOFILL_WITH_PERMISSION,
        target: REQUEST_TARGETS.BACKGROUND,
        tabId: tab.id,
        storageKey,
        domains: [...resolution.trustedDomains, ...resolution.untrustedDomains, ...resolution.unknownDomains]
      });

      return;
    } else {
      actionData.crossDomainAllowedDomains = resolution.crossDomainAllowedDomains || [];
    }
  } catch (e) {
    await CatchError(e);
  }

  let res;

  try {
    const reinjected = await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);

    if (!reinjected) {
      logger.warn(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'Popup-ThisTab - re-injection before AUTOFILL did not verify all frames', { tabId: tab.id });
    }
  } catch (e) {
    await CatchError(e);
  }

  try {
    res = await sendMessageToAllFrames(tab.id, actionData);
  } catch (e) {
    await CatchError(e);
  }

  if (!res) {
    logger.error(LOGGER_CONSTANTS.CATEGORIES.AUTOFILL, 'Popup-ThisTab - AUTOFILL no response from any frame', { tabId: tab.id });

    if (isHighlySecret && !hasPassword) {
      const toastId = showToast(getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

      navigate('/', {
        state: {
          action: 'autofillT2Failed',
          vaultId: item.vaultId,
          deviceId: item.deviceId,
          itemId: item.id,
          toastId
        }
      });

      return;
    }

    showToast(getMessage('error_autofill_failed'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoResponse, { additional: { func: 'handleLoginAutofill' } }));

    return;
  }

  const { isOk, allFieldsFilled } = aggregateLoginAutofillResponses(res, actionData);

  if (!isHighlySecret) {
    pageHasPasswordInputs = res.some(r => r.canAutofillPassword);
  }

  if (isOk) {
    const separateWindow = await popupIsInSeparateWindow();

    if (!passwordDecrypt && pageHasPasswordInputs && !hasPassword && isHighlySecret) {
      showToast(getMessage('this_tab_autofill_fetch_password'), 'info');
    } else if (!passwordDecrypt && pageHasPasswordInputs) {
      showToast(getMessage('this_tab_autofill_no_password'), 'info');
    } else if (!allFieldsFilled && isHighlySecret && !hasPassword) {
      const toastId = showToast(getMessage('this_tab_autofill_partial'), 'info', false);

      navigate('/', {
        state: {
          action: 'autofillT2Failed',
          vaultId: item.vaultId,
          deviceId: item.deviceId,
          itemId: item.id,
          toastId
        }
      });
    } else if (!separateWindow) {
      await closeWindowIfNotInSeparateWindow(separateWindow);
    } else {
      showToast(getMessage('this_tab_autofill_success'), 'success');
    }
  } else {
    if (isHighlySecret && !hasPassword) {
      const toastId = showToast(getMessage('this_tab_can_t_autofill_t2_failed'), 'info', false);

      navigate('/', {
        state: {
          action: 'autofillT2Failed',
          vaultId: item.vaultId,
          deviceId: item.deviceId,
          itemId: item.id,
          toastId
        }
      });

      return;
    }

    showToast(getMessage('this_tab_can_t_find_inputs'), 'info');
  }
};

export default handleLoginAutofill;
