// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';

/** 
* Handles the cancellation of a login update request.
* @param {string} loginId - The ID of the login session.
* @param {string} messageId - The ID of the message to be sent.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const updateLoginCancel = async (loginId, messageId) => {
  try {
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: `/details/${loginId}`,
      returnToast: {
        text: browser.i18n.getMessage('fetch_update_login_cancel_toast'),
        type: 'info'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginCancelError);
  }
};

export default updateLoginCancel;
