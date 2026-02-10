// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import getPaymentCardNumberInputs from '@/partials/inputFunctions/getPaymentCardNumberInputs';
import getPaymentCardholderNameInputs from '@/partials/inputFunctions/getPaymentCardholderNameInputs';
import getPaymentCardExpirationDateInputs from '@/partials/inputFunctions/getPaymentCardExpirationDateInputs';
import getPaymentCardSecurityCodeInputs from '@/partials/inputFunctions/getPaymentCardSecurityCodeInputs';

/**
* Checks if this frame has autofillable inputs that match the available data.
* @param {string} autofillType - The type of autofill ('card' or 'login').
* @param {Object} [dataFields] - Flags indicating which data fields are available.
* @return {boolean} True if this frame has relevant inputs for available data.
*/
const hasAutofillableInputs = (autofillType, dataFields = {}) => {
  if (autofillType === 'card') {
    const { hasCardholderName = true, hasCardNumber = true, hasExpirationDate = true, hasSecurityCode = true } = dataFields;

    return (hasCardNumber && getPaymentCardNumberInputs().length > 0) ||
      (hasCardholderName && getPaymentCardholderNameInputs().length > 0) ||
      (hasExpirationDate && getPaymentCardExpirationDateInputs().length > 0) ||
      (hasSecurityCode && getPaymentCardSecurityCodeInputs().length > 0);
  }

  if (autofillType === 'login') {
    const { hasUsername = true, hasPassword = true } = dataFields;
    const passwordInputs = getPasswordInputs();
    const passwordForms = passwordInputs
      .map(input => input.closest('form'))
      .filter(Boolean);
    const usernameInputs = getUsernameInputs(passwordForms);

    return (hasPassword && passwordInputs.length > 0) ||
      (hasUsername && usernameInputs.length > 0);
  }

  return false;
};

/**
* Checks if autofill should proceed when in a cross-domain iframe.
* Returns frame info and whether permission is needed.
* Only returns needsPermission: true if the frame is cross-domain AND has autofillable inputs.
* Does NOT show confirm dialog - that should be handled by the caller.
* @param {string} autofillType - The type of autofill ('card' or 'login').
* @param {Object} [dataFields] - Flags indicating which data fields are available.
* @return {Promise<{needsPermission: boolean, frameInfo: Object}>}
*/
const checkIframePermission = async (autofillType, dataFields) => {
  const frameInfo = {
    isTopFrame: window.self === window.top,
    hostname: '',
    topHostname: ''
  };

  try {
    frameInfo.hostname = new URL(window.location.href).hostname;
  } catch {
    return { needsPermission: false, frameInfo };
  }

  if (window.self === window.top) {
    return { needsPermission: false, frameInfo };
  }

  let isCrossDomain = false;

  try {
    const topFrameDomain = new URL(window.top.location.href).hostname;
    frameInfo.topHostname = topFrameDomain;

    if (frameInfo.hostname !== topFrameDomain) {
      isCrossDomain = true;
    }
  } catch {
    isCrossDomain = true;
  }

  if (!isCrossDomain) {
    return { needsPermission: false, frameInfo };
  }

  const hasInputs = hasAutofillableInputs(autofillType, dataFields);

  if (!hasInputs) {
    return { needsPermission: false, frameInfo };
  }

  return { needsPermission: true, frameInfo };
};

export default checkIframePermission;
