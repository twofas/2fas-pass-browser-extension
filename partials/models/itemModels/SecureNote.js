// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from './Item';

/**
* Class representing a secure note.
* @extends Item
*/
class SecureNote extends Item {
  static contentType = 'secureNote';
  static contentVersion = 1;

  #s_text;

  constructor (secureNoteData, deviceId = null, vaultId = null) {
    if (secureNoteData.constructor.name === SecureNote.name) {
      return secureNoteData;
    }

    super(secureNoteData, deviceId, vaultId);

    validate(secureNoteData.content && typeof secureNoteData.content === 'object', 'Invalid secureNote data');
    validate(secureNoteData?.content?.name, isValidString, 'Invalid content.name: must be a string');
    validateOptional(secureNoteData?.content?.s_text, isValidBase64, 'Invalid content.s_text: must be a base64 string');

    this.contentType = SecureNote.contentType;
    this.contentVersion = SecureNote.contentVersion;
    this.content = {
      name: secureNoteData.content.name,
      s_text: secureNoteData.content.s_text
    };
    
    // Secure Input Fields
    this.#s_text = secureNoteData.content.s_text;
  }

  removeSif () {

  }

  async decryptSif () {

  }

  setSif () {

  }

  setTextDecrypted () {

  }

  removeTextDecrypted () {

  }

  get textDecrypted () {

  }

  get isTextDecrypted () {

  }

  get dropdownList () {
    return [];
  }

  get contextMenuItem () {
    return {};
  }

  get sifs () {
    return ['s_text'];
  }

  get sifExists () {
    return this.#s_text && this.#s_text.length > 0;
  }

  get isT3orT2WithPassword () {

  }

  toJSON () {
    return {
      ...super.toJSON(),
      contentType: SecureNote.contentType,
      contentVersion: SecureNote.contentVersion,
      content: {
        name: this.content.name,
        s_text: this.#s_text
      }
    };
  }
}

export default SecureNote;
