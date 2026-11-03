// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// A login page left by a form submit can come back from the back-forward cache as the same document (the Back button).
// The content script is not run again then, so it must keep capturing: leaving the page only flushes the pending values.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/partials/functions/isVisible', () => ({ default: () => true }));
vi.mock('./ensureLocalKey', () => ({
  default: vi.fn(async () => {}),
  refreshLocalKey: vi.fn(async () => {}),
  waitForLocalKeyRefresh: vi.fn(async () => {})
}));

import promptContentScript from '../prompt.content';

/**
* Collects the PROMPT_INPUT messages sent to the background.
* @return {Object[]} The data of the messages.
*/
const sentInputs = () => browser.runtime.sendMessage.mock.calls
  .map(([message]) => message)
  .filter(message => message?.action === REQUEST_ACTIONS.PROMPT_INPUT)
  .map(message => message.data);

/**
* Types a value into an input the way the page sees it.
* @param {HTMLInputElement} input - The input.
* @param {string} value - The value.
* @return {void}
*/
const typeInto = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

describe('prompt.content — page restored from the back-forward cache', () => {
  beforeEach(() => {
    document.body.innerHTML = '<form><input type="text" name="email" autocomplete="username" id="u"><input type="password" name="password" id="p"><button type="submit">Sign in</button></form>';
    browser.runtime.sendMessage = vi.fn(async message => {
      if (message?.action === REQUEST_ACTIONS.GET_SAVE_PROMPT) {
        return { status: 'ok', data: 'default', eligible: true };
      }

      if (message?.action === REQUEST_ACTIONS.GET_LOCAL_KEY) {
        return { status: 'error' };
      }

      return { status: 'ok' };
    });
  });

  it('captures typed values while the page is shown', async () => {
    await promptContentScript.main({ isInvalid: false });
    browser.runtime.sendMessage.mockClear();

    typeInto(document.getElementById('p'), 'First-try-1!');

    await vi.waitFor(() => expect(sentInputs().map(data => data.value)).toContain('First-try-1!'), { timeout: 1000 });
  });

  it('captures values typed after the page left for the next one and came back', async () => {
    await promptContentScript.main({ isInvalid: false });

    window.dispatchEvent(new Event('beforeunload'));
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    browser.runtime.sendMessage.mockClear();

    typeInto(document.getElementById('p'), 'Second-try-2!');

    await vi.waitFor(() => expect(sentInputs().map(data => data.value)).toContain('Second-try-2!'), { timeout: 1000 });
  });
});
