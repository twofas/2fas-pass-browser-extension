// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// The save prompt starts its entry transition on the next frame after it is added to the page, not after a delay.

import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/utils/getMessage.js', () => ({
  getMessage: key => key,
  initI18n: vi.fn(),
  resetI18nCache: vi.fn(),
  getI18nState: () => ({ lang: 'en', messages: {}, isInitialized: true })
}));

import savePrompt from './savePrompt';

describe('savePrompt — showing', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('makes the prompt visible on the next frames, without waiting', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const sendResponse = vi.fn();

    savePrompt({ storageKey: 'session:savePromptContext-1', serviceTypeData: { type: 'newService' }, theme: 'light' }, sendResponse, container);

    const item = container.querySelector('.twofas-pass-save-prompt');

    expect(sendResponse).toHaveBeenCalledWith({ status: 'ok', displayed: true });
    expect(item.classList.contains('twofas-pass-visible')).toBe(false);

    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    expect(item.classList.contains('twofas-pass-visible')).toBe(true);
  });
});
