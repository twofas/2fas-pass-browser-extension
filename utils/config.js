// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const config = {
  scheme: 1,
  webSocketInternalTimeout: 2,
  passwordResetDelay: 3,
  storageMargin: 0.95, // 95%
  devicesCleanupThreshold: 30,
  toastAutoClose: 5000,
  defaultStorageIdleLock: 15, // minutes
  handleInputEventDebounce: 300 // milliseconds
};
