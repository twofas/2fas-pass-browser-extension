// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

import crossDomainDialog from './crossDomainDialog.js';

describe('crossDomainDialog — cancels and cleans up when the page unloads (finding #5)', () => {
  let container;

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(browser.i18n, 'getMessage').mockImplementation(key => key);
    vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);
  });

  const openDialog = () => crossDomainDialog(
    { unknownDomains: ['cross.example'], theme: 'light', storageKey: 'session:autofillData-1' },
    vi.fn(),
    container
  );

  it('sends a confirmed:false dialog result when the page is hidden (pagehide)', () => {
    openDialog();
    browser.runtime.sendMessage.mockClear();

    window.dispatchEvent(new Event('pagehide'));

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);

    const message = browser.runtime.sendMessage.mock.calls[0][0];
    expect(message.action).toBe(REQUEST_ACTIONS.CROSS_DOMAIN_DIALOG_RESULT);
    expect(message.storageKey).toBe('session:autofillData-1');
    expect(message.confirmed).toBe(false);
  });

  it('removes the unload listeners after responding so a later pagehide does not fire again', () => {
    openDialog();
    window.dispatchEvent(new Event('pagehide'));
    browser.runtime.sendMessage.mockClear();

    window.dispatchEvent(new Event('pagehide'));

    expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
