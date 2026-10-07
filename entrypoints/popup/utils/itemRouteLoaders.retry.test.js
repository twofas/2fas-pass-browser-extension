// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

const state = vi.hoisted(() => ({ fail: true, evaluated: 0 }));

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));
vi.mock('../routes/AddNew', () => {
  if (state.fail) {
    throw new Error('chunk failed');
  }

  state.evaluated++;

  return { default: 'AddNewRoute' };
});
vi.mock('../routes/Details', () => ({ default: 'DetailsRoute' }));

import { prefetchItemRoutes } from './itemRouteLoaders';

describe('prefetchItemRoutes after a failed prefetch', () => {
  it('prefetches again on the next call', async () => {
    await prefetchItemRoutes();

    state.fail = false;
    await prefetchItemRoutes();

    expect(state.evaluated).toBe(1);
  });
});
