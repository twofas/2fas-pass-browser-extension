// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

const evaluated = vi.hoisted(() => ({ addNew: 0, details: 0 }));

vi.mock('../routes/AddNew', () => {
  evaluated.addNew++;

  return { default: 'AddNewRoute' };
});
vi.mock('../routes/Details', () => {
  evaluated.details++;

  return { default: 'DetailsRoute' };
});

import { loadAddNewRoute, loadDetailsRoute, prefetchItemRoutes } from './itemRouteLoaders';

describe('itemRouteLoaders', () => {
  it('loads the AddNew and Details route modules', async () => {
    await expect(loadAddNewRoute()).resolves.toMatchObject({ default: 'AddNewRoute' });
    await expect(loadDetailsRoute()).resolves.toMatchObject({ default: 'DetailsRoute' });
  });

  it('prefetches both routes, which then resolve from the module cache', async () => {
    await prefetchItemRoutes();
    await prefetchItemRoutes();

    expect(evaluated).toEqual({ addNew: 1, details: 1 });
  });
});
