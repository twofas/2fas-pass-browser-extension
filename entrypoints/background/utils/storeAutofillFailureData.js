// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Stores autofill failure data for KeepItem display when popup reopens.
* @async
* @param {number} tabId - The ID of the tab.
* @param {Object} closeData - The close data containing item and SIF info.
* @return {Promise<void>}
*/
const storeAutofillFailureData = async (tabId, closeData) => {
  if (!closeData) {
    return;
  }

  const failureKey = `session:autofillT2FailedPending-${tabId}`;

  await storage.setItem(failureKey, JSON.stringify({
    action: 'autofillT2Failed',
    vaultId: closeData.vaultId,
    deviceId: closeData.deviceId,
    itemId: closeData.itemId,
    s_password: closeData.s_password,
    encryptionItemT2KeyB64: closeData.encryptionItemT2KeyB64
  }));

  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - storeAutofillFailureData');
};

export default storeAutofillFailureData;
