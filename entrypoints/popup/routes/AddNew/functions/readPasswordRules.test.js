// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, afterEach } from 'vitest';
import readPasswordRules from './readPasswordRules';

const EMPTY_RULES = { minLength: null, maxLength: null, pattern: null };

describe('readPasswordRules', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns empty rules when the page has no password field', () => {
    document.body.innerHTML = '<input type="text" minlength="3">';

    expect(readPasswordRules()).toEqual(EMPTY_RULES);
  });

  it('reads minlength, maxlength and pattern of the first password field', () => {
    document.body.innerHTML = '<input type="password" minlength="8" maxlength="64" pattern="[a-z]+"><input type="password" minlength="12">';

    expect(readPasswordRules()).toEqual({ minLength: '8', maxLength: '64', pattern: '[a-z]+' });
  });

  it('prefers the focused password field', () => {
    document.body.innerHTML = '<input type="password" minlength="8"><input id="focused" type="password" minlength="12">';
    document.getElementById('focused').focus();

    expect(readPasswordRules().minLength).toBe('12');
  });

  it('falls back to data-minlength, data-maxlength and data-pattern', () => {
    document.body.innerHTML = '<input type="password" data-minlength="10" data-maxlength="20" data-pattern="\\d+">';

    expect(readPasswordRules()).toEqual({ minLength: '10', maxLength: '20', pattern: '\\d+' });
  });

  it('runs when serialized, as scripting.executeScript injects it', () => {
    document.body.innerHTML = '<input type="password" minlength="8">';
    const serialized = new Function(`return (${readPasswordRules.toString()})();`);

    expect(serialized()).toEqual({ minLength: '8', maxLength: null, pattern: null });
  });
});
