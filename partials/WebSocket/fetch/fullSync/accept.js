// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const fullSyncAccept = async (data, state, hkdfSaltAB, sessionKeyForHKDF, messageId) => {
  console.log('FULL SYNC ACCEPT', data, state, hkdfSaltAB, sessionKeyForHKDF, messageId);

  return {
    returnUrl: '/'
  };
};

export default fullSyncAccept;
