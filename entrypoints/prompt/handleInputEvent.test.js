// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression coverage for finding #36: the debounce in handleInputEvent must work
// for inputs that do not yet carry a twofas-pass-id (dynamically added fields,
// typical in SPAs). The timer key must be stable per element so rapid keystrokes
// collapse into a single scheduled run instead of one run per keystroke.
//
// jsdom has no layout engine, so visibility and the DOM-scanning detection helpers
// are stubbed; the timer keying logic under test is exercised against real timers
// via vi.useFakeTimers().

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

vi.mock('@/partials/functions', () => ({
  isVisible: () => true,
  isElementInArray: (element, array) => Array.isArray(array) && array.includes(element),
  generateNonce: vi.fn()
}));

vi.mock('@/partials/inputFunctions/getPasswordInputs', () => ({ default: () => [] }));
vi.mock('@/partials/inputFunctions/getUsernameInputs', () => ({
  default: () => Array.from(document.querySelectorAll('input'))
}));
vi.mock('@/partials/inputFunctions/setUsernameSkips', () => ({ default: () => {} }));

const shadowRootsMock = vi.hoisted(() => ({ value: [] }));
vi.mock('../../entrypoints/content/functions/autofillFunctions/getShadowRoots', () => ({ default: () => shadowRootsMock.value }));

const hoisted = vi.hoisted(() => ({ idCounter: 0 }));
vi.mock('./generateInputId', () => ({ default: () => `gen-id-${++hoisted.idCounter}` }));

import handleInputEvent from './handleInputEvent';
import { generateNonce } from '@/partials/functions';

const DEBOUNCE = 100;

const addInput = name => {
  const input = document.createElement('input');
  input.type = 'text';

  if (name) {
    input.setAttribute('name', name);
  }

  input.value = 'value';
  document.body.appendChild(input);

  return input;
};

describe('handleInputEvent — debounce for untagged inputs (finding #36)', () => {
  let timers;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    hoisted.idCounter = 0;
    timers = {};
    browser.runtime.sendMessage = vi.fn().mockResolvedValue({ status: 'ok' });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  const fire = input => handleInputEvent({ target: input }, [], { data: 'present' }, timers, { value: false }, false);

  it('collapses rapid keystrokes on an untagged input into a single PROMPT_INPUT', async () => {
    const input = addInput('login');

    for (let i = 0; i < 5; i++) {
      await fire(input);
      await vi.advanceTimersByTimeAsync(20);
    }

    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('keeps exactly one pending timer for an untagged input across rapid keystrokes', async () => {
    const input = addInput('login');

    for (let i = 0; i < 5; i++) {
      await fire(input);
      await vi.advanceTimersByTimeAsync(20);
    }

    expect(Object.keys(timers)).toHaveLength(1);
  });

  it('debounces two distinct unnamed inputs independently (no key collision)', async () => {
    const inputA = addInput();
    const inputB = addInput();

    await fire(inputA);
    await fire(inputB);

    expect(Object.keys(timers)).toHaveLength(2);
  });

  it('keeps debouncing under twofas-pass-id after the element becomes tagged (no orphan timer)', async () => {
    const input = addInput('login');

    await fire(input);
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(input.getAttribute('twofas-pass-id')).toBeTruthy();
    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 4; i++) {
      await fire(input);
      await vi.advanceTimersByTimeAsync(20);
    }

    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
    expect(Object.keys(timers)).toHaveLength(0);
  });
});

// Regression coverage for finding #32: the flush/beacon fallback caches
// (latestValues / beaconPayloads) keep the most recent value of every tracked
// field — in the unencrypted save-prompt mode that value is the PLAINTEXT
// password/username. Once a value has been delivered to the background via
// PROMPT_INPUT it is no longer needed by either fallback (both consumers only
// read entries with sent === false), so the entry must be REMOVED rather than
// merely flagged sent: true. This keeps the maps bounded for the page lifetime
// and stops sensitive data from lingering in content-script memory. Entries for
// sends that FAILED must be retained (sent: false) so the unload/submit flush
// can still deliver them.

describe('handleInputEvent — sensitive value cleanup after send (finding #32)', () => {
  let timers;

  const addTaggedInput = (value, { type = 'text', id = 'id-1' } = {}) => {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.setAttribute('twofas-pass-id', id);
    document.body.appendChild(input);

    return input;
  };

  const fire = (input, { encrypted = false, latestValues, beaconPayloads, localKey = { data: 'present' } }) =>
    handleInputEvent({ target: input }, [input], localKey, timers, { value: false }, encrypted, latestValues, beaconPayloads);

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    hoisted.idCounter = 0;
    timers = {};
    browser.runtime.sendMessage = vi.fn().mockResolvedValue({ status: 'ok' });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('removes the cached plaintext value from latestValues after a successful send', async () => {
    const input = addTaggedInput('secret-pass', { type: 'password' });
    const latestValues = {};

    await fire(input, { encrypted: false, latestValues });
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(latestValues['id-1']).toBeUndefined();
    expect(Object.keys(latestValues)).toHaveLength(0);
  });

  it('keeps the latestValues entry (sent: false) when the send fails so the flush fallback still works', async () => {
    browser.runtime.sendMessage = vi.fn().mockRejectedValue(new Error('disconnected'));
    const input = addTaggedInput('secret-pass', { type: 'password' });
    const latestValues = {};

    await fire(input, { encrypted: false, latestValues });
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(latestValues['id-1']).toBeDefined();
    expect(latestValues['id-1'].sent).toBe(false);
  });

  it('removes entries from both latestValues and beaconPayloads after a successful send (encrypted mode)', async () => {
    generateNonce.mockResolvedValue({ ArrayBuffer: new ArrayBuffer(12) });
    vi.stubGlobal('crypto', { subtle: { encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)) } });

    const input = addTaggedInput('secret-pass', { type: 'password' });
    const latestValues = {};
    const beaconPayloads = {};

    await fire(input, { encrypted: true, latestValues, beaconPayloads });
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(latestValues['id-1']).toBeUndefined();
    expect(beaconPayloads['id-1']).toBeUndefined();
  });
});

