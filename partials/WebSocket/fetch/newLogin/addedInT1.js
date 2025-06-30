// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';

/** 
* Function to handle the addition of a new login in T1.
* @param {string} messageId - The ID of the message to be sent.
* @return {Promise<Object>} Object containing returnUrl and returnToast.
*/
const newLoginAddedInT1 = async messageId => {
  try {
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_new_login_added_t1_toast'),
        type: 'success'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginAddedInT1Error);
  }
};

export default newLoginAddedInT1;
