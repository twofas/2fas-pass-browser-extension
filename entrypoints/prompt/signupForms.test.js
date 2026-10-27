// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Sign-up forms are where the save prompt is needed most. Each case renders a typical sign-up form, detects its
// fields the way prompt.js does, types into them in the order a user would, and runs the captured inputs through the
// background pipeline (cleanTabsInputData, getValuesFromTabsInputData, checkFormData) against the body the site sends.
// The expected login is the account identifier the user typed and the new password.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('@/partials/functions/isVisible', () => ({ default: () => true }));

import handleInputEvent from './handleInputEvent';
import setIDsToInputs from './setIDsToInputs';
import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import setUsernameSkips from '@/partials/inputFunctions/setUsernameSkips';
import cleanTabsInputData from '@/entrypoints/background/utils/savePrompt/cleanTabsInputData';
import getValuesFromTabsInputData from '@/entrypoints/background/utils/savePrompt/getValuesFromTabsInputData';
import checkFormData from '@/entrypoints/background/utils/savePrompt/checkFormData';

const DEBOUNCE = 100;
const PASSWORD = 'N3w-Acc0unt!pass';

/**
* Renders a form and detects its fields the way prompt.js does at start.
* @param {string} html - The page markup.
* @return {HTMLInputElement[]} The tracked inputs.
*/
const renderPage = html => {
  document.body.innerHTML = html;

  const passwordInputs = getPasswordInputs([], { includeRevealed: true });
  const passwordForms = passwordInputs.map(input => input.closest('form')).filter(Boolean);
  const usernameInputs = getUsernameInputs(passwordForms, []);
  setUsernameSkips(passwordInputs, usernameInputs, false, passwordForms);

  const allInputs = passwordInputs.concat(usernameInputs);
  setIDsToInputs(allInputs);

  return allInputs;
};

/**
* Types values into fields in the given order, as the user would, and stores what prompt.js sends to the background.
* @param {Array<[string, string]>} entries - Pairs of a field selector and its value.
* @param {HTMLInputElement[]} allInputs - The tracked inputs.
* @param {Object} store - The background store of captured inputs for the tab.
* @return {Promise<void>}
*/
const fill = async (entries, allInputs, store) => {
  browser.runtime.sendMessage = vi.fn(async message => {
    if (message.action === REQUEST_ACTIONS.PROMPT_INPUT) {
      store[message.data.id] = message.data;
    }

    return { status: 'ok' };
  });

  for (const [selector, value] of entries) {
    const input = document.querySelector(selector);
    input.value = value;
    await handleInputEvent({ target: input }, allInputs, { data: 'present' }, {}, { value: false }, false, {}, {});
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 20);
  }
};

/**
* Runs the captured inputs through the background pipeline for a sign-up request.
* @param {Object} store - The captured inputs of the tab.
* @param {Object} body - The JSON body the site sends.
* @return {Promise<Object|null>} The values the save prompt would offer, or null when it would not show.
*/
const resolveSavePrompt = async (store, body) => {
  const origin = window.location.origin;
  const details = { tabId: 1, initiator: origin, requestBody: { raw: [{ bytes: new TextEncoder().encode(JSON.stringify(body)).buffer }] } };
  const cleaned = cleanTabsInputData(details, structuredClone(store), `${origin}/signup`);
  const values = getValuesFromTabsInputData(cleaned);

  if (!values.username || !values.password) {
    return null;
  }

  return await checkFormData(details, values) ? { username: values.username, password: values.password } : null;
};

