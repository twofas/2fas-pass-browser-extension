// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const ENCRYPTION_KEYS = {
  DATA: {
    crypto: 'Data',
    sK: 'data_key'
  },
  ITEM_T3: {
    crypto: 'ItemT3',
    sK: 'item_key_t3'
  },
  ITEM_T3_NEW: {
    crypto: 'ItemT3New',
    sK: 'item_key_t3_new'
  },
  ITEM_T2: {
    crypto: 'ItemT2',
    sK: 'item_key_t2'
  },
  ITEM_NEW: {
    crypto: 'ItemNew',
    sK: 'item_key_new'
  }
};

Object.freeze(ENCRYPTION_KEYS);

export default ENCRYPTION_KEYS;
