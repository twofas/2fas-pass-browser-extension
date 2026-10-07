// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/models/itemModels/Login/views', () => ({ ItemView: 'LoginItem', AddNewView: 'LoginAddNew', DetailsView: 'LoginDetails' }));
vi.mock('@/models/itemModels/SecureNote/views', () => ({ ItemView: 'NoteItem', AddNewView: 'NoteAddNew', DetailsView: 'NoteDetails' }));
vi.mock('@/models/itemModels/PaymentCard/views', () => ({ ItemView: 'CardItem', AddNewView: 'CardAddNew', DetailsView: 'CardDetails' }));
vi.mock('@/models/itemModels/Wifi/views', () => ({ ItemView: 'WifiItem', AddNewView: 'WifiAddNew', DetailsView: 'WifiDetails' }));

import getItemViews from './getItemViews';

describe('getItemViews', () => {
  it.each([
    ['login', ['LoginItem', 'LoginAddNew', 'LoginDetails']],
    ['secureNote', ['NoteItem', 'NoteAddNew', 'NoteDetails']],
    ['paymentCard', ['CardItem', 'CardAddNew', 'CardDetails']],
    ['wifi', ['WifiItem', 'WifiAddNew', 'WifiDetails']]
  ])('returns the %s views', (contentType, [item, addNew, details]) => {
    expect(getItemViews(contentType)).toEqual({
      ItemComponent: item,
      AddNewComponent: addNew,
      DetailsComponent: details
    });
  });

  it('returns the same object on every call', () => {
    expect(getItemViews('login')).toBe(getItemViews('login'));
  });

  it.each([undefined, null, '', 'unknown'])('returns null for %s', contentType => {
    expect(getItemViews(contentType)).toBeNull();
  });
});