describe('save prompt — sign-up forms', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('email, password and password confirmation', async () => {
    const allInputs = renderPage(`<form id="signup">
      <label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
      <label for="confirm">Confirm password</label><input id="confirm" name="password_confirmation" type="password" autocomplete="new-password">
      <button type="submit">Create account</button>
    </form>`);
    const store = {};

    await fill([['#email', 'jan@example.com'], ['#password', PASSWORD], ['#confirm', PASSWORD]], allInputs, store);

    await expect(resolveSavePrompt(store, { email: 'jan@example.com', password: PASSWORD, password_confirmation: PASSWORD }))
      .resolves.toEqual({ username: 'jan@example.com', password: PASSWORD });
  });

  it('first name, last name, email, password, confirmation and a consent checkbox', async () => {
    const allInputs = renderPage(`<form id="register">
      <label for="first">First name</label><input id="first" name="first_name" type="text" autocomplete="given-name">
      <label for="last">Last name</label><input id="last" name="last_name" type="text" autocomplete="family-name">
      <label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
      <label for="password2">Repeat password</label><input id="password2" name="password2" type="password" autocomplete="new-password">
      <label><input type="checkbox" name="terms"> I accept the terms</label>
      <button type="submit">Sign up</button>
    </form>`);
    const store = {};

    await fill([['#first', 'Jan'], ['#last', 'Kowalski'], ['#email', 'jan@example.com'], ['#password', PASSWORD], ['#password2', PASSWORD]], allInputs, store);

    await expect(resolveSavePrompt(store, { first_name: 'Jan', last_name: 'Kowalski', email: 'jan@example.com', password: PASSWORD, password2: PASSWORD, terms: true }))
      .resolves.toEqual({ username: 'jan@example.com', password: PASSWORD });
  });

  it('username, email, password and confirmation: the identifier typed last before the password', async () => {
    const allInputs = renderPage(`<form action="/register" method="post">
      <label for="username">Username</label><input id="username" name="username" type="text" autocomplete="username">
      <label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
      <label for="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autocomplete="new-password">
      <button type="submit">Register</button>
    </form>`);
    const store = {};

    await fill([['#username', 'jank'], ['#email', 'jan@example.com'], ['#password', PASSWORD], ['#confirm', PASSWORD]], allInputs, store);

    const result = await resolveSavePrompt(store, { username: 'jank', email: 'jan@example.com', password: PASSWORD, confirm: PASSWORD });

    expect(result?.password).toBe(PASSWORD);
    expect(['jank', 'jan@example.com']).toContain(result?.username);
  });

  it('a name typed after the password does not become the login', async () => {
    const allInputs = renderPage(`<form id="signup-form">
      <label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
      <label for="name">Full name</label><input id="name" name="fullName" type="text" autocomplete="name">
      <button type="submit">Continue</button>
    </form>`);
    const store = {};

    await fill([['#email', 'jan@example.com'], ['#password', PASSWORD], ['#name', 'Jan Kowalski']], allInputs, store);

    await expect(resolveSavePrompt(store, { email: 'jan@example.com', password: PASSWORD, fullName: 'Jan Kowalski' }))
      .resolves.toEqual({ username: 'jan@example.com', password: PASSWORD });
  });

  it('a sign-up built without a form element, next to a newsletter field filled earlier', async () => {
    const allInputs = renderPage(`<div class="signup-card">
        <input id="email" name="email" type="email" placeholder="Email" autocomplete="email">
        <input id="password" name="password" type="password" placeholder="Create a password" autocomplete="new-password">
        <button type="button">Create account</button>
      </div>
      <footer><form class="newsletter"><input id="newsletter" name="newsletter_email" type="email" placeholder="Your email"><button>Subscribe</button></form></footer>`);
    const store = {};

    await fill([['#newsletter', 'other@example.com'], ['#email', 'jan@example.com'], ['#password', PASSWORD]], allInputs, store);

    await expect(resolveSavePrompt(store, { email: 'jan@example.com', password: PASSWORD }))
      .resolves.toEqual({ username: 'jan@example.com', password: PASSWORD });
  });

  it('a password revealed with "show password" while it is created', async () => {
    const allInputs = renderPage(`<form id="join">
      <label for="email">Email</label><input id="email" name="email" type="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
      <button type="button" id="toggle">Show</button>
      <button type="submit">Join</button>
    </form>`);
    const store = {};

    await fill([['#email', 'jan@example.com']], allInputs, store);
    document.getElementById('password').type = 'text';
    await fill([['#password', PASSWORD]], allInputs, store);

    await expect(resolveSavePrompt(store, { email: 'jan@example.com', password: PASSWORD }))
      .resolves.toEqual({ username: 'jan@example.com', password: PASSWORD });
  });

  it('a login the site lowercases and a password with characters JSON escapes', async () => {
    const allInputs = renderPage(`<form id="signup">
      <label for="email">Email</label><input id="email" name="email" type="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
      <button type="submit">Sign up</button>
    </form>`);
    const store = {};
    const password = 'Qu"ote\\Back slash';

    await fill([['#email', ' Jan@Example.COM '], ['#password', password]], allInputs, store);

    const result = await resolveSavePrompt(store, { email: 'jan@example.com', password });

    expect(result?.password).toBe(password);
  });

  it('no prompt when the site does not send the typed password (e.g. it hashes it)', async () => {
    const allInputs = renderPage(`<form id="signup">
      <label for="email">Email</label><input id="email" name="email" type="email">
      <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password">
    </form>`);
    const store = {};

    await fill([['#email', 'jan@example.com'], ['#password', PASSWORD]], allInputs, store);

    await expect(resolveSavePrompt(store, { email: 'jan@example.com', passwordHash: 'a1b2c3' })).resolves.toBeNull();
  });
});
