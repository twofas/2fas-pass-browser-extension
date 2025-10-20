// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendPullRequestCompleted from '../sendPullRequestCompleted';

/** 
* Function to handle the full sync cancellation.
* @param {string} messageId - The ID of the message to cancel.
* @return {Promise<Object>} The result of the cancellation.
*/

const fullSyncCancel = async (messageId) => {
  try {
    await sendPullRequestCompleted(messageId);

    return {
      returnUrl: '/',
      returnToast: {
        text: browser.i18n.getMessage('fetch_full_sync_cancel_toast'),
        type: 'info'
      }
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionDeleteCancelError, { event: e });
  }
};

export default fullSyncCancel;
