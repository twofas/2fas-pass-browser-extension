// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPaymentCardNumberInputs from '@/partials/inputFunctions/getPaymentCardNumberInputs';
import getPaymentCardholderNameInputs from '@/partials/inputFunctions/getPaymentCardholderNameInputs';
import getPaymentCardExpirationDateInputs from '@/partials/inputFunctions/getPaymentCardExpirationDateInputs';
import getPaymentCardSecurityCodeInputs from '@/partials/inputFunctions/getPaymentCardSecurityCodeInputs';
import getShadowRoots from './autofillFunctions/getShadowRoots';

/**
* Function to check and set autofill inputs for payment cards.
* @return {Object} Autofill capability status for payment card fields.
*/
const checkAutofillInputsCard = () => {
  const shadowRoots = getShadowRoots();
  const cardNumberInputs = getPaymentCardNumberInputs(shadowRoots);
  const cardholderNameInputs = getPaymentCardholderNameInputs(shadowRoots);
  const expirationDateInputs = getPaymentCardExpirationDateInputs(shadowRoots);
  const securityCodeInputs = getPaymentCardSecurityCodeInputs(shadowRoots);

  const hasMonthInput = expirationDateInputs.some(item => item.type === 'month');
  const hasYearInput = expirationDateInputs.some(item => item.type === 'year');
  const hasCombinedInput = expirationDateInputs.some(item => item.type === 'combined');

  const canAutofillCardNumber = cardNumberInputs.length > 0;
  const canAutofillExpirationDate = expirationDateInputs.length > 0;
  const canAutofillSecurityCode = securityCodeInputs.length > 0;

  const canAutofillCriticalFields = canAutofillCardNumber && canAutofillExpirationDate && canAutofillSecurityCode;

  const result = {
    canAutofillCardNumber,
    canAutofillCardholderName: cardholderNameInputs.length > 0,
    canAutofillExpirationDate,
    canAutofillSecurityCode,
    canAutofillCriticalFields,
    expirationDateFormat: {
      hasMonthInput,
      hasYearInput,
      hasCombinedInput,
      hasSeparateInputs: hasMonthInput && hasYearInput
    }
  };

  return result;
};

export default checkAutofillInputsCard;
