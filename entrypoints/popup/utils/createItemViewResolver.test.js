// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import createItemViewResolver from './createItemViewResolver';

describe('createItemViewResolver', () => {
  const resolve = createItemViewResolver({ login: 'LoginView', wifi: 'WifiView' });

  it('returns the view of a known content type', () => {
    expect(resolve('login')).toBe('LoginView');
    expect(resolve('wifi')).toBe('WifiView');
  });

  it.each([undefined, null, '', 'unknown', 'toString', '__proto__'])('returns null for %s', contentType => {
    expect(resolve(contentType)).toBeNull();
  });
});
