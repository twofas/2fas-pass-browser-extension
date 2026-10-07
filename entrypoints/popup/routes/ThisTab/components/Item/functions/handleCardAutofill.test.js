// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// summitracing.com: a frame that filled the card number but found no expiry/CVV input answers
// { status: 'ok', missingInputFields: [...] }. The popup must report that as a partial autofill
// (like the background path via aggregateCardAutofillResponses) instead of closing silently,
// while a field missing in one frame but filled by another frame is still a full success.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMessageToAllFrames = vi.fn();
const popupIsInSeparateWindow = vi.fn();
const closeWindowIfNotInSeparateWindow = vi.fn();
const encryptCardSifForTransmission = vi.fn();
const resolveCrossDomainPermissions = vi.fn();
const injectCSIfNotAlready = vi.fn();
const protectCardActionData = vi.fn();
const acquireAutofillTab = vi.fn();
const showT2Toast = vi.fn();
const showGenericToast = vi.fn();
const showToastMock = vi.fn();

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/utils/showToast.js', () => ({ default: (...args) => showToastMock(...args) }));
vi.mock('@/utils/getMessage.js', () => ({
  getMessage: key => key,
  initI18n: vi.fn(),
  resetI18nCache: vi.fn(),
  getI18nState: vi.fn()
}));

vi.mock('@/partials/functions', async () => {
  const { default: aggregateCardAutofillResponses } = await vi.importActual('@/partials/functions/aggregateCardAutofillResponses.js');

  return {
    sendMessageToAllFrames: (...args) => sendMessageToAllFrames(...args),
    popupIsInSeparateWindow: (...args) => popupIsInSeparateWindow(...args),
    closeWindowIfNotInSeparateWindow: (...args) => closeWindowIfNotInSeparateWindow(...args),
    encryptCardSifForTransmission: (...args) => encryptCardSifForTransmission(...args),
    resolveCrossDomainPermissions: (...args) => resolveCrossDomainPermissions(...args),
    aggregateCardAutofillResponses
  };
});

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({
  default: (...args) => injectCSIfNotAlready(...args)
}));

vi.mock('@/entrypoints/background/utils/protectCardActionData', () => ({
  default: (...args) => protectCardActionData(...args)
}));

vi.mock('./autofillPopupShared', () => ({
  acquireAutofillTab: (...args) => acquireAutofillTab(...args),
  showT2Toast: (...args) => showT2Toast(...args),
  showGenericToast: (...args) => showGenericToast(...args)
}));

vi.mock('@/models/itemModels/PaymentCard', () => ({
  default: { contentType: 'paymentCard' }
}));

import { AUTOFILL_RESULT_CODES } from '@/constants';
import handleCardAutofill from './handleCardAutofill.js';

const navigate = vi.fn();

const buildSecretCard = () => ({
  id: 'c1',
  deviceId: 'd1',
  vaultId: 'v1',
  securityType: 2, // SECRET
  sifExists: true,
  content: { cardHolder: 'Jan Kowalski', cardIssuer: 'AmericanExpress' }
});

const filled = fields => ({
  cardNumber: false,
  cardholderName: false,
  expirationDate: false,
  securityCode: false,
  cardIssuer: false,
  ...fields
});

const respondToAutofillWith = frameResponses => {
  sendMessageToAllFrames.mockImplementation(async (tabId, message) => {
    if (message?.action === REQUEST_ACTIONS.AUTOFILL_CARD) {
      return frameResponses;
    }

    return [];
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  acquireAutofillTab.mockResolvedValue({
    tab: { id: 1 },
    cryptoAvailableRes: { status: 'ok', cryptoAvailable: true }
  });
  encryptCardSifForTransmission.mockResolvedValue({
    status: 'ok',
    cardNumber: 'enc-number',
    expirationDate: 'enc-expiry',
    securityCode: 'enc-csc'
  });
  resolveCrossDomainPermissions.mockResolvedValue({ needsDialog: false, allBlocked: false, crossDomainAllowedDomains: [] });
  injectCSIfNotAlready.mockResolvedValue(true);
  popupIsInSeparateWindow.mockResolvedValue(false);
  closeWindowIfNotInSeparateWindow.mockResolvedValue(undefined);
});

describe('handleCardAutofill — result reporting', () => {
  it('reports a partial autofill when the only frame filled the number but had no expiry/CVV inputs', async () => {
    respondToAutofillWith([
      {
        status: 'ok',
        filledFields: filled({ cardNumber: true }),
        missingInputFields: ['expirationDate', 'securityCode']
      }
    ]);

    await handleCardAutofill(buildSecretCard(), navigate);

    expect(showToastMock).toHaveBeenCalledWith('notification_card_autofill_partial_message', 'info');
    expect(closeWindowIfNotInSeparateWindow).not.toHaveBeenCalled();
  });

  it('treats a field missing in one frame but filled by another frame as a full success', async () => {
    respondToAutofillWith([
      {
        status: 'ok',
        filledFields: filled({ cardNumber: true, expirationDate: true }),
        missingInputFields: ['securityCode']
      },
      {
        status: 'ok',
        filledFields: filled({ securityCode: true }),
        missingInputFields: ['cardNumber', 'expirationDate']
      }
    ]);

    await handleCardAutofill(buildSecretCard(), navigate);

    expect(showToastMock).not.toHaveBeenCalledWith('notification_card_autofill_partial_message', 'info');
    expect(closeWindowIfNotInSeparateWindow).toHaveBeenCalled();
  });

  it('still reports a partial autofill when a frame failed to fill a critical field', async () => {
    respondToAutofillWith([
      {
        status: 'partial',
        failedFields: ['expirationDate'],
        filledFields: filled({ cardNumber: true, securityCode: true }),
        missingInputFields: []
      }
    ]);

    await handleCardAutofill(buildSecretCard(), navigate);

    expect(showToastMock).toHaveBeenCalledWith('notification_card_autofill_partial_message', 'info');
    expect(closeWindowIfNotInSeparateWindow).not.toHaveBeenCalled();
  });

  it('closes the popup when every field was filled', async () => {
    respondToAutofillWith([
      {
        status: 'ok',
        filledFields: filled({ cardNumber: true, expirationDate: true, securityCode: true }),
        missingInputFields: []
      }
    ]);

    await handleCardAutofill(buildSecretCard(), navigate);

    expect(closeWindowIfNotInSeparateWindow).toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
  });

  it('reports missing inputs when no frame had any card input', async () => {
    respondToAutofillWith([
      { status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS, filledFields: filled({}) }
    ]);

    await handleCardAutofill(buildSecretCard(), navigate);

    expect(showToastMock).toHaveBeenCalledWith('this_tab_can_t_find_inputs', 'info');
  });
});
