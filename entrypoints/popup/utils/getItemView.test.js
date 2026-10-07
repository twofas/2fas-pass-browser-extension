// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/models/itemModels/Login/views/ItemView', () => ({ default: 'LoginItem' }));
vi.mock('@/models/itemModels/SecureNote/views/ItemView', () => ({ default: 'NoteItem' }));
vi.mock('@/models/itemModels/PaymentCard/views/ItemView', () => ({ default: 'CardItem' }));
vi.mock('@/models/itemModels/Wifi/views/ItemView', () => ({ default: 'WifiItem' }));

import getItemView from './getItemView';

describe('getItemView', () => {
  it.each([
    ['login', 'LoginItem'],
    ['secureNote', 'NoteItem'],
    ['paymentCard', 'CardItem'],
    ['wifi', 'WifiItem']
  ])('returns the %s list row view', (contentType, view) => {
    expect(getItemView(contentType)).toBe(view);
  });

  it('returns null for an unknown type', () => {
    expect(getItemView('unknown')).toBeNull();
  });
});
