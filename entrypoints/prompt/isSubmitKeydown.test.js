// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Enter pressed by the user in a login field submits the form; the pending values are flushed to the background then.

import { describe, it, expect } from 'vitest';
import isSubmitKeydown from './isSubmitKeydown';

const make = html => {
  document.body.innerHTML = html;
};

const enterOn = (target, extra = {}) => ({ key: 'Enter', isComposing: false, isTrusted: true, target, ...extra });

describe('isSubmitKeydown', () => {
  it('matches Enter in a password field', () => {
    make('<input type="password">');

    expect(isSubmitKeydown(enterOn(document.querySelector('input')), [])).toBe(true);
  });

  it('matches Enter in a tracked username field', () => {
    make('<input type="text" twofas-pass-id="u1">');

    expect(isSubmitKeydown(enterOn(document.querySelector('input')), [])).toBe(true);
  });

  it('matches Enter in any field of a form with a password', () => {
    make('<form><input type="text" id="t"><input type="password"></form>');

    expect(isSubmitKeydown(enterOn(document.getElementById('t')), [])).toBe(true);
  });

  it('ignores Enter in an unrelated field', () => {
    make('<form><input type="search" id="s"></form>');

    expect(isSubmitKeydown(enterOn(document.getElementById('s')), [])).toBe(false);
  });

  it('ignores other keys and Enter while composing text', () => {
    make('<input type="password">');
    const input = document.querySelector('input');

    expect(isSubmitKeydown(enterOn(input, { key: 'a' }), [])).toBe(false);
    expect(isSubmitKeydown(enterOn(input, { isComposing: true }), [])).toBe(false);
  });

  it('ignores Enter the page dispatched from a script', () => {
    make('<input type="password">');

    expect(isSubmitKeydown(enterOn(document.querySelector('input'), { isTrusted: false }), [])).toBe(false);
  });

  it('reads the field from the composed path (open shadow root)', () => {
    make('<div id="host"></div>');
    const root = document.getElementById('host').attachShadow({ mode: 'open' });
    root.innerHTML = '<input type="password">';
    const input = root.querySelector('input');

    expect(isSubmitKeydown(enterOn(document.getElementById('host'), { composedPath: () => [input] }), [])).toBe(true);
  });
});
