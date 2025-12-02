// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPaymentCardNumberInputs from '@/partials/inputFunctions/getPaymentCardNumberInputs';
import getPaymentCardholderNameInputs from '@/partials/inputFunctions/getPaymentCardholderNameInputs';
import getPaymentCardExpirationDateInputs from '@/partials/inputFunctions/getPaymentCardExpirationDateInputs';
import getPaymentCardSecurityCodeInputs from '@/partials/inputFunctions/getPaymentCardSecurityCodeInputs';
import inputSetValue from './autofillFunctions/inputSetValue';

/**
* Checks if autofill should proceed when in an iframe.
* @return {Promise<boolean>} True if should proceed, false if cancelled.
*/
const checkIframePermission = async () => {
  if (window.self === window.top) {
    return true;
  }

  let currentFrameDomain;

  try {
    currentFrameDomain = new URL(window.location.href).hostname;
  } catch (e) {
    CatchError(e);
    return true;
  }

  try {
    const topFrameDomain = new URL(window.top.location.href).hostname;

    if (currentFrameDomain === topFrameDomain) {
      return true;
    }

    const message = browser.i18n.getMessage('autofill_cross_domain_warning')
      .replace('CURRENT_DOMAIN', currentFrameDomain)
      .replace('TOP_DOMAIN', topFrameDomain);

    return window.confirm(message);
  } catch {
    const message = browser.i18n.getMessage('autofill_cross_domain_warning_no_access')
      .replace('CURRENT_DOMAIN', currentFrameDomain);

    return window.confirm(message);
  }
};

/**
* Decrypts an encrypted value using the local key.
* @param {string} encryptedValue - The base64 encoded encrypted value.
* @return {Promise<{status: string, data?: string, message?: string}>} Decryption result.
*/
const decryptValue = async encryptedValue => {
  let localKeyResponse;

  try {
    localKeyResponse = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.GET_LOCAL_KEY,
      target: REQUEST_TARGETS.BACKGROUND
    });
  } catch {
    return { status: 'error', message: 'Failed to get local key' };
  }

  if (localKeyResponse?.status !== 'ok') {
    return { status: 'error', message: 'Failed to get local key' };
  }

  let localKeyAB = Base64ToArrayBuffer(localKeyResponse.data);
  let localKeyCrypto;

  try {
    localKeyCrypto = await crypto.subtle.importKey(
      'raw',
      localKeyAB,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
  } catch (e) {
    localKeyAB = null;
    await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillImportKeyError, { event: e }));
    return { status: 'error', message: 'ImportKey error' };
  }

  localKeyAB = null;

  let valueAB = Base64ToArrayBuffer(encryptedValue);
  const decryptedBytes = DecryptBytes(valueAB);
  valueAB = null;

  try {
    const decryptedValueAB = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decryptedBytes.iv },
      localKeyCrypto,
      decryptedBytes.data
    );

    localKeyCrypto = null;
    const decryptedValueString = ArrayBufferToString(decryptedValueAB);

    return { status: 'ok', data: decryptedValueString };
  } catch (e) {
    localKeyCrypto = null;
    await CatchError(new TwoFasError(TwoFasError.internalErrors.contentAutofillDecryptError, { event: e }));
    return { status: 'error', message: 'Decrypt error' };
  }
};

/**
* Parses expiration date string into month and year components.
* @param {string} expirationDate - The expiration date string (e.g., "12/25", "12/2025", "1225").
* @return {{month: string, year: string, monthNumeric: number, yearFull: string, yearShort: string}} Parsed date components.
*/
const parseExpirationDate = expirationDate => {
  if (!expirationDate) {
    return { month: '', year: '', monthNumeric: 0, yearFull: '', yearShort: '' };
  }

  let month = '';
  let year = '';

  if (expirationDate.includes('/')) {
    const parts = expirationDate.split('/');
    month = parts[0];
    year = parts[1];
  } else if (expirationDate.length === 4) {
    month = expirationDate.substring(0, 2);
    year = expirationDate.substring(2, 4);
  } else if (expirationDate.length === 6) {
    month = expirationDate.substring(0, 2);
    year = expirationDate.substring(2, 6);
  }

  const monthNumeric = parseInt(month, 10);
  const yearFull = year.length === 2 ? '20' + year : year;
  const yearShort = year.length === 4 ? year.substring(2, 4) : year;

  return {
    month: month.padStart(2, '0'),
    year,
    monthNumeric,
    yearFull,
    yearShort
  };
};

/**
* Gets month name from month number.
* @param {number} monthNum - The month number (1-12).
* @return {string} The month name in English.
*/
const getMonthName = monthNum => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return months[monthNum - 1] || '';
};

/**
* Sets value for a select element by finding matching option.
* @param {HTMLSelectElement} select - The select element.
* @param {string} value - The value to set.
* @param {string[]} alternateValues - Alternative values to try.
* @return {boolean} True if value was set successfully.
*/
const setSelectValue = (select, value, alternateValues = []) => {
  const valuesToTry = [value, ...alternateValues];

  for (const val of valuesToTry) {
    for (const option of select.options) {
      const optionValue = option.value.toLowerCase();
      const optionText = option.text.toLowerCase();
      const valLower = val.toLowerCase();

      if (optionValue === valLower || optionText === valLower || optionValue.includes(valLower) || optionText.includes(valLower)) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        return true;
      }
    }
  }

  return false;
};

