// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// The registry of inputs once seen as type="password" lives on the content-script global so
// every content script of the extension in a frame (focus, prompt, content) shares one set.

import { describe, it, expect, vi, afterEach } from 'vitest';

const REGISTRY_KEY = '__twofasPassRevealedInputs';

describe('revealedPasswordRegistry', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('exposes one WeakSet on the global scope', async () => {
    const { getRevealedPasswordRegistry } = await import('./revealedPasswordRegistry');

    const registry = getRevealedPasswordRegistry();

    expect(registry).toBeInstanceOf(WeakSet);
    expect(globalThis[REGISTRY_KEY]).toBe(registry);
    expect(getRevealedPasswordRegistry()).toBe(registry);
  });

  it('shares the same set with a second, independently loaded module instance', async () => {
    const first = await import('./revealedPasswordRegistry');
    const input = document.createElement('input');

    first.getRevealedPasswordRegistry().add(input);
    vi.resetModules();

    const second = await import('./revealedPasswordRegistry');

    expect(second.getRevealedPasswordRegistry().has(input)).toBe(true);
  });

  it('keeps the global entry non-enumerable and read-only', async () => {
    const { getRevealedPasswordRegistry } = await import('./revealedPasswordRegistry');

    getRevealedPasswordRegistry();

    const descriptor = Object.getOwnPropertyDescriptor(globalThis, REGISTRY_KEY);

    expect(descriptor.enumerable).toBe(false);
    expect(descriptor.writable).toBe(false);
    expect(descriptor.configurable).toBe(false);
  });
});
