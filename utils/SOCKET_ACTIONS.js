// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const SOCKET_ACTIONS = Object.freeze({
  HELLO: 'hello',
  CHALLENGE: 'challenge',
  INIT_TRANSFER: 'initTransfer',
  INIT_TRANSFER_CONFIRMED: 'initTransferConfirmed',
  TRANSFER_CHUNK: 'transferChunk',
  TRANSFER_CHUNK_CONFIRMED: 'transferChunkConfirmed',
  TRANSFER_COMPLETED: 'transferCompleted',
  PULL_REQUEST: 'pullRequest',
  PULL_REQUEST_ACTION: 'pullRequestAction',
  PULL_REQUEST_COMPLETED: 'pullRequestCompleted',
  CLOSE_WITH_ERROR: 'closeWithError',
  CLOSE_WITH_SUCCESS: 'closeWithSuccess'
});
