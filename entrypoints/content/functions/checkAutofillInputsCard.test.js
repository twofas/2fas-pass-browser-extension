// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getShadowRootsMock, numberMock, holderMock, expirationMock, securityCodeMock } = vi.hoisted(() => ({
  getShadowRootsMock: vi.fn(),
  numberMock: vi.fn(),
  holderMock: vi.fn(),
  expirationMock: vi.fn(),
  securityCodeMock: vi.fn()
}));

vi.mock('./autofillFunctions/getShadowRoots', () => ({ default: getShadowRootsMock }));
vi.mock('@/partials/inputFunctions/getPaymentCardNumberInputs', () => ({ default: numberMock }));
vi.mock('@/partials/inputFunctions/getPaymentCardholderNameInputs', () => ({ default: holderMock }));
vi.mock('@/partials/inputFunctions/getPaymentCardExpirationDateInputs', () => ({ default: expirationMock }));
vi.mock('@/partials/inputFunctions/getPaymentCardSecurityCodeInputs', () => ({ default: securityCodeMock }));

import checkAutofillInputsCard from './checkAutofillInputsCard';

describe('checkAutofillInputsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    numberMock.mockReturnValue([]);
    holderMock.mockReturnValue([]);
    expirationMock.mockReturnValue([]);
    securityCodeMock.mockReturnValue([]);
  });

  it('scans the shadow DOM only once for all four card getters', () => {
    getShadowRootsMock.mockReturnValue([]);

    checkAutofillInputsCard();

    expect(getShadowRootsMock).toHaveBeenCalledTimes(1);
  });

  it('shares the same shadow-roots array and label pass with every card getter', () => {
    const sharedRoots = [{ marker: 'shadow-root' }];

    getShadowRootsMock.mockReturnValue(sharedRoots);

    checkAutofillInputsCard();

    const labelPass = numberMock.mock.calls[0][1];

    expect(numberMock).toHaveBeenCalledWith(sharedRoots, expect.objectContaining({ labelledByRoot: expect.any(Map) }));
    expect(holderMock).toHaveBeenCalledWith(sharedRoots);
    expect(expirationMock).toHaveBeenCalledWith(sharedRoots, labelPass);
    expect(securityCodeMock).toHaveBeenCalledWith(sharedRoots, labelPass);
  });
});
