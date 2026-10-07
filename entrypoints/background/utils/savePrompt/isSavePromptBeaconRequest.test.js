// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// prompt.js sends pending inputs on unload with navigator.sendBeacon() to
// https://<VITE_BEACON>.invalid. Chromium reports it as 'ping', Firefox and Safari
// as 'beacon' — both must reach the beacon branch of onWebRequest, and neither may
// be processed as a login submission.

import { describe, it, expect } from 'vitest';
import isSavePromptBeaconRequest, { isSavePromptBeaconType } from './isSavePromptBeaconRequest.js';

const beaconUrl = `https://${import.meta.env.VITE_BEACON}.invalid`;

describe('isSavePromptBeaconType', () => {
  it.each(['ping', 'beacon'])('treats %s as a beacon request type', type => {
    expect(isSavePromptBeaconType({ type })).toBe(true);
  });

  it.each(['main_frame', 'sub_frame', 'xmlhttprequest', 'other', undefined])('does not treat %s as a beacon request type', type => {
    expect(isSavePromptBeaconType({ type })).toBe(false);
  });

  it('handles missing details', () => {
    expect(isSavePromptBeaconType(undefined)).toBe(false);
  });
});

describe('isSavePromptBeaconRequest', () => {
  it('accepts the Chromium ping to the beacon URL', () => {
    expect(isSavePromptBeaconRequest({ type: 'ping', url: beaconUrl })).toBe(true);
  });

  it('accepts the Firefox / Safari beacon to the beacon URL', () => {
    expect(isSavePromptBeaconRequest({ type: 'beacon', url: `${beaconUrl}/` })).toBe(true);
  });

  it('rejects a beacon to any other URL', () => {
    expect(isSavePromptBeaconRequest({ type: 'beacon', url: 'https://analytics.example.com/collect' })).toBe(false);
  });

  it('rejects a look-alike host that only starts with the beacon URL', () => {
    expect(isSavePromptBeaconRequest({ type: 'ping', url: `${beaconUrl}.evil.com/` })).toBe(false);
    expect(isSavePromptBeaconRequest({ type: 'beacon', url: `${beaconUrl}:8443/` })).toBe(false);
  });

  it('rejects a malformed URL', () => {
    expect(isSavePromptBeaconRequest({ type: 'beacon', url: 'not a url' })).toBe(false);
  });

  it('rejects a login POST to the beacon host with another type', () => {
    expect(isSavePromptBeaconRequest({ type: 'xmlhttprequest', url: beaconUrl })).toBe(false);
  });
});
