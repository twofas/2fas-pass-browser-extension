// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import removeSavePromptAction from './removeSavePromptAction';

describe('removeSavePromptAction', () => {
  it('removes the action of the tab even when the page url changed after the request', () => {
    const actions = [{ tabId: 3, url: 'https://example.com/login' }, { tabId: 4, url: 'https://other.com' }];

    removeSavePromptAction(3, actions);

    expect(actions).toEqual([{ tabId: 4, url: 'https://other.com' }]);
  });
});
