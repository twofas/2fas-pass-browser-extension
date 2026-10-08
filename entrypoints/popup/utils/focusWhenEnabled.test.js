// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import focusWhenEnabled from './focusWhenEnabled';

describe('focusWhenEnabled', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('focuses an enabled element at once', () => {
    const input = document.body.appendChild(document.createElement('input'));

    focusWhenEnabled(() => input);

    expect(document.activeElement).toBe(input);
  });

  it('waits until a placeholder is replaced by an enabled element', () => {
    const placeholder = document.body.appendChild(document.createElement('input'));
    placeholder.disabled = true;
    let current = placeholder;

    focusWhenEnabled(() => current);
    expect(document.activeElement).not.toBe(placeholder);

    current = document.body.appendChild(document.createElement('input'));
    vi.advanceTimersByTime(100);

    expect(document.activeElement).toBe(current);
  });

  it('reads the input of a component ref exposing getInput()', () => {
    const input = document.body.appendChild(document.createElement('input'));

    focusWhenEnabled(() => ({ getInput: () => input }));

    expect(document.activeElement).toBe(input);
  });

  it('stops retrying when cancelled or after the attempts run out', () => {
    const placeholder = document.body.appendChild(document.createElement('input'));
    placeholder.disabled = true;
    const getElement = vi.fn(() => placeholder);

    const cancel = focusWhenEnabled(getElement);
    cancel();
    vi.advanceTimersByTime(5000);

    expect(getElement).toHaveBeenCalledTimes(1);
  });
});
