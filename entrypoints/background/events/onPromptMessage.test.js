// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

const promptInput = vi.fn();
const isSavePromptSenderEligible = vi.fn();

vi.mock('../utils', () => ({
  promptInput: (...args) => promptInput(...args),
  isSavePromptSenderEligible: (...args) => isSavePromptSenderEligible(...args)
}));

import onPromptMessage from './onPromptMessage.js';
import { hasRecentSubmitIntent, resetSubmitIntents } from '../utils/savePrompt/submitIntents';

const PROMPT = REQUEST_TARGETS.BACKGROUND_PROMPT;

beforeEach(() => {
  vi.clearAllMocks();
  promptInput.mockResolvedValue(undefined);
  isSavePromptSenderEligible.mockResolvedValue(true);
});

describe('onPromptMessage — frame eligibility gating (finding #19)', () => {
  describe('GET_SAVE_PROMPT', () => {
    it('returns the eligibility verdict alongside the savePrompt setting', async () => {
      await storage.setItem('local:savePrompt', 'default_encrypted');
      isSavePromptSenderEligible.mockResolvedValue(true);
      const sendResponse = vi.fn();

      onPromptMessage({ action: REQUEST_ACTIONS.GET_SAVE_PROMPT, target: PROMPT }, { frameId: 0 }, sendResponse, {});

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok', data: 'default_encrypted', eligible: true });
    });

    it('reports eligible:false for an ineligible sub-frame', async () => {
      await storage.setItem('local:savePrompt', 'default');
      isSavePromptSenderEligible.mockResolvedValue(false);
      const sendResponse = vi.fn();

      onPromptMessage({ action: REQUEST_ACTIONS.GET_SAVE_PROMPT, target: PROMPT }, { frameId: 3, tab: { id: 7 }, url: 'https://other.com/' }, sendResponse, {});

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok', data: 'default', eligible: false });
    });
  });

  describe('PROMPT_INPUT', () => {
    const request = { action: REQUEST_ACTIONS.PROMPT_INPUT, target: PROMPT, data: { id: 'a', value: 'x' } };
    const sender = { frameId: 2, tab: { id: 7 }, url: 'https://login.example.com/' };

    it('stores the input when the sender frame is eligible', async () => {
      isSavePromptSenderEligible.mockResolvedValue(true);
      const sendResponse = vi.fn();

      onPromptMessage(request, sender, sendResponse, {});

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      expect(promptInput).toHaveBeenCalledTimes(1);
      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ status: 'ok' }));
    });

    it('drops the input (no promptInput) when the sender frame is ineligible', async () => {
      isSavePromptSenderEligible.mockResolvedValue(false);
      const sendResponse = vi.fn();

      onPromptMessage(request, sender, sendResponse, {});

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      expect(promptInput).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ status: 'error', message: 'Ineligible frame' });
    });
  });

  describe('PROMPT_INPUT_FLUSH', () => {
    const request = { action: REQUEST_ACTIONS.PROMPT_INPUT_FLUSH, target: PROMPT, data: [{ id: 'a', value: 'x' }] };
    const sender = { frameId: 2, tab: { id: 7 }, url: 'https://login.example.com/' };

    it('writes flushed inputs into tabsInputData when eligible', async () => {
      isSavePromptSenderEligible.mockResolvedValue(true);
      const tabsInputData = {};
      const sendResponse = vi.fn();

      onPromptMessage(request, sender, sendResponse, tabsInputData);

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      expect(tabsInputData[7]?.a).toEqual({ id: 'a', value: 'x' });
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('does not write flushed inputs when ineligible', async () => {
      isSavePromptSenderEligible.mockResolvedValue(false);
      const tabsInputData = {};
      const sendResponse = vi.fn();

      onPromptMessage(request, sender, sendResponse, tabsInputData);

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      expect(tabsInputData[7]).toBeUndefined();
      expect(sendResponse).toHaveBeenCalledWith({ status: 'error', message: 'Ineligible frame' });
    });
  });
});

// The content script reports a login form submitted by the user; the request sent right after it may carry the
// password in a form the page transformed.
describe('onPromptMessage — PROMPT_SUBMIT_INTENT', () => {
  const request = { action: REQUEST_ACTIONS.PROMPT_SUBMIT_INTENT, target: PROMPT, data: { url: 'https://spoofed.example' } };
  const sender = { frameId: 0, tab: { id: 7 }, url: 'https://www.facebook.com/login/?next=1' };

  beforeEach(() => {
    resetSubmitIntents();
  });

  it('records the submit for the origin of the sender frame, not the origin the message names', async () => {
    const sendResponse = vi.fn();

    onPromptMessage(request, sender, sendResponse, {});

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' }));
    expect(hasRecentSubmitIntent(7, 'https://www.facebook.com', Date.now())).toBe(true);
    expect(hasRecentSubmitIntent(7, 'https://spoofed.example', Date.now())).toBe(false);
  });

  it('does not record the submit of an ineligible frame', async () => {
    isSavePromptSenderEligible.mockResolvedValue(false);
    const sendResponse = vi.fn();

    onPromptMessage(request, { ...sender, frameId: 3, url: 'https://accounts.other.com/' }, sendResponse, {});

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ status: 'error', message: 'Ineligible frame' }));
    expect(hasRecentSubmitIntent(7, 'https://accounts.other.com', Date.now())).toBe(false);
  });

  it('refuses a message without a tab', () => {
    const sendResponse = vi.fn();

    onPromptMessage(request, { frameId: 0, url: 'https://www.facebook.com/' }, sendResponse, {});

    expect(sendResponse).toHaveBeenCalledWith({ status: 'error', message: 'Empty data' });
  });
});
