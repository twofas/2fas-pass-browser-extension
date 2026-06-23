// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { AUTOFILL_RESULT_CODES } from './autofillResultCodes.js';

describe('AUTOFILL_RESULT_CODES', () => {
  it('exposes the three autofill protocol codes', () => {
    expect(AUTOFILL_RESULT_CODES).toEqual({
      NO_INPUT_FIELDS: 'noInputFields',
      NO_CREDENTIALS: 'noCredentials',
      CROSS_DOMAIN_DENIED: 'crossDomainDenied'
    });
  });

  it('is frozen so the content↔background protocol cannot be mutated at runtime', () => {
    expect(Object.isFrozen(AUTOFILL_RESULT_CODES)).toBe(true);
  });

  it('uses unique values for every code', () => {
    const values = Object.values(AUTOFILL_RESULT_CODES);
    expect(new Set(values).size).toBe(values.length);
  });
});
