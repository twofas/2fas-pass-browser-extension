// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils', async importOriginal => ({
  ...(await importOriginal()),
  isSavePromptSenderEligible: vi.fn(async () => true)
}));

import onPromptMessage from './onPromptMessage';
import getLocalKeyId from '../utils/getLocalKeyId';

const KEY = 'q83vEjRWeJCrze8SNFZ4kKvN7xI0VniQq83vEjRWeJA=';

/**
* Sends a message through onPromptMessage and resolves with the response.
* @param {Object} request - The request.
* @param {Object} tabsInputData - The captured inputs.
* @return {Promise<Object>} The response.
*/
const send = (request, tabsInputData) => new Promise(resolve => {
  onPromptMessage({ target: REQUEST_TARGETS.BACKGROUND_PROMPT, ...request }, { tab: { id: 4 }, frameId: 0 }, resolve, tabsInputData);
});

describe('onPromptMessage — entries encrypted with an old local key', () => {
  let keyId;

  beforeEach(async () => {
    await storage.setItem('session:lKey', KEY);
    keyId = await getLocalKeyId(KEY);
  });

  it('refuses a PROMPT_INPUT of an old key with staleKey and does not store it', async () => {
    const tabsInputData = {};
    const response = await send({ action: REQUEST_ACTIONS.PROMPT_INPUT, data: { id: 'p', type: 'password', value: 'c', encrypted: true, keyId: 'old' } }, tabsInputData);

    expect(response).toEqual({ status: 'error', message: 'staleKey' });
    expect(tabsInputData[4]?.p).toBeUndefined();
  });

  it('stores a PROMPT_INPUT of the current key', async () => {
    const tabsInputData = {};
    const response = await send({ action: REQUEST_ACTIONS.PROMPT_INPUT, data: { id: 'p', type: 'password', value: 'c', encrypted: true, keyId } }, tabsInputData);

    expect(response.status).toBe('ok');
    expect(tabsInputData[4].p.keyId).toBe(keyId);
  });

  it('reports the current key id with a stored plaintext PROMPT_INPUT', async () => {
    const response = await send({ action: REQUEST_ACTIONS.PROMPT_INPUT, data: { id: 'u', type: 'username', value: 'jan', encrypted: false } }, {});

    expect(response).toEqual({ status: 'ok', keyId });
  });

  it('stores the current entries of a flush and reports staleKey for the old ones', async () => {
    const tabsInputData = {};
    const response = await send({
      action: REQUEST_ACTIONS.PROMPT_INPUT_FLUSH,
      data: [
        { id: 'u', type: 'username', value: 'jan', encrypted: false },
        { id: 'p', type: 'password', value: 'c', encrypted: true, keyId: 'old' }
      ]
    }, tabsInputData);

    expect(response).toEqual({ status: 'error', message: 'staleKey' });
    expect(Object.keys(tabsInputData[4])).toEqual(['u']);
  });
});
