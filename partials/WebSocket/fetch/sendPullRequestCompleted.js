// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import TwoFasWebSocket from '@/partials/WebSocket';
import { PULL_REQUEST_TYPES } from '@/constants';

/** 
* Sends a message indicating that a pull request has been completed.
* @param {string} id - The ID of the pull request.
* @return {Promise<void>}
*/
const sendPullRequestCompleted = async id => {
  const socket = TwoFasWebSocket.getInstance();
  await socket.sendMessage({ id, action: PULL_REQUEST_TYPES.COMPLETED });
};

export default sendPullRequestCompleted;
