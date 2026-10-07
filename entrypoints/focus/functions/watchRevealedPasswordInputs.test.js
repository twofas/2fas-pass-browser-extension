// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// The always-loaded focus content script watches for "show password" toggles (type="password"
// -> type="text") and records the flipped inputs so the on-demand autofill script still treats
// them as password fields.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getRevealedPasswordRegistry } from '@/partials/inputFunctions/revealedPasswordRegistry';
import watchRevealedPasswordInputs from './watchRevealedPasswordInputs';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('watchRevealedPasswordInputs', () => {
  let stop;

  beforeEach(() => {
    document.body.innerHTML = '<form><input type="email" name="email" /><input type="password" id="pw" name="pw" /></form>';
    stop = watchRevealedPasswordInputs();
  });

  afterEach(() => {
    stop();
    document.body.innerHTML = '';
  });

  it('records an input whose type flips from password to text', async () => {
    const input = document.getElementById('pw');

    input.type = 'text';
    await flush();

    expect(getRevealedPasswordRegistry().has(input)).toBe(true);
  });

  it('records a flip done through setAttribute, regardless of letter case', async () => {
    const input = document.getElementById('pw');

    input.setAttribute('type', 'PASSWORD');
    await flush();
    input.setAttribute('type', 'text');
    await flush();

    expect(getRevealedPasswordRegistry().has(input)).toBe(true);
  });

  it('ignores type changes that did not start from password', async () => {
    const input = document.querySelector('input[name="email"]');

    input.type = 'text';
    await flush();

    expect(getRevealedPasswordRegistry().has(input)).toBe(false);
  });

  it('ignores a type attribute change on a non-input element', async () => {
    const button = document.createElement('button');

    button.setAttribute('type', 'password');
    document.body.appendChild(button);
    await flush();
    button.setAttribute('type', 'text');
    await flush();

    expect(getRevealedPasswordRegistry().has(button)).toBe(false);
  });

  it('stops recording after the returned cleanup runs', async () => {
    const input = document.getElementById('pw');

    stop();
    input.type = 'text';
    await flush();

    expect(getRevealedPasswordRegistry().has(input)).toBe(false);
  });
});
