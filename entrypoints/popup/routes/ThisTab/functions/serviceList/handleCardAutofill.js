// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, sendMessageToTab, tabIsInternal, getLastActiveTab, popupIsInSeparateWindow, closeWindowIfNotInSeparateWindow, generateNonce } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import { PULL_REQUEST_TYPES } from '@/constants';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';

const showT2Toast = () => {
  showToast(browser.i18n.getMessage('this_tab_can_t_autofill_t2'), 'info');
};

const showGenericToast = () => {
  showToast(browser.i18n.getMessage('this_tab_can_t_autofill'), 'info');
};

/**
* Handles the autofill action for PaymentCard items.
* @async
* @param {PaymentCard} item - The PaymentCard item to autofill.
* @param {function} navigate - The navigate function.
* @return {Promise<void>}
*/
const handleCardAutofill = async (item, navigate) => {
  const isHighlySecret = item.securityType === SECURITY_TIER.HIGHLY_SECRET;
  const onTabError = isHighlySecret ? showT2Toast : showGenericToast;

  let tab;

  try {
    tab = await getLastActiveTab(onTabError, t => !tabIsInternal(t));
  } catch (e) {
    await CatchError(e);
  }

  if (!tab) {
    return;
  }

  try {
    await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);
  } catch (e) {
    onTabError();

    if (!e.message.includes('showing error page')) {
      await CatchError(e);
    }

    return;
  }

  const cryptoAvailableRes = await sendMessageToTab(tab.id, {
    action: REQUEST_ACTIONS.GET_CRYPTO_AVAILABLE,
    target: REQUEST_TARGETS.CONTENT
  });

  const hasCardData = item.sifExists;

  // REQUEST_ACTIONS.AUTOFILL_CARD
  // name, cardHolder, cardIssuer
  // s_cardNumber, s_expirationDate, s_securityCode
  // cardIssuer, expirationDateMonth, expirationDateYear can be option in select
  // expirationDateMonth can be MM or M or month as text
  // expirationDateYear can be YY or YYYY
};

export default handleCardAutofill;
