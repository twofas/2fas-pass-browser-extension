// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';

/** 
* Handles the cancellation of a item update request.
* @param {string} deviceId - The ID of the item session.
* @param {string} vaultId - The ID of the vault containing the item.
* @param {string} itemId - The ID of the item being updated.
* @param {string} messageId - The ID of the message to be sent.
* @param {Object} state - The current state of fetch action.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const updateDataCancel = async (deviceId, vaultId, itemId, messageId, state) => {
  try {
    await sendPullRequestCompleted(messageId);

    const navigationOptions = {
      returnUrl: `/details/${deviceId}/${vaultId}/${itemId}`,
      returnToast: {
        text: browser.i18n.getMessage('fetch_update_login_cancel_toast'),
        type: 'info'
      }
    };

    if (state?.data) {
      const restoredItem = { ...state.data };
      let uiFlags = {};

      if (state.data.uiState) {
        uiFlags = { ...state.data.uiState };
        delete restoredItem.uiState;
      } else {
        if (restoredItem.content) {
          if (restoredItem.content.name !== undefined) uiFlags.nameEditable = true;
          if (restoredItem.content.notes !== undefined) uiFlags.notesEditable = true;
          if (restoredItem.content.additionalInfo !== undefined) uiFlags.additionalInfoEditable = true;
          if (restoredItem.tags !== undefined) uiFlags.tagsEditable = true;
          if (restoredItem.securityType !== undefined) uiFlags.tierEditable = true;
        }
      }

      if (restoredItem.content) {
        if (restoredItem.content.username && typeof restoredItem.content.username === 'object' && restoredItem.content.username.value !== undefined) {
          restoredItem.content.username = restoredItem.content.username.value;
          uiFlags.usernameEditable = true;
        }

        if (restoredItem.content.s_password !== undefined) {
          if (typeof restoredItem.content.s_password === 'object' && restoredItem.content.s_password.value !== undefined) {
            restoredItem.content.s_password = restoredItem.content.s_password.value;
          }

          uiFlags.passwordEditable = true;
        }

        if (restoredItem.content.s_text !== undefined) {
          if (typeof restoredItem.content.s_text === 'object' && restoredItem.content.s_text.value !== undefined) {
            restoredItem.content.s_text = restoredItem.content.s_text.value;
          }

          uiFlags.sifEditable = true;
          uiFlags.revealSecureNote = true;
        }
      }

      if (restoredItem.itemId) {
        restoredItem.id = restoredItem.itemId;
      }

      if (restoredItem.internalData) {
        delete restoredItem.internalData;
      }

      navigationOptions.returnState = {
        data: {
          item: restoredItem,
          ...uiFlags
        },
        from: 'fetch'
      };
    }

    return navigationOptions;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginCancelError, { event: e });
  }
};

export default updateDataCancel;
