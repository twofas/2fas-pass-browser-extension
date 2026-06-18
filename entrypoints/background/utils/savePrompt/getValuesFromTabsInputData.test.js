// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #41 (part 2): the save-prompt consumer pipeline must not collapse the
// per-entry encryption state into a single flag taken from the password entry.
// getValuesFromTabsInputData now surfaces the encryption flag of each field
// independently so a mixed set (e.g. encrypted username + plaintext password, or
// vice versa) is decrypted field-by-field instead of all-or-nothing.

import { describe, it, expect } from 'vitest';
import getValuesFromTabsInputData from './getValuesFromTabsInputData';

const usernameEntry = (overrides = {}) => ({ type: 'username', value: 'alice@example.com', encrypted: false, ...overrides });
const passwordEntry = (overrides = {}) => ({ type: 'password', value: 'hunter2', encrypted: false, ...overrides });

describe('getValuesFromTabsInputData — per-field encryption flags', () => {
  it('returns false flags for an empty / missing input set', () => {
    expect(getValuesFromTabsInputData(null)).toEqual({
      username: undefined,
      password: undefined,
      usernameEncrypted: false,
      passwordEncrypted: false
    });
    expect(getValuesFromTabsInputData({})).toEqual({
      username: undefined,
      password: undefined,
      usernameEncrypted: false,
      passwordEncrypted: false
    });
  });

  it('reports both fields as plaintext in default mode', () => {
    const result = getValuesFromTabsInputData({
      u1: usernameEntry(),
      p1: passwordEntry()
    });

    expect(result.username).toBe('alice@example.com');
    expect(result.password).toBe('hunter2');
    expect(result.usernameEncrypted).toBe(false);
    expect(result.passwordEncrypted).toBe(false);
  });

  it('reports both fields as encrypted in default_encrypted mode', () => {
    const result = getValuesFromTabsInputData({
      u1: usernameEntry({ value: 'CIPHER_U', encrypted: true }),
      p1: passwordEntry({ value: 'CIPHER_P', encrypted: true })
    });

    expect(result.usernameEncrypted).toBe(true);
    expect(result.passwordEncrypted).toBe(true);
  });

  it('keeps the username and password encryption flags independent (encrypted username + plaintext password)', () => {
    const result = getValuesFromTabsInputData({
      u1: usernameEntry({ value: 'CIPHER_U', encrypted: true }),
      p1: passwordEntry({ value: 'hunter2', encrypted: false })
    });

    expect(result.username).toBe('CIPHER_U');
    expect(result.password).toBe('hunter2');
    expect(result.usernameEncrypted).toBe(true);
    expect(result.passwordEncrypted).toBe(false);
  });

  it('keeps the flags independent the other way around (plaintext username + encrypted password)', () => {
    const result = getValuesFromTabsInputData({
      u1: usernameEntry({ value: 'alice@example.com', encrypted: false }),
      p1: passwordEntry({ value: 'CIPHER_P', encrypted: true })
    });

    expect(result.username).toBe('alice@example.com');
    expect(result.password).toBe('CIPHER_P');
    expect(result.usernameEncrypted).toBe(false);
    expect(result.passwordEncrypted).toBe(true);
  });

  it('treats a missing encrypted flag as plaintext (false)', () => {
    const result = getValuesFromTabsInputData({
      u1: { type: 'username', value: 'alice@example.com' },
      p1: { type: 'password', value: 'hunter2' }
    });

    expect(result.usernameEncrypted).toBe(false);
    expect(result.passwordEncrypted).toBe(false);
  });
});
