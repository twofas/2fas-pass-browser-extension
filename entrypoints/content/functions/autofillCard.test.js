// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { isExpirationDateFilled } from './autofillCard';

describe('isExpirationDateFilled', () => {
  it('returns false when there are no expiration results', () => {
    expect(isExpirationDateFilled([])).toBe(false);
    expect(isExpirationDateFilled(undefined)).toBe(false);
  });

  it('returns true when the combined field was filled', () => {
    expect(isExpirationDateFilled([{ type: 'combined', success: true }])).toBe(true);
  });

  it('returns true when both month and year fields were filled', () => {
    expect(isExpirationDateFilled([
      { type: 'month', success: true },
      { type: 'year', success: true }
    ])).toBe(true);
  });

  it('returns true when only a month field is present on the page and it was filled', () => {
    expect(isExpirationDateFilled([{ type: 'month', success: true }])).toBe(true);
  });

  it('returns true when only a year field is present on the page and it was filled', () => {
    expect(isExpirationDateFilled([{ type: 'year', success: true }])).toBe(true);
  });

  it('returns false when the month was filled but the present year field failed', () => {
    expect(isExpirationDateFilled([
      { type: 'month', success: true },
      { type: 'year', success: false }
    ])).toBe(false);
  });

  it('returns false when the year was filled but the present month field failed', () => {
    expect(isExpirationDateFilled([
      { type: 'month', success: false },
      { type: 'year', success: true }
    ])).toBe(false);
  });

  it('returns false when both present month and year fields failed', () => {
    expect(isExpirationDateFilled([
      { type: 'month', success: false },
      { type: 'year', success: false }
    ])).toBe(false);
  });

  it('returns false when only a failed combined field is present and no month/year fields exist', () => {
    expect(isExpirationDateFilled([{ type: 'combined', success: false }])).toBe(false);
  });

  it('returns false when the only present month field failed', () => {
    expect(isExpirationDateFilled([{ type: 'month', success: false }])).toBe(false);
  });
});
