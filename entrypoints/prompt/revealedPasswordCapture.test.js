// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// A password field revealed by a "show password" toggle (type="password" flipped to type="text", or swapped
// for a new text input) still holds the password: the save prompt must capture it as the password, never as
// the username.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/isVisible', () => ({ default: () => true }));

import handleInputEvent from './handleInputEvent';
import flushPendingInputs from './flushPendingInputs';
import checkInitialInputsValues from './checkInitialInputsValues';
import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setIDsToInputs from './setIDsToInputs';

const DEBOUNCE = 100;

/**
* Renders a login form and returns its tracked inputs, detected the way prompt.js does at start.
* @return {{ username: HTMLInputElement, password: HTMLInputElement, allInputs: HTMLInputElement[] }}
*/
const renderLoginForm = () => {
  document.body.innerHTML = `<form>
    <label for="email">Email</label><input id="email" name="email" type="email">
    <label for="password">Password</label><input id="password" name="password" type="password">
    <button type="button" id="toggle">Show</button>
    <button type="submit">Sign up</button>
  </form>`;

  const passwordInputs = getPasswordInputs([]);
  const usernameInputs = getUsernameInputs(passwordInputs.map(input => input.closest('form')), []);
  const allInputs = passwordInputs.concat(usernameInputs);
  setIDsToInputs(allInputs);

  return { username: document.getElementById('email'), password: document.getElementById('password'), allInputs };
};

/**
* Types a value into an input and dispatches the input event to handleInputEvent.
* @param {HTMLInputElement} input - The input element.
* @param {string} value - The value to type.
* @param {Object} state - The handler state.
* @return {Promise<void>}
*/
const type = async (input, value, state) => {
  input.value = value;
  await handleInputEvent({ target: input }, state.allInputs, { data: 'present' }, state.timers, { value: false }, false, {}, {});
  await vi.advanceTimersByTimeAsync(DEBOUNCE + 20);
};

/**
* Returns the PROMPT_INPUT payloads sent to the background.
* @return {Object[]} The sent input data.
*/
const sentInputs = () => browser.runtime.sendMessage.mock.calls.map(([message]) => message.data);

describe('save prompt capture — revealed password fields', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    browser.runtime.sendMessage = vi.fn().mockResolvedValue({ status: 'ok' });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('captures typing in a password field flipped to type="text" as the password', async () => {
    const { username, password, allInputs } = renderLoginForm();
    const state = { allInputs, timers: {} };

    await type(username, 'jan@example.com', state);
    password.type = 'text';
    await type(password, 'S3cret-pass', state);

    const passwordEntry = sentInputs().find(data => data.value === 'S3cret-pass');
    expect(passwordEntry.type).toBe('password');
  });

  it('captures typing in a text input that replaced the password field as the password', async () => {
    const { password, allInputs } = renderLoginForm();
    const state = { allInputs, timers: {} };
    const revealed = document.createElement('input');
    revealed.type = 'text';
    revealed.id = 'password';
    revealed.name = 'password';
    revealed.setAttribute('autocomplete', 'new-password');
    password.replaceWith(revealed);

    await type(revealed, 'S3cret-pass', state);

    const passwordEntry = sentInputs().find(data => data.value === 'S3cret-pass');
    expect(passwordEntry?.type).toBe('password');
  });

  it('flushes a revealed password field as the password', () => {
    const { password, allInputs } = renderLoginForm();
    password.value = 'S3cret-pass';
    password.type = 'text';

    const flushed = flushPendingInputs(allInputs, {}, {});

    expect(flushed.find(data => data.value === 'S3cret-pass').type).toBe('password');
  });

  it('reports an initially filled revealed password field as the password', async () => {
    const { password, allInputs } = renderLoginForm();
    password.value = 'S3cret-pass';
    password.type = 'text';

    await checkInitialInputsValues(allInputs, { data: null }, false);

    expect(sentInputs().find(data => data.value === 'S3cret-pass').type).toBe('password');
  });

  it('keeps a plain text username field as the username', async () => {
    const { username, allInputs } = renderLoginForm();
    const state = { allInputs, timers: {} };

    await type(username, 'jan@example.com', state);

    expect(sentInputs().find(data => data.value === 'jan@example.com').type).toBe('username');
  });
});
