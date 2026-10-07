// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import { getLoginStringField, getLoginPasswordField } from './loginFormValues';

describe('loginFormValues', () => {
  it('sets a typed credential and lets the mobile app generate an empty one', () => {
    expect(getLoginStringField('me')).toEqual({ value: 'me', action: 'set' });
    expect(getLoginStringField('')).toEqual({ value: '', action: 'generate' });
    expect(getLoginStringField(undefined)).toEqual({ value: '', action: 'generate' });
  });

  it('trims a typed username and lets the mobile app generate a blank one', () => {
    expect(getLoginStringField(' me@2fas.com \n')).toEqual({ value: 'me@2fas.com', action: 'set' });
    expect(getLoginStringField(' \t ')).toEqual({ value: '', action: 'generate' });
  });

  it('sets a typed password exactly as typed and lets the mobile app generate an empty one', () => {
    expect(getLoginPasswordField(' secret\t')).toEqual({ value: ' secret\t', action: 'set' });
    expect(getLoginPasswordField('   ')).toEqual({ value: '   ', action: 'set' });
    expect(getLoginPasswordField('')).toEqual({ value: '', action: 'generate' });
    expect(getLoginPasswordField(undefined)).toEqual({ value: '', action: 'generate' });
  });
});
