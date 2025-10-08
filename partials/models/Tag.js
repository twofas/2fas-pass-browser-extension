// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class Tag {
  static contentType = 'tag';
  static contentVersion = 1;

  constructor (tagData) {
    validate(tagData && typeof tagData === 'object', 'Invalid tag data');

    validate(isValidUUID(tagData.id), 'Invalid or missing id: must be a valid UUID');
    validate(isValidInteger(tagData.updatedAt), 'Invalid or missing updatedAt: must be an integer');
    validate(typeof tagData.name === 'string', `Invalid tagData.name must be a string`);
    validate(isValidInteger(tagData.position, 0, 999), 'Invalid or missing tagData.position: must be an integer between 0 and 999');
    validateOptional(tagData.color, isValidHexColor, 'Invalid tagData.color: must be a hex color string (3 or 6 characters)');

    this.id = tagData.id;
    this.updatedAt = tagData.updatedAt;
    this.name = tagData.name;
    this.position = tagData.position;
  }
}

export default Tag;
