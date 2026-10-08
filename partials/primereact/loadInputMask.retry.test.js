// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

const state = vi.hoisted(() => ({ fail: true }));

vi.mock('primereact/inputmask', () => {
  if (state.fail) {
    throw new Error('chunk failed');
  }

  return { InputMask: 'MockInputMask' };
});

import { getLoadedInputMask, loadInputMask } from './loadInputMask';

describe('loadInputMask after a failed load', () => {
  it('forgets the failure and loads on the next call', async () => {
    await expect(loadInputMask()).rejects.toThrow();
    expect(getLoadedInputMask()).toBeNull();

    state.fail = false;

    await expect(loadInputMask()).resolves.toBe('MockInputMask');
  });
});
