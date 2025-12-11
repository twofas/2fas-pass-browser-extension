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
    validateOptional(secureNoteData?.content?.additionalInfo, isValidString, 'Invalid content.additionalInfo: must be a string');

    validateOptional(secureNoteData?.internalData, data => typeof data === 'object', 'Invalid secureNoteData.internalData: must be an object');
    validateOptional(secureNoteData?.internalData?.type, isValidString, 'Invalid secureNoteData.internalData.type: must be a string');

    this.contentType = SecureNote.contentType;
    this.contentVersion = SecureNote.contentVersion;

    this.content = {
      name: secureNoteData.content.name,
      additionalInfo: secureNoteData.content.additionalInfo || null
    };

    this.internalData = {
      ...this.internalData,
      uiName: browser.i18n.getMessage('secure_note'),
      type: secureNoteData.internalData?.type || null,
      sifResetTime: secureNoteData.internalData?.sifResetTime || null
    };

    // Secure Input Fields
    this.#s_text = secureNoteData.content.s_text;
  }

  removeSif () {
    if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET) {
      throw new Error('Item is not of Highly Secret security tier');
    }

    this.#s_text = null;
  }

  async decryptSif () {
    return {
      text: await super.decryptSif(this.#s_text, this?.internalData?.type)
    };
  }

  async setSif (sifData) {
    if (!Array.isArray(sifData)) {
      throw new Error('Invalid SIF data: must be an array');
    }

    for (const item of sifData) {
      if (Object.prototype.hasOwnProperty.call(item, 's_text')) {
        this.#s_text = await this.encryptSif(item.s_text, this?.internalData?.type);
      }
    }
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: browser.i18n.getMessage('this_tab_more_forget_secure_note'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'forget' });
    }

    return dO;
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

  toJSON () {
    return {
      ...super.toJSON(),
      contentType: SecureNote.contentType,
      contentVersion: SecureNote.contentVersion,
      content: {
        name: this.content.name,
        s_text: this.#s_text,
        additionalInfo: this.content.additionalInfo || null
      },
      internalData: {
        ...this.internalData
      }
    };
  }
}

export default SecureNote;
