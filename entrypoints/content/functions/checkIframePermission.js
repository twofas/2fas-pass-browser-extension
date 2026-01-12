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
* Checks if this frame has autofillable inputs based on the autofill type.
* @param {string} autofillType - The type of autofill ('card' or 'login').
* @return {boolean} True if this frame has relevant inputs.
*/
const hasAutofillableInputs = autofillType => {
  if (autofillType === 'card') {
    const cardNumberInputs = getPaymentCardNumberInputs();
    const cardholderNameInputs = getPaymentCardholderNameInputs();
    const expirationDateInputs = getPaymentCardExpirationDateInputs();
    const securityCodeInputs = getPaymentCardSecurityCodeInputs();

    return cardNumberInputs.length > 0 ||
      cardholderNameInputs.length > 0 ||
      expirationDateInputs.length > 0 ||
      securityCodeInputs.length > 0;
  }

  if (autofillType === 'login') {
    const passwordInputs = getPasswordInputs();
    const passwordForms = passwordInputs
      .map(input => input.closest('form'))
      .filter(Boolean);
    const usernameInputs = getUsernameInputs(passwordForms);

    return passwordInputs.length > 0 || usernameInputs.length > 0;
  }

  return false;
};

/**
* Checks if autofill should proceed when in a cross-domain iframe.
* Returns frame info and whether permission is needed.
* Only returns needsPermission: true if the frame is cross-domain AND has autofillable inputs.
* Does NOT show confirm dialog - that should be handled by the caller.
* @param {string} autofillType - The type of autofill ('card' or 'login').
* @return {Promise<{needsPermission: boolean, frameInfo: Object}>}
*/
const checkIframePermission = async autofillType => {
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

  const hasInputs = hasAutofillableInputs(autofillType);

  if (!hasInputs) {
    return { needsPermission: false, frameInfo };
  }

  return { needsPermission: true, frameInfo };
};

export default checkIframePermission;
