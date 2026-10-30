// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// "Add" silences the prompt in the tab only while the request to the phone runs; "Ignore this domain" for good.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../openPopupWindowInNewWindow', () => ({ default: vi.fn(async () => {}) }));
vi.mock('@/partials/functions', () => ({ getCurrentDevice: vi.fn(async () => ({ id: 'device-1' })) }));

import processSavePromptResult from './processSavePromptResult';

const TAB_ID = 31;
const STORAGE_KEY = 'session:savePromptContext-31';

describe('processSavePromptResult — tab suppression', () => {
  beforeEach(async () => {
    await storage.removeItem(`session:savePromptSuppressed-${TAB_ID}`);
    await storage.setItem(STORAGE_KEY, JSON.stringify({
      tabId: TAB_ID,
      url: 'https://example.com/login',
      tabUrl: 'https://example.com/login',
      values: { username: 'jan', password: 'S3cret!' }
    }));
  });

  it('silences the prompt for the save request after "Add"', async () => {
    await processSavePromptResult({ storageKey: STORAGE_KEY, status: 'newLogin' }, [], {}, {});

    expect(await storage.getItem(`session:savePromptSuppressed-${TAB_ID}`)).toMatchObject({ type: 'saveRequest', at: expect.any(Number) });
  });

  it('silences the prompt for good after "Ignore this domain"', async () => {
    await processSavePromptResult({ storageKey: STORAGE_KEY, status: 'doNotAsk' }, [], {}, {});

    expect(await storage.getItem(`session:savePromptSuppressed-${TAB_ID}`)).toBe(true);
  });
});
