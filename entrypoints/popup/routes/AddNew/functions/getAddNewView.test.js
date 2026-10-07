// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/models/itemModels/Login/views/AddNewView', () => ({ default: 'LoginAddNew' }));
vi.mock('@/models/itemModels/SecureNote/views/AddNewView', () => ({ default: 'NoteAddNew' }));
vi.mock('@/models/itemModels/PaymentCard/views/AddNewView', () => ({ default: 'CardAddNew' }));
vi.mock('@/models/itemModels/Wifi/views/AddNewView', () => ({ default: 'WifiAddNew' }));

import getAddNewView from './getAddNewView';

describe('getAddNewView', () => {
  it.each([
    ['login', 'LoginAddNew'],
    ['secureNote', 'NoteAddNew'],
    ['paymentCard', 'CardAddNew'],
    ['wifi', 'WifiAddNew']
  ])('returns the %s add-new view', (contentType, view) => {
    expect(getAddNewView(contentType)).toBe(view);
  });

  it('returns null for an unknown type', () => {
    expect(getAddNewView(undefined)).toBeNull();
  });
});
