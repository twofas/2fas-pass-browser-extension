// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from '@/models/itemModels/Item';

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
      ...this.internalData,
      uiName: getMessage('payment_card')
    };

    // Secure Input Fields
    this.#s_cardNumber = paymentCardData.content.s_cardNumber ?? null;
    this.#s_expirationDate = paymentCardData.content.s_expirationDate ?? null;
    this.#s_securityCode = paymentCardData.content.s_securityCode ?? null;
  }

  removeSif () {
    if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET) {
      throw new Error('Item is not of Highly Secret security tier');
    }

    this.#s_cardNumber = null;
    this.#s_expirationDate = null;
    this.#s_securityCode = null;
  }

  async decryptSif () {
    const result = {
      cardNumber: null,
      expirationDate: null,
      securityCode: null
    };

    if (this.#s_cardNumber) {
      result.cardNumber = await super.decryptSif(this.#s_cardNumber, this?.internalData?.type);
    }

    if (this.#s_expirationDate) {
      result.expirationDate = await super.decryptSif(this.#s_expirationDate, this?.internalData?.type);
    }

    if (this.#s_securityCode) {
      result.securityCode = await super.decryptSif(this.#s_securityCode, this?.internalData?.type);
    }

    return result;
  }

  async decryptCardNumber () {
    if (!this.#s_cardNumber) {
      return null;
    }

    return await super.decryptSif(this.#s_cardNumber, this?.internalData?.type);
  }

  async decryptExpirationDate () {
    if (!this.#s_expirationDate) {
      return null;
    }

    return await super.decryptSif(this.#s_expirationDate, this?.internalData?.type);
  }

  async decryptSecurityCode () {
    if (!this.#s_securityCode) {
      return null;
    }

    return await super.decryptSif(this.#s_securityCode, this?.internalData?.type);
  }

  async setSif (sifData) {
    if (!Array.isArray(sifData)) {
      throw new Error('Invalid SIF data: must be an array');
    }

    for (const item of sifData) {
      if (Object.prototype.hasOwnProperty.call(item, 's_cardNumber')) {
        this.#s_cardNumber = await this.encryptSif(item.s_cardNumber, this?.internalData?.type);
      }

      if (Object.prototype.hasOwnProperty.call(item, 's_expirationDate')) {
        this.#s_expirationDate = await this.encryptSif(item.s_expirationDate, this?.internalData?.type);
      }

      if (Object.prototype.hasOwnProperty.call(item, 's_securityCode')) {
        this.#s_securityCode = await this.encryptSif(item.s_securityCode, this?.internalData?.type);
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
      if (Object.prototype.hasOwnProperty.call(item, 's_cardNumber')) {
        this.#s_cardNumber = item.s_cardNumber;
      }

      if (Object.prototype.hasOwnProperty.call(item, 's_expirationDate')) {
        this.#s_expirationDate = item.s_expirationDate;
      }

      if (Object.prototype.hasOwnProperty.call(item, 's_securityCode')) {
        this.#s_securityCode = item.s_securityCode;
      }
    }
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: getMessage('this_tab_more_details'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: getMessage('this_tab_more_forget_payment_card'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'forget' });
    }

    return dO;
  }

  get contextMenuItem () {
    if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET && this.securityType !== SECURITY_TIER.SECRET) {
      return {};
    }

    const contexts = ['page', 'editable', 'frame'];

    if (import.meta.env.BROWSER !== 'safari')  {
      contexts.push('page_action');
    }

    if (
      this.securityType === SECURITY_TIER.SECRET ||
      (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists)
    ) {
      return {
        id: `2fas-pass-autofill-${this.deviceId}|${this.vaultId}|${this.id}`,
        enabled: true,
        title: `${getMessage('autofill')} ${this.content.name}`,
        type: 'normal',
        visible: true,
        parentId: '2fas-pass-payment-cards',
        contexts
      };
    }

    if (
      this.securityType === SECURITY_TIER.HIGHLY_SECRET && !this.sifExists ||
      !this.sifExists
    ) {
      return {
        id: `2fas-pass-fetch-${this.deviceId}|${this.vaultId}|${this.id}|${this.contentType}`,
        enabled: true,
        title: `${getMessage('fetch')} ${this.content.name}...`,
        type: 'normal',
        visible: true,
        parentId: '2fas-pass-payment-cards',
        contexts
      };
    }

    return {};
  }

  get sifs () {
    return ['s_cardNumber', 's_expirationDate', 's_securityCode'];
  }

  get sifExists () {
    return this.cardNumberExists || this.expirationDateExists || this.securityCodeExists;
  }

  get cardNumberExists () {
    return this.#s_cardNumber && this.#s_cardNumber.length > 0;
  }

  get expirationDateExists () {
    return this.#s_expirationDate && this.#s_expirationDate.length > 0;
  }

  get securityCodeExists () {
    return this.#s_securityCode && this.#s_securityCode.length > 0;
  }

  /**
   * Validates a card number using the Luhn algorithm (mod 10 checksum).
   * @param {string} cardNumber - The card number to validate (digits only, no spaces).
   * @return {boolean} True if the card number passes the Luhn check, false otherwise.
   */
  static isValidLuhn (cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return false;
    }

    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length === 0) {
      return false;
    }

    let sum = 0;
    let isSecond = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isSecond) {
        digit *= 2;

        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isSecond = !isSecond;
    }

    return sum % 10 === 0;
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
        ...this.internalData
      }
    };
  }
}
