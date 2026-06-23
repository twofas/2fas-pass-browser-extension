// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import setUsernameSkips from './setUsernameSkips';

const makeInput = (form = null) => {
  const attributes = {};

  return {
    closest: selector => (selector === 'form' ? form : null),
    setAttribute: (key, value) => {
      attributes[key] = value;
    },
    getAttribute: key => (key in attributes ? attributes[key] : null)
  };
};

describe('setUsernameSkips', () => {
  it('does not skip a username input that is not inside any form', () => {
    const username = makeInput(null);

    setUsernameSkips([], [username]);

    expect(username.getAttribute('twofas-pass-skip')).toBe('false');
  });

  it('does not skip a form username input when password inputs exist in the frame', () => {
    const password = makeInput({});
    const username = makeInput({});

    setUsernameSkips([password], [username]);

    expect(username.getAttribute('twofas-pass-skip')).toBe('false');
  });

  it('does not skip a form username input when another frame has password inputs', () => {
    const username = makeInput({});

    setUsernameSkips([], [username], true);

    expect(username.getAttribute('twofas-pass-skip')).toBe('false');
  });

  it('skips a form username input when no password inputs exist anywhere', () => {
    const username = makeInput({});

    setUsernameSkips([], [username]);

    expect(username.getAttribute('twofas-pass-skip')).toBe('true');
  });

  it('sets the skip attribute independently for each username input', () => {
    const inFormUsername = makeInput({});
    const looseUsername = makeInput(null);

    setUsernameSkips([], [inFormUsername, looseUsername]);

    expect(inFormUsername.getAttribute('twofas-pass-skip')).toBe('true');
    expect(looseUsername.getAttribute('twofas-pass-skip')).toBe('false');
  });

  it('honors an explicitly provided passwordForms list when deciding form sharing', () => {
    const sharedForm = {};
    const username = makeInput(sharedForm);

    setUsernameSkips([], [username], false, [sharedForm]);

    expect(username.getAttribute('twofas-pass-skip')).toBe('false');
  });
});
