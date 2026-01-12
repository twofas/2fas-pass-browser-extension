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
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const updateDataCancel = async (deviceId, vaultId, itemId, messageId) => {
  try {
    await sendPullRequestCompleted(messageId);

    const navigationOptions = {
      returnUrl: `/details/${deviceId}/${vaultId}/${itemId}`,
      returnToast: {
        text: browser.i18n.getMessage('fetch_update_login_cancel_toast'),
        type: 'info'
      }
    };

    return navigationOptions;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginCancelError, { event: e });
  }
};

export default updateDataCancel;
