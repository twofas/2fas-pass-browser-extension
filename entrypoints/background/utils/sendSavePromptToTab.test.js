// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/partials/functions/sendMessageToAllFrames', () => ({ default: vi.fn() }));

import sendSavePromptToTab from './sendSavePromptToTab';
import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';

describe('sendSavePromptToTab', () => {
  it('returns true when a frame displayed the prompt', async () => {
    sendMessageToAllFrames.mockResolvedValueOnce([false, { status: 'ok', displayed: true }]);

    expect(await sendSavePromptToTab(1, { type: 'newService' }, 'session:k')).toBe(true);
  });

  it('returns false when the prompt was already visible or no frame answered', async () => {
    sendMessageToAllFrames.mockResolvedValueOnce([{ status: 'omitted' }, false]);
    expect(await sendSavePromptToTab(1, { type: 'newService' }, 'session:k')).toBe(false);

    sendMessageToAllFrames.mockResolvedValueOnce(false);
    expect(await sendSavePromptToTab(1, { type: 'newService' }, 'session:k')).toBe(false);
  });
});
