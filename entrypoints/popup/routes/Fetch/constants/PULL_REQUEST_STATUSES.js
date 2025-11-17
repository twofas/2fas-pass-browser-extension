// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const PULL_REQUEST_ACTION_STATUSES = {
  CANCEL: 'cancel',
  ACCEPT: 'accept',
  ADDED_IN_T1: 'addedInT1',
  ADDED_IN_ANOTHER_VAULT: 'addedInAnotherVault',
  ADDED: 'added',
  UPDATED: 'updated'
};

Object.freeze(PULL_REQUEST_ACTION_STATUSES);

export default PULL_REQUEST_ACTION_STATUSES;
