// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPaymentCardNumberInputs from '@/partials/inputFunctions/getPaymentCardNumberInputs';
import getPaymentCardholderNameInputs from '@/partials/inputFunctions/getPaymentCardholderNameInputs';
import getPaymentCardExpirationDateInputs from '@/partials/inputFunctions/getPaymentCardExpirationDateInputs';
import getPaymentCardSecurityCodeInputs from '@/partials/inputFunctions/getPaymentCardSecurityCodeInputs';
import getPaymentCardIssuerInputs from '@/partials/inputFunctions/getPaymentCardIssuerInputs';
import inputSetValue from './autofillFunctions/inputSetValue';
import {
  PaymentCardIssuerVisa,
  PaymentCardIssuerMasterCard,
  PaymentCardIssuerAmericanExpress,
  PaymentCardIssuerDiscover,
  PaymentCardIssuerJCB,
  PaymentCardIssuerDinersClub,
  PaymentCardIssuerMaestro,
  PaymentCardIssuerUnionPay
} from '@/constants';

const issuerVariations = {
  visa: PaymentCardIssuerVisa,
  mastercard: PaymentCardIssuerMasterCard,
  americanExpress: PaymentCardIssuerAmericanExpress,
  discover: PaymentCardIssuerDiscover,
  jcb: PaymentCardIssuerJCB,
  dinersClub: PaymentCardIssuerDinersClub,
  maestro: PaymentCardIssuerMaestro,
  unionPay: PaymentCardIssuerUnionPay
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
    const valLower = val.toLowerCase();

    for (const option of select.options) {
      const optionValue = option.value.toLowerCase();
      const optionText = option.text.toLowerCase();

      if (optionValue === valLower || optionText === valLower) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        return true;
      }
    }
  }

  for (const val of valuesToTry) {
    const valLower = val.toLowerCase();

    for (const option of select.options) {
      const optionValue = option.value.toLowerCase();
      const optionText = option.text.toLowerCase();

      if (optionValue.includes(valLower) || optionText.includes(valLower)) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        return true;
      }
    }
  }

  return false;
};

const cardAutofillOptions = { respectSkipAttribute: false };

/**
* Splits a full name into given name (first name) and family name (last name).
* @param {string} fullName - The full name string to split.
* @return {{givenName: string, familyName: string}} Object with given and family name parts.
*/
const splitFullName = fullName => {
  if (!fullName || typeof fullName !== 'string') {
    return { givenName: '', familyName: '' };
  }

  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(/\s+/);

  if (nameParts.length === 0) {
    return { givenName: '', familyName: '' };
  }

  if (nameParts.length === 1) {
    return { givenName: nameParts[0], familyName: '' };
  }

  const givenName = nameParts[0];
  const familyName = nameParts.slice(1).join(' ');

  return { givenName, familyName };
};

/**
* Sets cardholder name value for an input based on its type.
* @param {{element: HTMLInputElement, type: string}} inputData - The input data object with element and type.
* @param {string} fullName - The full cardholder name.
* @param {{givenName: string, familyName: string}} splitName - The split name parts.
* @return {void}
*/
const setCardholderNameValue = (inputData, fullName, splitName) => {
  const { element, type } = inputData;

  if (type === 'given') {
    inputSetValue(element, splitName.givenName, cardAutofillOptions);
  } else if (type === 'family') {
    inputSetValue(element, splitName.familyName, cardAutofillOptions);
  } else {
    inputSetValue(element, fullName, cardAutofillOptions);
  }
};

/**
* Sets expiration date value for an input or select element.
* @param {Object} inputData - The input data object with element, type, and isSelect properties.
* @param {Object} parsedDate - The parsed date object.
* @return {{success: boolean, type: string}} Result object indicating success and field type.
*/
const setExpirationDateValue = (inputData, parsedDate) => {
  const { element, type, isSelect } = inputData;
  let success = true;

  if (type === 'month') {
    if (isSelect) {
      const monthName = getMonthName(parsedDate.monthNumeric);
      success = setSelectValue(element, parsedDate.month, [
        String(parsedDate.monthNumeric),
        monthName,
        monthName.substring(0, 3)
      ]);
    } else {
      inputSetValue(element, parsedDate.month, cardAutofillOptions);
    }
  } else if (type === 'year') {
    if (isSelect) {
      success = setSelectValue(element, parsedDate.yearFull, [parsedDate.yearShort]);
    } else {
      const yearValue = element.maxLength === 2 ? parsedDate.yearShort : parsedDate.yearFull;
      inputSetValue(element, yearValue, cardAutofillOptions);
    }
  } else if (type === 'combined') {
    if (isSelect) {
      const combinedValue = `${parsedDate.month}/${parsedDate.yearShort}`;
      success = setSelectValue(element, combinedValue, [
        `${parsedDate.month}/${parsedDate.yearFull}`,
        `${parsedDate.monthNumeric}/${parsedDate.yearShort}`,
        `${parsedDate.monthNumeric}/${parsedDate.yearFull}`
      ]);
    } else {
      let combinedValue;
      const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();
      const expectsFourDigitYear = placeholder.includes('yyyy') || placeholder.includes('mm/yyyy');

      if (element.maxLength === 5) {
        combinedValue = `${parsedDate.month}/${parsedDate.yearShort}`;
      } else if (element.maxLength === 7 || expectsFourDigitYear) {
        combinedValue = `${parsedDate.month}/${parsedDate.yearFull}`;
      } else if (element.maxLength === 4) {
        combinedValue = `${parsedDate.month}${parsedDate.yearShort}`;
      } else {
        combinedValue = `${parsedDate.month}/${parsedDate.yearShort}`;
      }

      inputSetValue(element, combinedValue, cardAutofillOptions);
    }
  }

  return { success, type };
};

