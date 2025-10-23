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

  constructor (secureNoteData, vaultId = null, deviceId = null) {
    if (secureNoteData.constructor.name === SecureNote.name) {
      return secureNoteData;
    }

    super(secureNoteData, vaultId, deviceId);

    validate(secureNoteData.content && typeof secureNoteData.content === 'object', 'Invalid secureNote content data');
    validateOptional(secureNoteData.content.name, isValidString, 'Invalid content.name: must be a string');
    validateOptional(secureNoteData.content.s_text, isValidBase64, 'Invalid content.s_text: must be a base64 string');

    this.contentType = SecureNote.contentType;
    this.contentVersion = SecureNote.contentVersion;
    this.name = secureNoteData.content.name;
    // Secure Input Fields
    this.#s_text = secureNoteData.content.s_text;
  }

  get dropdownList () {
    return [
      { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), id: this.id, type: 'details' }
    ];
  }

  get sifExists () {
    return this.#s_text && this.#s_text.length > 0;
  }
}

export default SecureNote;
