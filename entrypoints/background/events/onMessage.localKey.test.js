// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Pages tag encrypted save prompt values with the key id served by GET_LOCAL_KEY; the background refuses values whose
// id differs from the id of the stored key. If the two ids were computed differently, encrypted mode would capture nothing.

import { describe, it, expect } from 'vitest';
import onMessage from './onMessage';
import getLocalKeyId from '../utils/getLocalKeyId';

const KEY = 'q83vEjRWeJCrze8SNFZ4kKvN7xI0VniQq83vEjRWeJA=';

describe('onMessage — GET_LOCAL_KEY', () => {
  it('serves the stored key together with its key id', async () => {
    await storage.setItem('session:lKey', KEY);

    const response = await new Promise(resolve => {
      onMessage({ action: REQUEST_ACTIONS.GET_LOCAL_KEY, target: REQUEST_TARGETS.BACKGROUND }, { id: browser.runtime.id }, resolve, { state: true }, [], {}, {});
    });

    expect(response).toEqual({ status: 'ok', data: KEY, keyId: await getLocalKeyId(KEY) });
  });
});
