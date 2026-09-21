// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { createElement } from 'react';

import ConnectionErrorDefault from './ConnectionError/default.jsx';
import ConnectionTimeoutDefault from './ConnectionTimeout/default.jsx';
import ContinueUpdateDefault from './ContinueUpdate/default.jsx';
import PushNotificationDefault from './PushNotification/default.jsx';
import NoMatchDefault from '../../ThisTab/components/NoMatch/default.jsx';

const { LottieLight } = vi.hoisted(() => ({
  LottieLight: vi.fn(() => null)
}));

vi.mock('lottie-react', () => ({ LottieLight }));

const animationFor = url => ({ v: '5.7.0', nm: url });

const cases = [
  { name: 'ConnectionError', component: ConnectionErrorDefault, light: '/animations/error.json', dark: '/animations/error-dark.json', loop: false },
  { name: 'ConnectionTimeout', component: ConnectionTimeoutDefault, light: '/animations/clock.json', dark: '/animations/clock-dark.json', loop: false },
  { name: 'ContinueUpdate', component: ContinueUpdateDefault, light: '/animations/push-2.json', dark: '/animations/push-2-dark.json', loop: true },
  { name: 'PushNotification', component: PushNotificationDefault, light: '/animations/push.json', dark: '/animations/push-dark.json', loop: true },
  { name: 'NoMatch', component: NoMatchDefault, light: '/animations/box.json', dark: '/animations/box-dark.json', loop: false }
];

describe('default Lottie animations', () => {
  beforeEach(() => {
    vi.spyOn(browser.runtime, 'getURL').mockImplementation(path => `chrome-extension://test${path}`);
    vi.stubGlobal('fetch', vi.fn(async url => ({ json: async () => animationFor(url) })));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(cases)('$name renders the light engine with the fetched animation as src', async ({ component, light, dark, loop }) => {
    render(createElement(component));

    await waitFor(() => {
      expect(LottieLight).toHaveBeenCalledTimes(2);
    });

    const props = LottieLight.mock.calls.map(call => call[0]);

    expect(props[0]).toEqual(expect.objectContaining({ src: animationFor(`chrome-extension://test${light}`), autoplay: true, loop }));
    expect(props[1]).toEqual(expect.objectContaining({ src: animationFor(`chrome-extension://test${dark}`), autoplay: true, loop }));
    expect(props.every(p => !('animationData' in p))).toBe(true);
  });
});