/**
* Gets all name variations for a given card issuer.
* @param {string} issuer - The card issuer identifier.
* @return {string[]} Array of name variations for the issuer.
*/
const getIssuerVariations = issuer => {
  if (!issuer) {
    return [];
  }

  const issuerLower = issuer.toLowerCase();

  for (const [key, variations] of Object.entries(issuerVariations)) {
    const keyLower = key.toLowerCase();

    if (issuerLower === keyLower || issuerLower.includes(keyLower)) {
      return [...variations];
    }

    const hasMatch = variations.some(variation => variation.toLowerCase() === issuerLower);

    if (hasMatch) {
      return [...variations];
    }
  }

  return [issuer];
};

/**
* Sets the card issuer value for an input or select element.
* @param {Object} inputData - The input data object with element and isSelect properties.
* @param {string} issuerValue - The card issuer value to set.
* @return {void}
*/
const setCardIssuerValue = (inputData, issuerValue) => {
  const { element, isSelect } = inputData;
  const variations = getIssuerVariations(issuerValue);

  if (isSelect) {
    setSelectValue(element, issuerValue, variations);
  } else {
    inputSetValue(element, issuerValue, cardAutofillOptions);
  }
};

/**
* Checks if expiration date was successfully filled.
* Returns true if combined field was filled OR both month and year were filled.
* @param {Array<{success: boolean, type: string}>} expirationResults - Results from expiration date autofill.
* @return {boolean} True if expiration date is considered filled.
*/
const isExpirationDateFilled = expirationResults => {
  if (!expirationResults || expirationResults.length === 0) {
    return false;
  }

  const combinedResult = expirationResults.find(r => r.type === 'combined');

  if (combinedResult?.success) {
    return true;
  }

  const monthResult = expirationResults.find(r => r.type === 'month');
  const yearResult = expirationResults.find(r => r.type === 'year');

  if (monthResult?.success && yearResult?.success) {
    return true;
  }

  if (monthResult?.success || yearResult?.success) {
    return true;
  }

  return false;
};

