// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests for topLayerManager's listener lifecycle. The manager attaches a
// 'close' listener to every page <dialog> it tracks. cleanup() runs when the extension
// context is invalidated (without reloading the page), so it MUST remove those listeners
// — otherwise the closures keep the shadow host and the whole manager scope alive for the
// page's lifetime. Dialogs detached from the DOM mid-session must also stop being tracked,
// so converting the handler store to a strong Map does not retain them.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import topLayerManager from './topLayerManager';

const noop = () => {};

const flushMutations = () => new Promise(resolve => setTimeout(resolve, 0));

let shadowHost;

beforeEach(() => {
  document.body.innerHTML = '';
  shadowHost = document.createElement('div');
  document.body.appendChild(shadowHost);
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('topLayerManager dialog close listeners', () => {
  it("attaches a 'close' listener to dialogs present at init", () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const addSpy = vi.spyOn(dialog, 'addEventListener');

    topLayerManager(shadowHost, noop, noop);

    expect(addSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it("removes the 'close' listener on cleanup() with the same handler reference", () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const addSpy = vi.spyOn(dialog, 'addEventListener');
    const removeSpy = vi.spyOn(dialog, 'removeEventListener');

    const { cleanup } = topLayerManager(shadowHost, noop, noop);

    const closeAdd = addSpy.mock.calls.find(call => call[0] === 'close');

    expect(closeAdd).toBeTruthy();

    const handler = closeAdd[1];

    cleanup();

    expect(removeSpy).toHaveBeenCalledWith('close', handler);
  });

  it('removes close listeners from every tracked dialog on cleanup()', () => {
    const dialogA = document.createElement('dialog');
    const dialogB = document.createElement('dialog');
    document.body.appendChild(dialogA);
    document.body.appendChild(dialogB);
    const removeA = vi.spyOn(dialogA, 'removeEventListener');
    const removeB = vi.spyOn(dialogB, 'removeEventListener');

    const { cleanup } = topLayerManager(shadowHost, noop, noop);

    cleanup();

    expect(removeA).toHaveBeenCalledWith('close', expect.any(Function));
    expect(removeB).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('untracks a dialog removed from the DOM so it is not retained until cleanup', async () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const removeSpy = vi.spyOn(dialog, 'removeEventListener');

    topLayerManager(shadowHost, noop, noop);

    dialog.remove();

    await flushMutations();

    expect(removeSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });
});
