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
let managers = [];

// Every manager attaches a bodyObserver to document.documentElement and a document-level
// 'toggle' listener that outlive the test unless torn down. jsdom shares one document
// across a file, so a leaked observer from a prior test would keep reacting to DOM changes
// in later tests. Spawn through this helper so afterEach can disconnect them all.
const spawn = (...args) => {
  const api = topLayerManager(...args);
  managers.push(api);
  return api;
};

beforeEach(() => {
  document.body.innerHTML = '';
  shadowHost = document.createElement('div');
  document.body.appendChild(shadowHost);
});

afterEach(() => {
  managers.forEach(manager => manager.cleanup());
  managers = [];
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('topLayerManager dialog close listeners', () => {
  it("attaches a 'close' listener to dialogs present at init", () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const addSpy = vi.spyOn(dialog, 'addEventListener');

    spawn(shadowHost, noop, noop);

    expect(addSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it("removes the 'close' listener on cleanup() with the same handler reference", () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const addSpy = vi.spyOn(dialog, 'addEventListener');
    const removeSpy = vi.spyOn(dialog, 'removeEventListener');

    const { cleanup } = spawn(shadowHost, noop, noop);

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

    const { cleanup } = spawn(shadowHost, noop, noop);

    cleanup();

    expect(removeA).toHaveBeenCalledWith('close', expect.any(Function));
    expect(removeB).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('untracks a dialog removed from the DOM so it is not retained until cleanup', async () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const removeSpy = vi.spyOn(dialog, 'removeEventListener');

    spawn(shadowHost, noop, noop);

    dialog.remove();

    await flushMutations();

    expect(removeSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });
});

// pause()/resume() let the content script stop observing the whole document while its
// tab is hidden (visibilitychange) and resume — with a full re-sync — when it returns.
// pause tears down the same listeners as cleanup (toggle + every tracked dialog's close
// + the body MutationObserver) WITHOUT relocating the shadow host or dropping the
// original-parent state, so resume can faithfully re-establish observation and re-scan
// the live DOM. This is the only observer gated on visibility: setupStyleObserver is an
// anti-tamper control and stays on.
describe('topLayerManager pause/resume', () => {
  it('exposes pause and resume alongside cleanup', () => {
    const api = spawn(shadowHost, noop, noop);

    expect(typeof api.pause).toBe('function');
    expect(typeof api.resume).toBe('function');
    expect(typeof api.cleanup).toBe('function');
  });

  it("removes a tracked dialog's close listener on pause()", () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    const removeSpy = vi.spyOn(dialog, 'removeEventListener');

    const { pause } = spawn(shadowHost, noop, noop);

    pause();

    expect(removeSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it("removes the document 'toggle' listener on pause()", () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { pause } = spawn(shadowHost, noop, noop);

    pause();

    expect(removeSpy).toHaveBeenCalledWith('toggle', expect.any(Function), true);
  });

  it("re-attaches a tracked dialog's close listener on resume()", () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);

    const { pause, resume } = spawn(shadowHost, noop, noop);

    pause();

    const addSpy = vi.spyOn(dialog, 'addEventListener');

    resume();

    expect(addSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it("re-adds the document 'toggle' listener on resume()", () => {
    const { pause, resume } = spawn(shadowHost, noop, noop);

    pause();

    const addSpy = vi.spyOn(document, 'addEventListener');

    resume();

    expect(addSpy).toHaveBeenCalledWith('toggle', expect.any(Function), true);
  });

  it('does not observe dialogs opened while paused, then tracks them on resume()', async () => {
    const { pause, resume } = spawn(shadowHost, noop, noop);

    pause();

    const dialog = document.createElement('dialog');
    const addSpy = vi.spyOn(dialog, 'addEventListener');
    document.body.appendChild(dialog);
    dialog.setAttribute('open', '');

    await flushMutations();

    expect(addSpy).not.toHaveBeenCalledWith('close', expect.any(Function));

    resume();

    expect(addSpy).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('pause() is idempotent — a second call tears down nothing further', () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);

    const { pause } = spawn(shadowHost, noop, noop);

    pause();

    const removeSpy = vi.spyOn(dialog, 'removeEventListener');

    pause();

    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('resume() without a prior pause is a no-op (no duplicate toggle listener)', () => {
    const { resume } = spawn(shadowHost, noop, noop);
    const addSpy = vi.spyOn(document, 'addEventListener');

    resume();

    expect(addSpy).not.toHaveBeenCalledWith('toggle', expect.any(Function), true);
  });

  it('cleanup() after pause() does not throw', () => {
    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);

    const { pause, cleanup } = spawn(shadowHost, noop, noop);

    pause();

    expect(() => cleanup()).not.toThrow();
  });
});
