// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression spec: a login page whose "show password" button flipped the password input to
// type="text" before the user triggered autofill. The real detection, password-role filter and
// value setter run against a real jsdom DOM; only visibility is stubbed (jsdom has no layout).

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

vi.mock('@/partials/functions/isVisible', () => ({
  default: element => Boolean(element) && element.getAttribute?.('data-invisible') !== 'true'
}));

import { AUTOFILL_RESULT_CODES } from '@/constants';
import autofill from './autofill';

const USERNAME = 'jan@example.com';
const PASSWORD = '  S3cr3t!Pass  ';

beforeAll(() => {
  if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
    globalThis.CSS = globalThis.CSS || {};
    globalThis.CSS.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
  }
});

const valueOf = selector => document.querySelector(selector).value;

const runAutofill = (request = {}) => autofill({ username: USERNAME, password: PASSWORD, cryptoAvailable: false, ...request });

const reveal = selector => {
  document.querySelector(selector).type = 'text';
};

describe('autofill with a revealed (type="text") password field', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('fills the username and the revealed password field', async () => {
    document.body.innerHTML = `
      <form>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="username" />
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" />
        <button type="button">Show</button>
      </form>
    `;
    reveal('#password');

    const result = await runAutofill();

    expect(result).toMatchObject({ status: 'ok', canAutofillPassword: true, canAutofillUsername: true });
    expect(valueOf('#email')).toBe(USERNAME);
    expect(valueOf('#password')).toBe(PASSWORD);
  });

  it('fills a password field replaced by a fresh type="text" element', async () => {
    document.body.innerHTML = `
      <form>
        <input type="email" id="email" name="email" />
        <input type="text" id="password" name="password" autocomplete="current-password" />
      </form>
    `;

    const result = await runAutofill();

    expect(result.status).toBe('ok');
    expect(valueOf('#password')).toBe(PASSWORD);
  });

  it('fills a revealed password on a password-only (second) login step', async () => {
    document.body.innerHTML = `
      <form>
        <input type="password" id="password" name="password" autocomplete="current-password" />
      </form>
    `;
    reveal('#password');

    const result = await runAutofill({ hasPasswordInAnyFrame: true });

    expect(result).toMatchObject({ status: 'ok', canAutofillPassword: true });
    expect(valueOf('#password')).toBe(PASSWORD);
  });

  it('writes the password, not the username, into a revealed field inside a login-form container', async () => {
    document.body.innerHTML = `
      <form id="loginForm">
        <input type="email" id="email" name="email" />
        <label for="haslo">Hasło</label>
        <input type="password" id="haslo" name="haslo" />
      </form>
    `;
    reveal('#haslo');

    await runAutofill();

    expect(valueOf('#email')).toBe(USERNAME);
    expect(valueOf('#haslo')).toBe(PASSWORD);
  });

  it('writes the password, not the username, into a revealed field whose placeholder mentions login', async () => {
    document.body.innerHTML = `
      <form>
        <input type="email" id="email" name="email" />
        <input type="password" id="pw" name="pw" placeholder="Your login password" />
      </form>
    `;
    reveal('#pw');

    await runAutofill();

    expect(valueOf('#email')).toBe(USERNAME);
    expect(valueOf('#pw')).toBe(PASSWORD);
  });

  it('fills a revealed password on a form-less login widget', async () => {
    document.body.innerHTML = `
      <div>
        <input type="email" id="email" name="email" placeholder="Email" />
        <input type="password" id="password" name="password" placeholder="Password" />
      </div>
    `;
    reveal('#password');

    const result = await runAutofill();

    expect(result.status).toBe('ok');
    expect(valueOf('#email')).toBe(USERNAME);
    expect(valueOf('#password')).toBe(PASSWORD);
  });

  it('fills only the revealed current password on a change-password form', async () => {
    document.body.innerHTML = `
      <form>
        <input type="password" id="current" name="current_password" />
        <input type="password" id="new" name="new_password" />
        <input type="password" id="confirm" name="confirm_password" />
      </form>
    `;
    reveal('#current');

    await runAutofill({ noUsername: true, username: '' });

    expect(valueOf('#current')).toBe(PASSWORD);
    expect(valueOf('#new')).toBe('');
    expect(valueOf('#confirm')).toBe('');
  });

  it('does not fill a password hint field next to a masked password', async () => {
    document.body.innerHTML = `
      <form>
        <input type="email" id="email" name="email" />
        <input type="password" id="password" name="password" />
        <label for="hint">Password hint</label>
        <input type="text" id="hint" name="password_hint" />
      </form>
    `;

    await runAutofill();

    expect(valueOf('#password')).toBe(PASSWORD);
    expect(valueOf('#hint')).toBe('');
  });

  it('does not fill a text field labelled "Password" while the form still has a masked password field', async () => {
    document.body.innerHTML = `
      <form>
        <input type="email" id="email" name="email" />
        <label for="x">Password</label>
        <input type="text" id="x" name="x" />
        <input type="password" id="password" name="password" />
      </form>
    `;

    await runAutofill();

    expect(valueOf('#password')).toBe(PASSWORD);
    expect(valueOf('#x')).toBe('');
  });

  it('does not fill a one-time password field', async () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="otp" name="otp" placeholder="One-time password" autocomplete="one-time-code" />
      </form>
    `;

    const result = await runAutofill();

    expect(result.code).toBe(AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS);
    expect(valueOf('#otp')).toBe('');
  });
});
