// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from './Item';
import { v4 as uuidv4 } from 'uuid';

/**
* Class representing a credit card.
* @extends Item
*/
export default class CreditCard extends Item {
  static contentType = 'card';
  static contentVersion = 1;

  #s_cardNumber;
  #s_expirationDate;
  #s_securityCode;
  #s_cardNumberDecrypted;
  #s_expirationDateDecrypted;
  #s_securityCodeDecrypted;

  constructor (creditCardData, deviceId = null, vaultId = null) {
    if (creditCardData.constructor.name === creditCardData.name) {
      return creditCardData;
    }

    super(creditCardData, deviceId, vaultId);

    validate(creditCardData.content && typeof creditCardData.content === 'object', 'Invalid credit card data');

    validateOptional(creditCardData?.content?.name, isValidString, 'Invalid creditCardData.content.name: must be a string');
    validateOptional(creditCardData?.content?.cardHolder, isValidString, 'Invalid creditCardData.content.cardHolder: must be a string');

    validateOptional(creditCardData?.content?.s_cardNumber, isValidBase64, 'Invalid creditCardData.content.s_cardNumber: must be a base64 string');
    validateOptional(creditCardData?.content?.s_expirationDate, isValidBase64, 'Invalid creditCardData.content.s_expirationDate: must be a base64 string');
    validateOptional(creditCardData?.content?.s_securityCode, isValidBase64, 'Invalid creditCardData.content.s_securityCode: must be a base64 string');

    validateOptional(creditCardData?.content?.notes, isValidString, 'Invalid creditCardData.content.notes: must be a string');

    validateOptional(creditCardData?.internalData, data => typeof data === 'object', 'Invalid creditCardData.internalData: must be an object');
    validateOptional(creditCardData?.internalData?.type, isValidString, 'Invalid creditCardData.internalData.type: must be a string');

    this.contentType = CreditCard.contentType;
    this.contentVersion = CreditCard.contentVersion;

    this.content = {
      name: creditCardData.content.name,
      cardHolder: creditCardData.content.cardHolder,
      notes: creditCardData.content.notes ?? null,
      cardNumberMask: creditCardData.content.cardNumberMask ?? null,
      cardIssuer: creditCardData.content.cardIssuer ?? null,
      s_cardNumber: creditCardData.content.s_cardNumber ?? null,
      s_expirationDate: creditCardData.content.s_expirationDate ?? null,
      s_securityCode: creditCardData.content.s_securityCode ?? null
    };

    this.internalData = {
      uiName: 'Credit Card',
      type: creditCardData.internalData?.type || null,
      sifResetTime: creditCardData.internalData?.sifResetTime || null,
      editedCardNumber: creditCardData.internalData?.editedCardNumber,
      editedExpirationDate: creditCardData.internalData?.editedExpirationDate,
      editedSecurityCode: creditCardData.internalData?.editedSecurityCode
    };

    // Secure Input Fields
    this.#s_cardNumber = creditCardData.content.s_cardNumber ?? null;
    this.#s_expirationDate = creditCardData.content.s_expirationDate ?? null;
    this.#s_securityCode = creditCardData.content.s_securityCode ?? null;
    this.#s_cardNumberDecrypted = null;
    this.#s_expirationDateDecrypted = null;
    this.#s_securityCodeDecrypted = null;
  }

  removeSif () {
    // if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET) {
    //   throw new Error('Item is not of Highly Secret security tier');
    // }

    // this.#s_password = null;
  }

  async decryptSif () {
    // return {
    //   password: await super.decryptSif(this.#s_password, this?.internalData?.type)
    // };
  }

  setSif (sifData) {
    // if (!Array.isArray(sifData)) {
    //   throw new Error('Invalid SIF data: must be an array');
    // }

    // sifData.forEach(item => {
    //   if (Object.prototype.hasOwnProperty.call(item, 's_password')) {
    //     this.#s_password = item.s_password;
    //   }
    // });
  }

  setSifDecrypted (decryptedSif) {
    // this.#s_sifDecrypted = decryptedSif;
  }

  removeSifDecrypted () {
    // this.#s_sifDecrypted = null;
  }

  get sifDecrypted () {
    // return this.#s_sifDecrypted;
  }

  get isSifDecrypted () {
    // return this.#s_sifDecrypted !== null;
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: browser.i18n.getMessage('this_tab_more_forget_password'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'forget' });
    }

    // if (this.internalData.normalizedUris && this.internalData.normalizedUris.length > 0) {
    //   dO.push({ value: 'uris:', label: `${browser.i18n.getMessage('this_tab_more_uris')}`, type: 'urisHeader' });

    //   this.internalData.normalizedUris.forEach(uri => {
    //     dO.push({ value: uri.text, label: uri.text, deviceId: this.deviceId, vaultId: this.vaultId, itemId: this.id });
    //   });
    // }

    return dO;
  }

  get contextMenuItem () {
    return {};
  }

  get sifs () {
    return ['s_cardNumber', 's_expirationDate', 's_securityCode'];
  }

  get sifExists () {
    // return this.#s_password && this.#s_password !== '';
  }

  get isT3orT2WithSif () {
    return this.securityType === SECURITY_TIER.SECRET
      || (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists);
  }

  toJSON () {
    return {
      ...super.toJSON(),
      contentType: CreditCard.contentType,
      contentVersion: CreditCard.contentVersion,
      content: {
        ...this.content,
        s_cardNumber: this.#s_cardNumber,
        s_expirationDate: this.#s_expirationDate,
        s_securityCode: this.#s_securityCode
      },
      internalData: {
        uiName: this.internalData.uiName,
        type: this.internalData.type,
        sifResetTime: this.internalData.sifResetTime,
        editedCardNumber: this.internalData.editedCardNumber,
        editedExpirationDate: this.internalData.editedExpirationDate,
        editedSecurityCode: this.internalData.editedSecurityCode
      }
    };
  }
}
