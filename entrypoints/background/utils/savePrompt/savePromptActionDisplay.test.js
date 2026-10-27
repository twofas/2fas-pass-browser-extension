// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { markSavePromptActionDisplayed, releaseIgnoredSavePromptAction, isSavePromptActionExpired, SAVE_PROMPT_REDIRECT_GRACE_MS, SAVE_PROMPT_ACTION_TTL_MS } from './savePromptActionDisplay';

describe('savePromptActionDisplay', () => {
  it('marks only the action of the given tab as displayed', () => {
    const actions = [{ tabId: 1 }, { tabId: 2 }];

    markSavePromptActionDisplayed(2, actions, 1000);

    expect(actions[0].displayedAt).toBeUndefined();
    expect(actions[1].displayedAt).toBe(1000);
  });

  it('removes an action the user had on screen longer than the grace period', () => {
    const actions = [{ tabId: 1, displayedAt: 1000 }];

    expect(releaseIgnoredSavePromptAction(1, actions, 1000 + SAVE_PROMPT_REDIRECT_GRACE_MS + 1)).toBe(true);
    expect(actions).toHaveLength(0);
  });

  it('keeps an action displayed moments ago (redirect right after login)', () => {
    const actions = [{ tabId: 1, displayedAt: 1000 }];

    expect(releaseIgnoredSavePromptAction(1, actions, 1500)).toBe(false);
    expect(actions).toHaveLength(1);
  });

  it('keeps an action that was never displayed', () => {
    const actions = [{ tabId: 1 }];

    expect(releaseIgnoredSavePromptAction(1, actions, 99999)).toBe(false);
    expect(actions).toHaveLength(1);
  });

  it('expires an action older than its time to live', () => {
    expect(isSavePromptActionExpired({ createdAt: 1000 }, 1000 + SAVE_PROMPT_ACTION_TTL_MS + 1)).toBe(true);
    expect(isSavePromptActionExpired({ createdAt: 1000 }, 1000 + SAVE_PROMPT_ACTION_TTL_MS)).toBe(false);
  });

  it('does not expire an action without a creation time', () => {
    expect(isSavePromptActionExpired({}, 99_999_999)).toBe(false);
  });
});