// Regression coverage for finding #18: input events from an OPEN shadow DOM are
// retargeted at document level, so e.target is the shadow host, not the field the
// user is typing in. The real target must be resolved via e.composedPath()[0]
// (input events are composed). The previous heuristic grabbed shadowInputs[0] —
// always the first input in the host subtree — so when username + password share
// one shadow root, every keystroke (the password included) was attributed to the
// username field and the typed password never reached the save prompt.

describe('handleInputEvent — shadow DOM retargeting via composedPath (finding #18)', () => {
  let timers;

  const buildShadowLogin = () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const username = document.createElement('input');
    username.type = 'text';
    username.value = 'alice';
    username.setAttribute('twofas-pass-id', 'user-id');

    const password = document.createElement('input');
    password.type = 'password';
    password.value = 'secret';
    password.setAttribute('twofas-pass-id', 'pass-id');

    shadow.appendChild(username);
    shadow.appendChild(password);

    return { host, shadow, username, password };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    hoisted.idCounter = 0;
    timers = {};
    shadowRootsMock.value = [];
    browser.runtime.sendMessage = vi.fn().mockResolvedValue({ status: 'ok' });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    shadowRootsMock.value = [];
    document.body.innerHTML = '';
  });

  it('targets the real password field (composedPath[0]) inside an open shadow root, not shadowInputs[0]', async () => {
    const { host, shadow, username, password } = buildShadowLogin();
    shadowRootsMock.value = [shadow]; // so the legacy heuristic would pick username (shadowInputs[0])

    const e = { target: host, composedPath: () => [password, host, document.body, document] };
    await handleInputEvent(e, [username, password], { data: 'present' }, timers, { value: false }, false);
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const sent = browser.runtime.sendMessage.mock.calls[0][0].data;
    expect(sent.id).toBe('pass-id');
    expect(sent.type).toBe('password');
    expect(sent.value).toBe('secret');
  });

  it('falls back to the shadow heuristic when composedPath is unavailable', async () => {
    const { host, shadow, username } = buildShadowLogin();
    shadowRootsMock.value = [shadow];

    const e = { target: host }; // no composedPath (e.g. closed shadow / unsupported)
    await handleInputEvent(e, [username], { data: 'present' }, timers, { value: false }, false);
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const sent = browser.runtime.sendMessage.mock.calls[0][0].data;
    expect(sent.id).toBe('user-id');
  });

  it('uses composedPath[0] for a regular light-DOM input unchanged', async () => {
    const input = document.createElement('input');
    input.type = 'password';
    input.value = 'plain';
    input.setAttribute('twofas-pass-id', 'light-id');
    document.body.appendChild(input);

    const e = { target: input, composedPath: () => [input, document.body, document] };
    await handleInputEvent(e, [input], { data: 'present' }, timers, { value: false }, false);
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const sent = browser.runtime.sendMessage.mock.calls[0][0].data;
    expect(sent.id).toBe('light-id');
    expect(sent.type).toBe('password');
    expect(sent.value).toBe('plain');
  });

  // The composed path is only populated while the event is being dispatched; once a
  // handler awaits, composedPath() returns []. On the FIRST keystroke of a page session
  // localKey.data is null, so the lazy GET_LOCAL_KEY + importKey await branch runs before
  // the target is resolved — a post-await composedPath() read would see [] and fall back
  // to the shadow host, reintroducing the finding #18 bug. The target must be captured
  // synchronously, before any await. This test models that dispatch lifecycle.
  it('resolves the real target synchronously even when the lazy key-import awaits first (composedPath empties after await)', async () => {
    const { host, shadow, username, password } = buildShadowLogin();
    shadowRootsMock.value = [shadow];

    let dispatchActive = true;
    vi.stubGlobal('crypto', { subtle: { importKey: vi.fn().mockResolvedValue('imported-key') } });
    browser.runtime.sendMessage = vi.fn().mockResolvedValue({ status: 'ok', data: 'AAAA' });

    const e = { target: host, composedPath: () => (dispatchActive ? [password, host, document.body, document] : []) };
    const pending = handleInputEvent(e, [username, password], { data: null }, timers, { value: false }, false);
    dispatchActive = false; // dispatch has ended — composedPath() now returns []
    await pending;
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 50);

    const promptCall = browser.runtime.sendMessage.mock.calls.find(c => c[0]?.data?.id);
    expect(promptCall).toBeTruthy();
    expect(promptCall[0].data.id).toBe('pass-id');
    expect(promptCall[0].data.type).toBe('password');
  });
});
