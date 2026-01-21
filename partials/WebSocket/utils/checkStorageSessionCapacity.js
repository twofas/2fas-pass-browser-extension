// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Check if the session storage capacity is exceeded. If it is, throw an error.
* @param {number} totalSize - The total size of the data that will be stored in the session storage.
* @return {void} This function does not return a value.
*/
const checkStorageSessionCapacity = async totalSize => {
  const storageSize = browser.storage.session.QUOTA_BYTES;
  const usedBytes = await browser.storage.session.getBytesInUse();
  const availableBytes = storageSize - usedBytes;

  const availableBytesWithMargin = availableBytes * config.storageMargin;

  if (totalSize > availableBytesWithMargin) {
    throw new TwoFasError(
      TwoFasError.errors.sessionStorageCapacityExceeded,
      {
        visibleErrorMessage: getMessage('error_storage_capacity_exceeded'),
        additional: { storageSize, usedBytes, totalSize }
      });
  }
};

export default checkStorageSessionCapacity;
