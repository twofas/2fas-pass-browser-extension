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
          if (restoredItem.tags !== undefined) uiFlags.tagsEditable = true;
          if (restoredItem.securityType !== undefined) uiFlags.tierEditable = true;
        }
      }

      if (restoredItem.content) {
        if (restoredItem.content.username && typeof restoredItem.content.username === 'object' && restoredItem.content.username.value !== undefined) {
          restoredItem.content.username = restoredItem.content.username.value;
          uiFlags.usernameEditable = true;
        }

        if (restoredItem.content.s_password && typeof restoredItem.content.s_password === 'object' && restoredItem.content.s_password.value !== undefined) {
          const passwordValue = restoredItem.content.s_password.value;

          if (restoredItem.contentType === 'login') {
            if (!restoredItem.internalData) {
              restoredItem.internalData = {};
            }

            restoredItem.internalData.editedSif = passwordValue;
            delete restoredItem.content.s_password;
          } else {
            restoredItem.content.s_password = passwordValue;
          }

          uiFlags.passwordEditable = true;
          uiFlags.passwordEdited = true;
        }

        if (restoredItem.content.s_text !== undefined) {
          let textValue;

          if (typeof restoredItem.content.s_text === 'object' && restoredItem.content.s_text.value !== undefined) {
            textValue = restoredItem.content.s_text.value;
          } else if (typeof restoredItem.content.s_text === 'string') {
            textValue = restoredItem.content.s_text;
          }

          if (textValue !== undefined) {
            if (!restoredItem.internalData) {
              restoredItem.internalData = {};
            }
            restoredItem.internalData.editedSif = textValue;
            delete restoredItem.content.s_text;
            uiFlags.sifEditable = true;
            uiFlags.sifVisible = true;
            uiFlags.revealSecureNote = true;
          }
        }
      }

      if (restoredItem.itemId) {
        restoredItem.id = restoredItem.itemId;
      }

      let editedSifToPreserve;
      if (restoredItem.internalData) {
        editedSifToPreserve = restoredItem.internalData.editedSif;
        delete restoredItem.internalData;
      }

      navigationOptions.returnState = {
        data: {
          item: restoredItem,
          ...uiFlags
        },
        from: 'fetch'
      };

      if (editedSifToPreserve !== undefined) {
        navigationOptions.returnState.data.editedSif = editedSifToPreserve;
      }
    }

    return navigationOptions;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginCancelError, { event: e });
  }
};

export default updateDataCancel;
