// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class Tag {
  static contentVersion = 1;
  static Colors = Object.freeze(['gray', 'red', 'orange', 'yellow', 'green', 'cyan', 'indigo', 'purple' ]);

  constructor (tagData, vaultId = null, deviceId = null) {
    validate(tagData && typeof tagData === 'object', 'Invalid tag data');

    validate(isValidUUID(tagData.id), 'Invalid or missing id: must be a valid UUID');

    if (vaultId) {
      validate(isValidUUID(vaultId), 'Invalid or missing vaultId: must be a valid UUID');
      this.vaultId = vaultId;
    } else if (tagData.vaultId) {
      validate(isValidUUID(tagData.vaultId), 'Invalid or missing vaultId: must be a valid UUID');
      this.vaultId = tagData.vaultId;
    } else {
      throw new Error('Missing vaultId');
    }

    if (deviceId) {
      validate(isValidUUID(deviceId), 'Invalid or missing deviceId: must be a valid UUID');
      this.deviceId = deviceId;
    } else if (tagData.deviceId) {
      validate(isValidUUID(tagData.deviceId), 'Invalid or missing deviceId: must be a valid UUID');
      this.deviceId = tagData.deviceId;
    } else {
      throw new Error('Missing deviceId');
    }

    validate(isValidInteger(tagData.updatedAt), 'Invalid or missing updatedAt: must be an integer');
    validate(typeof tagData.name === 'string', `Invalid tagData.name must be a string`);
    validate(isValidInteger(tagData.position, 0, 999), 'Invalid or missing tagData.position: must be an integer between 0 and 999');

    this.id = tagData.id;
    this.deviceId = tagData.deviceId;
    this.vaultId = tagData.vaultId;
    this.updatedAt = tagData.updatedAt;
    this.name = tagData.name;
    this.position = tagData.position;

    if (typeof tagData?.color === 'string') {
      if (Tag.Colors.includes(tagData.color)) {
        this.color = tagData.color;
      } else {
        this.color = 'gray';
      }
    }
  }
}

export default Tag;
