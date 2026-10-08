// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

vi.mock('primereact/inputmask', () => ({ InputMask: 'MockInputMask' }));

import { getLoadedInputMask, loadInputMask } from './loadInputMask';

describe('loadInputMask', () => {
  it('has nothing loaded before the first load, then serves the component synchronously', async () => {
    expect(getLoadedInputMask()).toBeNull();

    await expect(loadInputMask()).resolves.toBe('MockInputMask');
    expect(getLoadedInputMask()).toBe('MockInputMask');
  });

  it('shares one load between callers', () => {
    expect(loadInputMask()).toBe(loadInputMask());
  });
});
