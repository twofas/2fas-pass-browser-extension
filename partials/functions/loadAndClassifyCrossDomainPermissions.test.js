// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import loadAndClassifyCrossDomainPermissions from './loadAndClassifyCrossDomainPermissions.js';

describe('loadAndClassifyCrossDomainPermissions', () => {
  let storageGetItemSpy;

  const mockLists = ({ trusted = null, untrusted = null } = {}) => {
    storageGetItemSpy.mockImplementation(async key => {
      if (key === 'local:crossDomainTrustedDomains') {
        return trusted;
      }

      if (key === 'local:crossDomainUntrustedDomains') {
        return untrusted;
      }

      return null;
    });
  };

  beforeEach(() => {
    storageGetItemSpy = vi.spyOn(storage, 'getItem');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads both stored lists and delegates the classification', async () => {
    mockLists({ trusted: ['good.example'], untrusted: ['bad.example'] });

    const result = await loadAndClassifyCrossDomainPermissions(['good.example', 'bad.example', 'new.example']);

    expect(storageGetItemSpy).toHaveBeenCalledWith('local:crossDomainTrustedDomains');
    expect(storageGetItemSpy).toHaveBeenCalledWith('local:crossDomainUntrustedDomains');
    expect(result.trustedDomains).toEqual(['good.example']);
    expect(result.untrustedDomains).toEqual(['bad.example']);
    expect(result.unknownDomains).toEqual(['new.example']);
    expect(result.crossDomainAllowedDomains).toEqual(['good.example']);
    expect(result.needsDialog).toBe(true);
  });

  it('defaults to empty lists (fail-closed) when storage returns null', async () => {
    mockLists({ trusted: null, untrusted: null });

    const result = await loadAndClassifyCrossDomainPermissions(['new.example']);

    expect(result.unknownDomains).toEqual(['new.example']);
    expect(result.crossDomainAllowedDomains).toEqual([]);
    expect(result.needsDialog).toBe(true);
  });

  it('defaults to empty lists when storage reads throw', async () => {
    storageGetItemSpy.mockRejectedValue(new Error('storage unavailable'));

    const result = await loadAndClassifyCrossDomainPermissions(['new.example']);

    expect(result.unknownDomains).toEqual(['new.example']);
    expect(result.crossDomainAllowedDomains).toEqual([]);
    expect(result.needsDialog).toBe(true);
  });

  it('accepts a Set of hostnames and auto-allows a trusted one', async () => {
    mockLists({ trusted: ['idp.example'], untrusted: [] });

    const result = await loadAndClassifyCrossDomainPermissions(new Set(['idp.example']));

    expect(result.crossDomainAllowedDomains).toEqual(['idp.example']);
    expect(result.allAllowed).toBe(true);
    expect(result.needsDialog).toBe(false);
  });
});
