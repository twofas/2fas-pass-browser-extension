// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// "Add" and "Update" on the save prompt silence it in the tab only while their request to the phone runs: once the
// user cancels it (or it fails), the next submit of the form shows the prompt again.

import { describe, it, expect } from 'vitest';
import { createSaveRequestSuppression, isTabSavePromptSuppressed, SAVE_REQUEST_START_GRACE_MS } from './tabSavePromptSuppression';

const NOW = 1_800_000_000_000;

describe('tabSavePromptSuppression', () => {
  it('keeps the hard suppression (do not ask)', () => {
    expect(isTabSavePromptSuppressed(true, { active: false }, NOW)).toBe(true);
  });

  it('silences the prompt while the save request runs', () => {
    expect(isTabSavePromptSuppressed(createSaveRequestSuppression(NOW - 60000), { active: true, startedAt: NOW - 59000 }, NOW)).toBe(true);
  });

  it('silences the prompt right after the choice, before the request has started', () => {
    expect(isTabSavePromptSuppressed(createSaveRequestSuppression(NOW - 1000), { active: false }, NOW)).toBe(true);
  });

  it('shows the prompt again once the request is no longer running', () => {
    expect(isTabSavePromptSuppressed(createSaveRequestSuppression(NOW - SAVE_REQUEST_START_GRACE_MS - 1), { active: false }, NOW)).toBe(false);
  });

  it('does not silence the prompt without a suppression', () => {
    expect(isTabSavePromptSuppressed(null, { active: true }, NOW)).toBe(false);
    expect(isTabSavePromptSuppressed(undefined, { active: false }, NOW)).toBe(false);
  });

  it('shows the prompt again right away when the request started and was cancelled within seconds', () => {
    expect(isTabSavePromptSuppressed(createSaveRequestSuppression(NOW - 3000), { active: false, startedAt: NOW - 2500 }, NOW)).toBe(false);
  });

  it('ignores a request that started before the choice', () => {
    expect(isTabSavePromptSuppressed(createSaveRequestSuppression(NOW - 3000), { active: false, startedAt: NOW - 60000 }, NOW)).toBe(true);
  });
});

