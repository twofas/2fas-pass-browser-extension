// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';
import realIsProcessableWebRequestFrame from '../utils/savePrompt/isProcessableWebRequestFrame.js';

const getConfiguredBoolean = vi.fn();
const { waitForTabInputDataMock } = vi.hoisted(() => ({ waitForTabInputDataMock: vi.fn() }));

// Real frame gate (the subject of finding #19); stub the rest of the heavy pipeline.
vi.mock('../utils', () => ({
  checkDomainOnIgnoredList: vi.fn(),
  getValuesFromTabsInputData: vi.fn(),
  checkServicesData: vi.fn(),
  savePromptAction: vi.fn(),
  cleanTabsInputData: vi.fn(),
  addSavePromptAction: vi.fn(),
  checkFormData: vi.fn(),
  isProcessableWebRequestFrame: (...args) => realIsProcessableWebRequestFrame(...args),
  waitForTabInputData: (...args) => waitForTabInputDataMock(...args)
}));

vi.mock('@/partials/sessionStorage/configured/getConfiguredBoolean', () => ({
  default: (...args) => getConfiguredBoolean(...args)
}));

vi.mock('@/constants', () => ({
  ignoredSavePromptUrls: [],
  ignoredSavePromptRequestBodyTexts: []
}));

vi.mock('@/partials/functions/isText', () => ({ default: () => true }));

import onWebRequest from './onWebRequest.js';

const TAB_ID = 7;

// Minimal POST that clears the base filters; frameType/initiator vary per test.
const postDetails = extra => ({
  tabId: TAB_ID,
  method: 'POST',
  url: 'https://api.example.com/login',
  requestBody: { formData: { u: ['a'] } },
  ...extra
});

const newTabsInputData = () => ({ [TAB_ID]: { someId: { id: 'someId', type: 'username', value: 'a', url: 'https://example.com' } } });

beforeEach(() => {
  vi.clearAllMocks();
  // getConfiguredBoolean=false makes onWebRequest return right after the frame gate,
  // so "was getConfiguredBoolean reached?" cleanly signals whether the gate passed.
  getConfiguredBoolean.mockResolvedValue(false);
  vi.spyOn(browser.tabs, 'get').mockResolvedValue({ id: TAB_ID, url: 'https://www.example.com/' });
});

describe('onWebRequest — frame gate (finding #19)', () => {
  it('passes the top document through the gate (Chromium frameType)', async () => {
    await onWebRequest(postDetails({ frameType: 'outermost_frame' }), newTabsInputData(), [], {});
    expect(getConfiguredBoolean).toHaveBeenCalled();
  });

  it('passes the top document through the gate (Firefox parentFrameId)', async () => {
    await onWebRequest(postDetails({ parentFrameId: -1 }), newTabsInputData(), [], {});
    expect(getConfiguredBoolean).toHaveBeenCalled();
  });

  it('passes a same-root-domain sub-frame POST through the gate', async () => {
    const details = postDetails({ frameType: 'sub_frame', initiator: 'https://login.example.com' });
    await onWebRequest(details, newTabsInputData(), [], {});
    expect(getConfiguredBoolean).toHaveBeenCalled();
  });

  it('rejects a cross-root-domain sub-frame POST at the gate (SSO widget)', async () => {
    const details = postDetails({ frameType: 'sub_frame', initiator: 'https://accounts.google.com' });
    await onWebRequest(details, newTabsInputData(), [], {});
    expect(getConfiguredBoolean).not.toHaveBeenCalled();
  });

  it('rejects a sub-frame POST with no resolvable frame origin (fail-closed)', async () => {
    const details = postDetails({ frameType: 'sub_frame' });
    await onWebRequest(details, newTabsInputData(), [], {});
    expect(getConfiguredBoolean).not.toHaveBeenCalled();
  });
});

describe('onWebRequest — beacon flush gate (finding #19)', () => {
  const beaconUrl = `https://${import.meta.env.VITE_BEACON}.invalid`;
  const beaconBody = inputs => ({ raw: [{ bytes: new TextEncoder().encode(JSON.stringify(inputs)).buffer }] });

  it('accepts a top-frame beacon and stores its inputs', async () => {
    const tabsInputData = {};
    const details = { type: 'ping', url: beaconUrl, tabId: TAB_ID, frameType: 'outermost_frame', requestBody: beaconBody([{ id: 'x', value: '1' }]) };
    await onWebRequest(details, tabsInputData, [], {});
    expect(tabsInputData[TAB_ID]?.x).toEqual({ id: 'x', value: '1' });
  });

  it('drops a cross-root-domain sub-frame beacon', async () => {
    const tabsInputData = {};
    const details = { type: 'ping', url: beaconUrl, tabId: TAB_ID, frameType: 'sub_frame', initiator: 'https://accounts.google.com', requestBody: beaconBody([{ id: 'x', value: '1' }]) };
    await onWebRequest(details, tabsInputData, [], {});
    expect(tabsInputData[TAB_ID]).toBeUndefined();
  });

  it('accepts a same-root-domain sub-frame beacon', async () => {
    const tabsInputData = {};
    const details = { type: 'ping', url: beaconUrl, tabId: TAB_ID, frameType: 'sub_frame', initiator: 'https://login.example.com', requestBody: beaconBody([{ id: 'x', value: '1' }]) };
    await onWebRequest(details, tabsInputData, [], {});
    expect(tabsInputData[TAB_ID]?.x).toEqual({ id: 'x', value: '1' });
  });
});

// A recycled MV3 worker drops the in-memory tabsInputData; the submitting POST then
// arrives with an empty store. onWebRequest must give the content script's submit
// flush / unload beacon a window to repopulate it before bailing, otherwise the save
// prompt silently never fires (for both encrypted and unencrypted modes).
describe('onWebRequest — captured-input recovery after worker restart', () => {
  it('waits for the flush to repopulate an empty store, then continues past the gate', async () => {
    const tabsInputData = {}; // empty: simulates a worker restart between typing and submit

    // Simulate the submit flush / beacon arriving during the wait window.
    waitForTabInputDataMock.mockImplementation(async store => {
      store[TAB_ID] = { someId: { id: 'someId', type: 'username', value: 'a', url: 'https://example.com' } };
      return true;
    });

    await onWebRequest(postDetails({ frameType: 'outermost_frame' }), tabsInputData, [], {});

    expect(waitForTabInputDataMock).toHaveBeenCalled();
    expect(getConfiguredBoolean).toHaveBeenCalled();
  });

  it('bails when the store stays empty (no flush arrives within the wait)', async () => {
    const tabsInputData = {};
    waitForTabInputDataMock.mockResolvedValue(false);

    await onWebRequest(postDetails({ frameType: 'outermost_frame' }), tabsInputData, [], {});

    expect(waitForTabInputDataMock).toHaveBeenCalled();
    expect(getConfiguredBoolean).not.toHaveBeenCalled();
  });
});
