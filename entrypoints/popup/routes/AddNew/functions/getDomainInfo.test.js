// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/sendMessageToAllFrames', () => ({ default: vi.fn() }));

import getDomainInfo from './getDomainInfo';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';

const EMPTY_RULES = { minLength: null, maxLength: null, pattern: null };

describe('getDomainInfo', () => {
  beforeEach(() => {
    injectCSIfNotAlready.mockReset();
    sendMessageToAllFrames.mockReset();
  });

  it('returns empty password rules without touching the page when there is no tab', async () => {
    await expect(getDomainInfo(null)).resolves.toEqual(EMPTY_RULES);
    expect(injectCSIfNotAlready).not.toHaveBeenCalled();
    expect(sendMessageToAllFrames).not.toHaveBeenCalled();
  });

  it('reads the password rules from the given tab', async () => {
    injectCSIfNotAlready.mockResolvedValue(true);
    sendMessageToAllFrames.mockResolvedValue([false, { minLength: '8', maxLength: '64', pattern: '[a-z]+' }]);

    await expect(getDomainInfo({ id: 7, url: 'https://example.com/' })).resolves.toEqual({ minLength: '8', maxLength: '64', pattern: '[a-z]+' });
    expect(injectCSIfNotAlready).toHaveBeenCalledWith(7, REQUEST_TARGETS.CONTENT);
    expect(sendMessageToAllFrames).toHaveBeenCalledWith(7, { action: REQUEST_ACTIONS.GET_DOMAIN_INFO, target: REQUEST_TARGETS.CONTENT });
  });

  it('returns empty password rules when the page cannot be messaged', async () => {
    injectCSIfNotAlready.mockResolvedValue(false);
    sendMessageToAllFrames.mockRejectedValue(new Error('No tab'));

    await expect(getDomainInfo({ id: 7, url: 'https://example.com/' })).resolves.toEqual(EMPTY_RULES);
  });
});
