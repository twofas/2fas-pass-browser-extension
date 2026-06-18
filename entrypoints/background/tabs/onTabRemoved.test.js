// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/partials/sessionStorage/getKey', () => ({
  default: vi.fn(async () => 'popupState')
}));

import onTabRemoved from './onTabRemoved.js';

describe('onTabRemoved — cross-domain autofill storage cleanup (finding #1 / #5)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await storage.removeItem('session:autofillData-42');
    await storage.removeItem('session:autofillCardData-42');
    await storage.removeItem('session:autofillT2FailedPending-42');
  });

  it('removes the pending login autofill data so encrypted credentials do not outlive the tab', async () => {
    await storage.setItem('session:autofillData-42', JSON.stringify({ actionData: { password: 'enc' } }));

    await onTabRemoved(42, {}, []);

    expect(await storage.getItem('session:autofillData-42')).toBeNull();
  });

  it('removes the pending card autofill data so encrypted card data does not outlive the tab', async () => {
    await storage.setItem('session:autofillCardData-42', JSON.stringify({ actionData: { cardNumber: 'enc' } }));

    await onTabRemoved(42, {}, []);

    expect(await storage.getItem('session:autofillCardData-42')).toBeNull();
  });

  it('removes the pending T2 autofill-failure data so decrypted recovery material does not outlive the tab', async () => {
    await storage.setItem('session:autofillT2FailedPending-42', JSON.stringify({ action: 'autofillT2Failed', s_password: 'enc' }));

    await onTabRemoved(42, {}, []);

    expect(await storage.getItem('session:autofillT2FailedPending-42')).toBeNull();
  });

  it('only clears the closed tab, leaving other tabs untouched', async () => {
    await storage.setItem('session:autofillData-99', JSON.stringify({ actionData: {} }));

    await onTabRemoved(42, {}, []);

    expect(await storage.getItem('session:autofillData-99')).not.toBeNull();
    await storage.removeItem('session:autofillData-99');
  });
});
