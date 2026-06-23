// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import ignoredTypes from './ignoredTypes.js';

describe('ignoredTypes', () => {
  it('excludes tel, number and search types by default', () => {
    const result = ignoredTypes();

    expect(result).toContain(':not([type="tel"])');
    expect(result).toContain(':not([type="number"])');
    expect(result).toContain(':not([type="search"])');
    expect(result).toContain(':not([type="url"])');
  });

  it('keeps tel and number as candidates for the username path', () => {
    const result = ignoredTypes({ allowUsernameTypes: true });

    expect(result).not.toContain(':not([type="tel"])');
    expect(result).not.toContain(':not([type="number"])');
  });

  it('still excludes search and url on the username path', () => {
    const result = ignoredTypes({ allowUsernameTypes: true });

    expect(result).toContain(':not([type="search"])');
    expect(result).toContain(':not([type="url"])');
  });

  it('keeps the shared non-type exclusions on both variants', () => {
    const defaultTypes = ignoredTypes();
    const usernameTypes = ignoredTypes({ allowUsernameTypes: true });

    [':not([type="hidden"])', ':not([type="submit"])', ':not([disabled])', ':not([readonly])'].forEach(part => {
      expect(defaultTypes).toContain(part);
      expect(usernameTypes).toContain(part);
    });
  });

  it('drops dead non-attribute pseudo selectors that never excluded anything on both variants', () => {
    const defaultTypes = ignoredTypes();
    const usernameTypes = ignoredTypes({ allowUsernameTypes: true });

    [':not(read-only)', ':not(readonly)', ':not(list)', ':not(-moz-read-only)', ':not(disabled)'].forEach(part => {
      expect(defaultTypes).not.toContain(part);
      expect(usernameTypes).not.toContain(part);
    });
  });

  it('never emits a vendor-prefixed selector on either variant', () => {
    expect(ignoredTypes()).not.toContain('-moz-');
    expect(ignoredTypes({ allowUsernameTypes: true })).not.toContain('-moz-');
  });

  it('keeps the attribute-based readonly and disabled exclusions on both variants', () => {
    const defaultTypes = ignoredTypes();
    const usernameTypes = ignoredTypes({ allowUsernameTypes: true });

    [':not([read-only])', ':not([readonly])', ':not([disabled])'].forEach(part => {
      expect(defaultTypes).toContain(part);
      expect(usernameTypes).toContain(part);
    });
  });
});
