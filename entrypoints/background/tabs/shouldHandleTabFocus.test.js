// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, assert } from 'vitest';
import shouldHandleTabFocus from './shouldHandleTabFocus.js';

describe('shouldHandleTabFocus', () => {
  it('handles the first focus event for a tab', () => {
    assert.equal(shouldHandleTabFocus(1, 1000), true);
  });

  it('suppresses duplicate focus events from other frames within the dedupe window', () => {
    assert.equal(shouldHandleTabFocus(2, 1000), true);
    assert.equal(shouldHandleTabFocus(2, 1100), false);
    assert.equal(shouldHandleTabFocus(2, 1400), false);
  });

  it('handles a new focus event once the dedupe window has elapsed', () => {
    assert.equal(shouldHandleTabFocus(3, 1000), true);
    assert.equal(shouldHandleTabFocus(3, 1500), true);
    assert.equal(shouldHandleTabFocus(3, 1600), false);
  });

  it('treats different tabs independently', () => {
    assert.equal(shouldHandleTabFocus(10, 1000), true);
    assert.equal(shouldHandleTabFocus(11, 1000), true);
    assert.equal(shouldHandleTabFocus(10, 1100), false);
    assert.equal(shouldHandleTabFocus(11, 1100), false);
  });

  it('always handles events when the tab id is missing', () => {
    assert.equal(shouldHandleTabFocus(undefined, 1000), true);
    assert.equal(shouldHandleTabFocus(undefined, 1000), true);
  });
});
