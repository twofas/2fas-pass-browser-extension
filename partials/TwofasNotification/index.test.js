// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendFrontEndPushAction = vi.fn();
const showFrontEndPush = vi.fn();
const showNativePush = vi.fn();
const showNativePushWithoutTimeout = vi.fn();
const storeNotificationFallback = vi.fn();

vi.mock('./functions', () => ({
  sendFrontEndPushAction: (...args) => sendFrontEndPushAction(...args),
  showFrontEndPush: (...args) => showFrontEndPush(...args),
  showNativePush: (...args) => showNativePush(...args),
  showNativePushWithoutTimeout: (...args) => showNativePushWithoutTimeout(...args),
  storeNotificationFallback: (...args) => storeNotificationFallback(...args)
}));

vi.mock('./TwofasNotification.scss', () => ({}));

import TwofasNotification from './index.js';

const NOTIFICATION = { Title: 'Error', Message: 'Failed to autofill. Please try again.' };

beforeEach(async () => {
  vi.clearAllMocks();
  await storage.removeItem('local:nativePush');
});

describe('TwofasNotification.show — front-end push fallback (finding #10)', () => {
  it('uses the native push channel when available and never stores a fallback', async () => {
    await storage.setItem('local:nativePush', true);

    await TwofasNotification.show(NOTIFICATION, 7, true);

    expect(showNativePush).toHaveBeenCalledWith(NOTIFICATION, true);
    expect(sendFrontEndPushAction).not.toHaveBeenCalled();
    expect(storeNotificationFallback).not.toHaveBeenCalled();
  });

  it('does not store a fallback when the in-page push is delivered', async () => {
    await storage.setItem('local:nativePush', false);
    sendFrontEndPushAction.mockResolvedValue(true);

    await TwofasNotification.show(NOTIFICATION, 7, true);

    expect(sendFrontEndPushAction).toHaveBeenCalledWith(NOTIFICATION, 7, true);
    expect(storeNotificationFallback).not.toHaveBeenCalled();
  });

  it('stores a fallback when the in-page push cannot be delivered', async () => {
    await storage.setItem('local:nativePush', false);
    sendFrontEndPushAction.mockResolvedValue(false);

    await TwofasNotification.show(NOTIFICATION, 7, true);

    expect(storeNotificationFallback).toHaveBeenCalledWith(7, NOTIFICATION, true);
  });

  it('does not touch the front-end push or fallback when there is no tab id', async () => {
    await storage.setItem('local:nativePush', false);

    await TwofasNotification.show(NOTIFICATION);

    expect(showFrontEndPush).toHaveBeenCalledWith(NOTIFICATION, true);
    expect(sendFrontEndPushAction).not.toHaveBeenCalled();
    expect(storeNotificationFallback).not.toHaveBeenCalled();
  });
});

describe('TwofasNotification.showWithoutTimeout — front-end push fallback (finding #10)', () => {
  it('stores a persistent fallback (timeout=false) when the in-page push cannot be delivered', async () => {
    await storage.setItem('local:nativePush', false);
    sendFrontEndPushAction.mockResolvedValue(false);

    await TwofasNotification.showWithoutTimeout(NOTIFICATION, 7);

    expect(sendFrontEndPushAction).toHaveBeenCalledWith(NOTIFICATION, 7, false);
    expect(storeNotificationFallback).toHaveBeenCalledWith(7, NOTIFICATION, false);
  });

  it('uses the native push channel when available', async () => {
    await storage.setItem('local:nativePush', true);

    await TwofasNotification.showWithoutTimeout(NOTIFICATION, 7);

    expect(showNativePushWithoutTimeout).toHaveBeenCalledWith(NOTIFICATION);
    expect(storeNotificationFallback).not.toHaveBeenCalled();
  });
});
