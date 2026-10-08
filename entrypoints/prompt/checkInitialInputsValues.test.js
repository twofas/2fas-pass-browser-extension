// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the initial scan reports values already present on page load, but never a password the
// site has masked ("********" shown for a remembered password) nor a username of one or two digits.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/generateNonce', () => ({ default: vi.fn() }));

import checkInitialInputsValues from './checkInitialInputsValues';

const addTaggedInput = (value, { type = 'text', id = 'id-1' } = {}) => {
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.setAttribute('twofas-pass-id', id);
  document.body.appendChild(input);

  return input;
};

describe('checkInitialInputsValues', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    browser.runtime.sendMessage = vi.fn().mockResolvedValue({ status: 'ok' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reports a prefilled username and password', async () => {
    const inputs = [addTaggedInput('alice', { id: 'u' }), addTaggedInput('s3cret!', { type: 'password', id: 'p' })];

    await checkInitialInputsValues(inputs, { data: null }, false);

    expect(browser.runtime.sendMessage.mock.calls.map(([message]) => [message.data.id, message.data.value])).toEqual([['u', 'alice'], ['p', 's3cret!']]);
  });

  it('does not report a masked password placeholder value', async () => {
    await checkInitialInputsValues([addTaggedInput('********', { type: 'password' })], { data: null }, false);

    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('does not report a username of one or two digits', async () => {
    await checkInitialInputsValues([addTaggedInput('7')], { data: null }, false);

    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
