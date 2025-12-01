// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Handles the autofill action for PaymentCard items.
* @async
* @param {PaymentCard} item - The PaymentCard item to autofill.
* @param {function} navigate - The navigate function.
* @return {Promise<void>}
*/
const handleCardAutofill = async (item, navigate) => {
  showToast('Payment card autofill is not available yet', 'info');
};

export default handleCardAutofill;
