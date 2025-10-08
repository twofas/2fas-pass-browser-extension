// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class SecureNote {
  static contentType = 'secureNote';
  static contentVersion = 1;

  constructor (secureNoteData) {
    validate(secureNoteData && typeof secureNoteData === 'object', 'Invalid secure note data');

    validate(isValidUUID(secureNoteData.id), 'Invalid or missing id: must be a valid UUID');
    validate(isValidInteger(secureNoteData.createdAt), 'Invalid or missing createdAt: must be an integer');
    validate(isValidInteger(secureNoteData.updatedAt), 'Invalid or missing updatedAt: must be an integer');
    validate(isValidInteger(secureNoteData.securityType, 0, 2), 'Invalid or missing securityType: must be an integer between 0 and 2');
    validateOptional(secureNoteData.tags, tags => isValidArray(tags, tag => isValidString(tag)), 'Invalid tags: must be an array of strings');

    const content = secureNoteData?.content ? JSON.parse(secureNoteData.content) : {};

    validate(content && typeof content === 'object', 'Invalid secureNote content data');
    validateOptional(content.name, isValidString, 'Invalid content.name: must be a string');
    validateOptional(content.s_text, isValidBase64, 'Invalid content.s_text: must be a base64 string');

    this.id = secureNoteData.id;
    this.name = content.name;
    this.s_text = content.s_text;
    this.securityType = secureNoteData.securityType;
    this.tags = secureNoteData.tags || [];
    this.createdAt = secureNoteData.createdAt || null;
    this.updatedAt = secureNoteData.updatedAt || null;
  }
}

export default SecureNote;
