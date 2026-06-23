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
      expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
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
