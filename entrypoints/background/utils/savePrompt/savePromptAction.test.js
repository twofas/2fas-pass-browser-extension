// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../sendSavePromptToTab', () => ({ default: vi.fn(async () => true) }));
vi.mock('@/partials/contentScript/injectCSIfNotAlready', () => ({ default: vi.fn(async () => {}) }));

import savePromptAction from './savePromptAction';
import sendSavePromptToTab from '../sendSavePromptToTab';

describe('savePromptAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: 9, status: 'complete', url: 'https://example.com/login' });
    browser.tabs.getCurrent = vi.fn(async () => undefined);
  });

  it('marks the queued action as displayed when the page showed the prompt', async () => {
    const actions = [{ tabId: 9, url: 'https://example.com' }];

    await savePromptAction({ tabId: 9, initiator: 'https://example.com' }, { type: 'newService' }, {}, { username: 'u', password: 'p' }, actions);

    expect(typeof actions[0].displayedAt).toBe('number');
  });

  it('does not mark the action when no frame showed the prompt', async () => {
    sendSavePromptToTab.mockResolvedValueOnce(false);
    const actions = [{ tabId: 9, url: 'https://example.com' }];

    await savePromptAction({ tabId: 9, initiator: 'https://example.com' }, { type: 'newService' }, {}, { username: 'u', password: 'p' }, actions);

    expect(actions[0].displayedAt).toBeUndefined();
  });
});
