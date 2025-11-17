// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const FETCH_STATE = {
  DEFAULT: -1,
  PUSH_NOTIFICATION: 0,
  CONNECTION_ERROR: 1,
  CONNECTION_TIMEOUT: 2,
  CONTINUE_UPDATE: 3
};

Object.freeze(FETCH_STATE);

export default FETCH_STATE;
