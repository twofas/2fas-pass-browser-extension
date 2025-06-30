// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const PULL_REQUEST_TYPES = {
  PASSWORD_REQUEST: 'passwordRequest',
  DELETE_LOGIN: 'deleteLogin',
  NEW_LOGIN: 'newLogin',
  UPDATE_LOGIN: 'updateLogin',
  FETCH_REQUEST: 'fetchRequest',
  COMPLETED: 'pullRequestCompleted'
};

export default PULL_REQUEST_TYPES;
