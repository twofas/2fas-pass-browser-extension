// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';

/** 
* Function to handle the cancellation of a new login request.
* @param {string} messageId - The ID of the message to be sent.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const newLoginCancel = async messageId => {
  try {
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_new_login_cancel_toast'),
        type: 'info'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginCancelError);
  }
};

export default newLoginCancel;
