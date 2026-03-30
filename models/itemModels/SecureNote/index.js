// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from '@/models/itemModels/Item';

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

    this.contentType = SecureNote.contentType;
    this.contentVersion = SecureNote.contentVersion;

    this.content = {
      name: secureNoteData.content.name,
      additionalInfo: secureNoteData.content.additionalInfo || null
    };

    this.internalData = {
      ...this.internalData,
      uiName: getMessage('secure_note')
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

  /**
  * Sets already-encrypted SIF data directly without re-encrypting.
  * @param {Array<Object>} sifData - Array of objects with encrypted SIF values.
  */
  setSifEncrypted (sifData) {
    if (!Array.isArray(sifData)) {
      throw new Error('Invalid SIF data: must be an array');
    }

    for (const item of sifData) {
      if (Object.prototype.hasOwnProperty.call(item, 's_text')) {
        this.#s_text = item.s_text;
      }
    }
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: getMessage('this_tab_more_details'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.SECRET || (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists)) {
      dO.push({ value: 'share', label: getMessage('this_tab_more_share'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'share' });
    }

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: getMessage('this_tab_more_forget_secure_note'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'forget' });
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

  /**
  * Build a share-ready payload by decrypting SIF fields.
  * Clears decrypted values from memory after building.
  * @returns {Promise<{contentType: string, contentVersion: number, content: Object}>}
  */
  async toShareContent () {
    const sif = await this.decryptSif();

    const content = {
      name: this.content.name || '',
      text: sif.text || ''
    };

    sif.text = null;

    return { contentType: SecureNote.contentType, contentVersion: SecureNote.contentVersion, content };
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
