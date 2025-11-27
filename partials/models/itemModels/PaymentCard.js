// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from './Item';
import { v4 as uuidv4 } from 'uuid';

/**
* Class representing a payment card.
* @extends Item
*/
export default class PaymentCard extends Item {
  static contentType = 'paymentCard';
  static contentVersion = 1;

  #s_cardNumber;
  #s_expirationDate;
  #s_securityCode;
  #s_cardNumberDecrypted;
  #s_expirationDateDecrypted;
  #s_securityCodeDecrypted;

  constructor (paymentCardData, deviceId = null, vaultId = null) {
    if (paymentCardData.constructor.name === paymentCardData.name) {
      return paymentCardData;
    }

    super(paymentCardData, deviceId, vaultId);

    validate(paymentCardData.content && typeof paymentCardData.content === 'object', 'Invalid card data');

    validateOptional(paymentCardData?.content?.name, isValidString, 'Invalid paymentCardData.content.name: must be a string');
    validateOptional(paymentCardData?.content?.cardHolder, isValidString, 'Invalid paymentCardData.content.cardHolder: must be a string');

    validateOptional(paymentCardData?.content?.s_cardNumber, isValidBase64, 'Invalid paymentCardData.content.s_cardNumber: must be a base64 string');
    validateOptional(paymentCardData?.content?.s_expirationDate, isValidBase64, 'Invalid paymentCardData.content.s_expirationDate: must be a base64 string');
    validateOptional(paymentCardData?.content?.s_securityCode, isValidBase64, 'Invalid paymentCardData.content.s_securityCode: must be a base64 string');

    validateOptional(paymentCardData?.content?.notes, isValidString, 'Invalid paymentCardData.content.notes: must be a string');

    validateOptional(paymentCardData?.internalData, data => typeof data === 'object', 'Invalid paymentCardData.internalData: must be an object');
    validateOptional(paymentCardData?.internalData?.type, isValidString, 'Invalid paymentCardData.internalData.type: must be a string');

    this.contentType = PaymentCard.contentType;
    this.contentVersion = PaymentCard.contentVersion;

    this.content = {
      name: paymentCardData.content.name,
      cardHolder: paymentCardData.content.cardHolder,
      notes: paymentCardData.content.notes ?? null,
      cardNumberMask: paymentCardData.content.cardNumberMask ?? null,
      cardIssuer: paymentCardData.content.cardIssuer ?? null,
      s_cardNumber: paymentCardData.content.s_cardNumber ?? null,
      s_expirationDate: paymentCardData.content.s_expirationDate ?? null,
      s_securityCode: paymentCardData.content.s_securityCode ?? null
    };

    this.internalData = {
      uiName: 'Payment Card',
      type: paymentCardData.internalData?.type || null,
      sifResetTime: paymentCardData.internalData?.sifResetTime || null,
      editedCardNumber: paymentCardData.internalData?.editedCardNumber,
      editedExpirationDate: paymentCardData.internalData?.editedExpirationDate,
      editedSecurityCode: paymentCardData.internalData?.editedSecurityCode
    };

    // Secure Input Fields
    this.#s_cardNumber = paymentCardData.content.s_cardNumber ?? null;
    this.#s_expirationDate = paymentCardData.content.s_expirationDate ?? null;
    this.#s_securityCode = paymentCardData.content.s_securityCode ?? null;
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
      contentType: PaymentCard.contentType,
      contentVersion: PaymentCard.contentVersion,
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
