// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const getVaults = async deviceId => {
  const devices = await storage.getItem('local:devices') || [];
  const device = devices.find(d => d?.id === deviceId);

  if (!device || !device.vaults) {
    return [];
  }

  return device.vaults;
};

export default getVaults;
