// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/CatchError.js', () => ({ default: vi.fn() }));

import storeNotificationFallback from './storeNotificationFallback.js';

const NOTIFICATION = { Title: 'Error', Message: 'Failed to autofill. Please try again.' };

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem('session:notificationPending-7');
});

describe('storeNotificationFallback (finding #10)', () => {
  it('persists the notification under the per-tab session key', async () => {
    await storeNotificationFallback(7, NOTIFICATION, true);

    const stored = JSON.parse(await storage.getItem('session:notificationPending-7'));

    expect(stored).toEqual({ Title: 'Error', Message: 'Failed to autofill. Please try again.', timeout: true });
  });

  it('records timeout=false for persistent notifications', async () => {
    await storeNotificationFallback(7, NOTIFICATION, false);

    const stored = JSON.parse(await storage.getItem('session:notificationPending-7'));

    expect(stored.timeout).toBe(false);
  });

  it('defaults timeout to true when not provided', async () => {
    await storeNotificationFallback(7, NOTIFICATION);

    const stored = JSON.parse(await storage.getItem('session:notificationPending-7'));

    expect(stored.timeout).toBe(true);
  });

  it('does nothing when there is no tab id', async () => {
    await storeNotificationFallback(undefined, NOTIFICATION, true);

    expect(await storage.getItem('session:notificationPending-undefined')).toBeNull();
  });
});