/**
* Function to autofill payment card input fields.
* @param {Object} request - The request object containing card data.
* @param {string} [request.cardholderName] - The cardholder name to fill.
* @param {string} [request.cardNumber] - The card number to fill (may be encrypted).
* @param {string} [request.expirationDate] - The expiration date to fill (may be encrypted).
* @param {string} [request.securityCode] - The security code to fill (may be encrypted).
* @param {string} [request.cardIssuer] - The card issuer/type to fill.
* @param {boolean} [request.cryptoAvailable] - Flag indicating encrypted fields need decryption.
* @param {boolean} [request.iframePermissionGranted] - Flag indicating cross-domain permission was granted.
* @return {Promise<{status: string, message?: string, filledFields?: Object}>} The status of the autofill operation.
*/
const autofillCard = async request => {
  const cardNumberInputs = getPaymentCardNumberInputs();
  const cardholderNameInputs = getPaymentCardholderNameInputs();
  const expirationDateInputs = getPaymentCardExpirationDateInputs();
  const securityCodeInputs = getPaymentCardSecurityCodeInputs();
  const cardIssuerInputs = getPaymentCardIssuerInputs();

  const hasCardNumberData = request.cardNumber?.length > 0;
  const hasCardholderNameData = request.cardholderName?.length > 0;
  const hasExpirationDateData = request.expirationDate?.length > 0;
  const hasSecurityCodeData = request.securityCode?.length > 0;
  const hasCardIssuerData = request.cardIssuer?.length > 0;

  const hasCardNumberInput = cardNumberInputs.length > 0;
  const hasCardholderNameInput = cardholderNameInputs.length > 0;
  const hasExpirationDateInput = expirationDateInputs.length > 0;
  const hasSecurityCodeInput = securityCodeInputs.length > 0;
  const hasCardIssuerInput = cardIssuerInputs.length > 0;

  const canFillCardNumber = hasCardNumberData && hasCardNumberInput;
  const canFillCardholderName = hasCardholderNameData && hasCardholderNameInput;
  const canFillExpirationDate = hasExpirationDateData && hasExpirationDateInput;
  const canFillSecurityCode = hasSecurityCodeData && hasSecurityCodeInput;
  const canFillCardIssuer = hasCardIssuerData && hasCardIssuerInput;

  const filledFields = {
    cardNumber: false,
    cardholderName: false,
    expirationDate: false,
    securityCode: false,
    cardIssuer: false
  };

  if (!canFillCardNumber && !canFillCardholderName && !canFillExpirationDate && !canFillSecurityCode && !canFillCardIssuer) {
    return { status: 'error', message: 'No input fields found', filledFields };
  }

  if (!request.iframePermissionGranted) {
    return { status: 'cancelled', message: 'Cross-domain autofill not permitted', filledFields };
  }

  if (canFillCardholderName) {
    const splitName = splitFullName(request.cardholderName);
    cardholderNameInputs.forEach(inputData => setCardholderNameValue(inputData, request.cardholderName, splitName));
    filledFields.cardholderName = true;
  }

  if (canFillCardNumber) {
    let cardNumberValue;

    if (request.cryptoAvailable && request.cardNumberEncrypted) {
      const decryptResult = await decryptValue(request.cardNumber);

      if (decryptResult.status !== 'ok') {
        return { ...decryptResult, filledFields };
      }

      cardNumberValue = decryptResult.data;
    } else {
      cardNumberValue = request.cardNumber;
    }

    const cardNumberWithoutSpaces = cardNumberValue.replace(/\s/g, '');
    cardNumberValue = null;
    cardNumberInputs.forEach(input => inputSetValue(input, cardNumberWithoutSpaces, cardAutofillOptions));
    filledFields.cardNumber = true;
  }

  let expirationResults = [];

  if (canFillExpirationDate) {
    let expirationDateValue;

    if (request.cryptoAvailable && request.expirationDateEncrypted) {
      const decryptResult = await decryptValue(request.expirationDate);

      if (decryptResult.status !== 'ok') {
        return { ...decryptResult, filledFields };
      }

      expirationDateValue = decryptResult.data;
    } else {
      expirationDateValue = request.expirationDate;
    }

    const parsedDate = parseExpirationDate(expirationDateValue);
    expirationDateValue = null;

    expirationResults = expirationDateInputs.map(inputData => setExpirationDateValue(inputData, parsedDate));
    filledFields.expirationDate = isExpirationDateFilled(expirationResults);
  }

  if (canFillSecurityCode) {
    let securityCodeValue;

    if (request.cryptoAvailable && request.securityCodeEncrypted) {
      const decryptResult = await decryptValue(request.securityCode);

      if (decryptResult.status !== 'ok') {
        return { ...decryptResult, filledFields };
      }

      securityCodeValue = decryptResult.data;
    } else {
      securityCodeValue = request.securityCode;
    }

    securityCodeInputs.forEach(input => inputSetValue(input, securityCodeValue, cardAutofillOptions));
    securityCodeValue = null;
    filledFields.securityCode = true;
  }

  if (canFillCardIssuer) {
    cardIssuerInputs.forEach(inputData => setCardIssuerValue(inputData, request.cardIssuer));
    filledFields.cardIssuer = true;
  }

  const failedCriticalFields = [];

  if (hasCardNumberData && !filledFields.cardNumber) {
    failedCriticalFields.push('cardNumber');
  }

  if (hasExpirationDateData && !filledFields.expirationDate) {
    failedCriticalFields.push('expirationDate');
  }

  if (hasSecurityCodeData && !filledFields.securityCode) {
    failedCriticalFields.push('securityCode');
  }

  const anyFieldFilled = filledFields.cardNumber || filledFields.cardholderName ||
                         filledFields.expirationDate || filledFields.securityCode || filledFields.cardIssuer;

  if (failedCriticalFields.length > 0) {
    return {
      status: 'partial',
      message: 'Some critical fields could not be filled',
      failedFields: failedCriticalFields,
      filledFields
    };
  }

  if (anyFieldFilled) {
    return { status: 'ok', filledFields };
  }

  return { status: 'error', message: 'No fields were filled', filledFields };
};

export default autofillCard;
