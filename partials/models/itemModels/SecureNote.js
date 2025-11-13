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

    validateOptional(secureNoteData?.internalData, data => typeof data === 'object', 'Invalid secureNoteData.internalData: must be an object');
    validateOptional(secureNoteData?.internalData?.type, isValidString, 'Invalid secureNoteData.internalData.type: must be a string');

    this.contentType = SecureNote.contentType;
    this.contentVersion = SecureNote.contentVersion;

    this.content = {
      name: secureNoteData.content.name,
      s_text: secureNoteData.content.s_text
    };

    this.internalData = {
      uiName: 'Secure Note',
      type: secureNoteData.internalData?.type || null,
      sifResetTime: secureNoteData.internalData?.sifResetTime || null,
      editedText: secureNoteData.internalData?.editedText ?? null
    };
    
    // Secure Input Fields
    this.#s_text = secureNoteData.content.s_text;
  }

  removeSif () {

  }

  async decryptSif () {
    return {
      text: await super.decryptSif(this.#s_text, this?.internalData?.type)
    };
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
    // Needed!
  }

  toJSON () {
    return {
      ...super.toJSON(),
      contentType: SecureNote.contentType,
      contentVersion: SecureNote.contentVersion,
      content: {
        name: this.content.name,
        s_text: this.#s_text
      },
      internalData: {
        uiName: this.internalData.uiName,
        type: this.internalData.type,
        sifResetTime: this.internalData.sifResetTime,
        editedText: this.internalData.editedText
      }
    };
  }
}

export default SecureNote;
