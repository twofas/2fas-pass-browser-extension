// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, beforeEach } from 'vitest';

import storeAutofillFailureData from './storeAutofillFailureData.js';

const KEY = 'session:autofillT2FailedPending-42';

beforeEach(async () => {
  await storage.removeItem(KEY);
});

describe('storeAutofillFailureData', () => {
  it('writes only the SIF recovery payload to the per-tab session key', async () => {
    await storeAutofillFailureData(42, {
      vaultId: 'v',
      deviceId: 'd',
      itemId: 'i',
      s_password: 'enc',
      encryptionItemT2KeyB64: 'keyB64',
      securityType: SECURITY_TIER.HIGHLY_SECRET,
      windowClose: true
    });

    const stored = JSON.parse(await storage.getItem(KEY));

    expect(stored).toEqual({
      action: 'autofillT2Failed',
      vaultId: 'v',
      deviceId: 'd',
      itemId: 'i',
      s_password: 'enc',
      encryptionItemT2KeyB64: 'keyB64'
    });
  });

  it('keys the entry by the provided tab id', async () => {
    await storeAutofillFailureData(7, { vaultId: 'v' });

    expect(await storage.getItem('session:autofillT2FailedPending-7')).not.toBeNull();
    expect(await storage.getItem('session:autofillT2FailedPending-42')).toBeNull();

    await storage.removeItem('session:autofillT2FailedPending-7');
  });

  it('is a no-op when closeData is missing', async () => {
    await storeAutofillFailureData(42, null);
    expect(await storage.getItem(KEY)).toBeNull();

    await storeAutofillFailureData(42, undefined);
    expect(await storage.getItem(KEY)).toBeNull();
  });
});
