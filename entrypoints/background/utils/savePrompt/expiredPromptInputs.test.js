// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Values typed long ago must not be matched against a later request, nor kept in memory.

import { describe, it, expect } from 'vitest';
import { isExpiredPromptInput, dropExpiredPromptInputs, PROMPT_INPUT_TTL_MS } from './expiredPromptInputs';

const NOW = 1_800_000_000_000;

describe('expiredPromptInputs', () => {
  it('keeps the inputs for ten minutes', () => {
    expect(PROMPT_INPUT_TTL_MS).toBe(10 * 60 * 1000);
    expect(isExpiredPromptInput({ timestamp: NOW - PROMPT_INPUT_TTL_MS }, NOW)).toBe(false);
    expect(isExpiredPromptInput({ timestamp: NOW - PROMPT_INPUT_TTL_MS - 1 }, NOW)).toBe(true);
  });

  it('does not treat an input without a timestamp as expired', () => {
    expect(isExpiredPromptInput({}, NOW)).toBe(false);
  });

  it('removes only the expired inputs of the tab', () => {
    const tabsInputData = {
      1: { old: { timestamp: NOW - PROMPT_INPUT_TTL_MS - 1 }, fresh: { timestamp: NOW - 1000 } },
      2: { other: { timestamp: NOW - PROMPT_INPUT_TTL_MS - 1 } }
    };

    dropExpiredPromptInputs(tabsInputData, 1, NOW);

    expect(Object.keys(tabsInputData[1])).toEqual(['fresh']);
    expect(Object.keys(tabsInputData[2])).toEqual(['other']);
  });

  it('does nothing for a tab without inputs', () => {
    expect(() => dropExpiredPromptInputs({}, 1, NOW)).not.toThrow();
  });
});
