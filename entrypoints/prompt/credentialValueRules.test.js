// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { isHiddenPasswordValue, isProbablyNotUsername } from './credentialValueRules';

describe('isHiddenPasswordValue', () => {
  it.each(['••', '********', '●●●●●●', '------', '......'])('treats "%s" as a masked value', value => {
    expect(isHiddenPasswordValue(value)).toBe(true);
  });

  it.each(['', '*', 'aaaaaa', '111111', '______', '*-*-', 'pa$$w0rd', '••••a'])('does not treat "%s" as a masked value', value => {
    expect(isHiddenPasswordValue(value)).toBe(false);
  });
});

describe('isProbablyNotUsername', () => {
  it.each(['', '1', '42'])('treats "%s" as not a username', value => {
    expect(isProbablyNotUsername(value)).toBe(true);
  });

  it.each(['123', 'a', 'ab', '4a', 'jan@example.com'])('treats "%s" as a possible username', value => {
    expect(isProbablyNotUsername(value)).toBe(false);
  });
});