/**
* Sets expiration date value for an input or select element.
* @param {Object} inputData - The input data object with element, type, and isSelect properties.
* @param {Object} parsedDate - The parsed date object.
* @return {void}
*/
const setExpirationDateValue = (inputData, parsedDate) => {
  const { element, type, isSelect } = inputData;

  if (type === 'month') {
    if (isSelect) {
      const monthName = getMonthName(parsedDate.monthNumeric);
      setSelectValue(element, parsedDate.month, [
        String(parsedDate.monthNumeric),
        monthName,
        monthName.substring(0, 3)
      ]);
    } else {
      inputSetValue(element, parsedDate.month);
    }
  } else if (type === 'year') {
    if (isSelect) {
      setSelectValue(element, parsedDate.yearFull, [parsedDate.yearShort]);
    } else {
      const yearValue = element.maxLength === 2 ? parsedDate.yearShort : parsedDate.yearFull;
      inputSetValue(element, yearValue);
    }
  } else if (type === 'combined') {
    if (isSelect) {
      const combinedValue = `${parsedDate.month}/${parsedDate.yearShort}`;
      setSelectValue(element, combinedValue, [
        `${parsedDate.month}/${parsedDate.yearFull}`,
        `${parsedDate.monthNumeric}/${parsedDate.yearShort}`,
        `${parsedDate.monthNumeric}/${parsedDate.yearFull}`
      ]);
    } else {
      let combinedValue;

      if (element.maxLength === 5) {
        combinedValue = `${parsedDate.month}/${parsedDate.yearShort}`;
      } else if (element.maxLength === 7) {
        combinedValue = `${parsedDate.month}/${parsedDate.yearFull}`;
      } else if (element.maxLength === 4) {
        combinedValue = `${parsedDate.month}${parsedDate.yearShort}`;
      } else {
        combinedValue = `${parsedDate.month}/${parsedDate.yearShort}`;
      }

      inputSetValue(element, combinedValue);
    }
  }
};

/**
* Function to autofill payment card input fields.
* @param {Object} request - The request object containing card data.
* @param {string} [request.cardholderName] - The cardholder name to fill.
* @param {string} [request.cardNumber] - The card number to fill (may be encrypted).
* @param {string} [request.expirationDate] - The expiration date to fill (may be encrypted).
* @param {string} [request.securityCode] - The security code to fill (may be encrypted).
* @param {boolean} [request.cryptoAvailable] - Flag indicating encrypted fields need decryption.
* @return {Promise<{status: string, message?: string}>} The status of the autofill operation.
*/
const autofillCard = async request => {
  const cardNumberInputs = getPaymentCardNumberInputs();
  const cardholderNameInputs = getPaymentCardholderNameInputs();
  const expirationDateInputs = getPaymentCardExpirationDateInputs();
  const securityCodeInputs = getPaymentCardSecurityCodeInputs();

  const hasCardNumberData = request.cardNumber?.length > 0;
  const hasCardholderNameData = request.cardholderName?.length > 0;
  const hasExpirationDateData = request.expirationDate?.length > 0;
  const hasSecurityCodeData = request.securityCode?.length > 0;

  const hasCardNumberInput = cardNumberInputs.length > 0;
  const hasCardholderNameInput = cardholderNameInputs.length > 0;
  const hasExpirationDateInput = expirationDateInputs.length > 0;
  const hasSecurityCodeInput = securityCodeInputs.length > 0;

  const canFillCardNumber = hasCardNumberData && hasCardNumberInput;
  const canFillCardholderName = hasCardholderNameData && hasCardholderNameInput;
  const canFillExpirationDate = hasExpirationDateData && hasExpirationDateInput;
  const canFillSecurityCode = hasSecurityCodeData && hasSecurityCodeInput;

  if (!canFillCardNumber && !canFillCardholderName && !canFillExpirationDate && !canFillSecurityCode) {
    return { status: 'error', message: 'No input fields found' };
  }

  const userAllowed = await checkIframePermission();

  if (!userAllowed) {
    return { status: 'cancelled', message: 'User cancelled cross-domain autofill' };
  }

  if (canFillCardholderName) {
    cardholderNameInputs.forEach(input => inputSetValue(input, request.cardholderName));
  }

  if (canFillCardNumber) {
    let cardNumberValue;

    if (request.cryptoAvailable && request.cardNumberEncrypted) {
      const decryptResult = await decryptValue(request.cardNumber);

      if (decryptResult.status !== 'ok') {
        return decryptResult;
      }

      cardNumberValue = decryptResult.data;
    } else {
      cardNumberValue = request.cardNumber;
    }

    cardNumberInputs.forEach(input => inputSetValue(input, cardNumberValue));
    cardNumberValue = null;
  }

  if (canFillExpirationDate) {
    let expirationDateValue;

    if (request.cryptoAvailable && request.expirationDateEncrypted) {
      const decryptResult = await decryptValue(request.expirationDate);

      if (decryptResult.status !== 'ok') {
        return decryptResult;
      }

      expirationDateValue = decryptResult.data;
    } else {
      expirationDateValue = request.expirationDate;
    }

    const parsedDate = parseExpirationDate(expirationDateValue);
    expirationDateValue = null;

    expirationDateInputs.forEach(inputData => setExpirationDateValue(inputData, parsedDate));
  }

  if (canFillSecurityCode) {
    let securityCodeValue;

    if (request.cryptoAvailable && request.securityCodeEncrypted) {
      const decryptResult = await decryptValue(request.securityCode);

      if (decryptResult.status !== 'ok') {
        return decryptResult;
      }

      securityCodeValue = decryptResult.data;
    } else {
      securityCodeValue = request.securityCode;
    }

    securityCodeInputs.forEach(input => inputSetValue(input, securityCodeValue));
    securityCodeValue = null;
  }

  return { status: 'ok' };
};

export default autofillCard;
