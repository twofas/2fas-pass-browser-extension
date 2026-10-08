// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/models/itemModels/Login/views/DetailsView', () => ({ default: 'LoginDetails' }));
vi.mock('@/models/itemModels/SecureNote/views/DetailsView', () => ({ default: 'NoteDetails' }));
vi.mock('@/models/itemModels/PaymentCard/views/DetailsView', () => ({ default: 'CardDetails' }));
vi.mock('@/models/itemModels/Wifi/views/DetailsView', () => ({ default: 'WifiDetails' }));

import getDetailsView from './getDetailsView';

describe('getDetailsView', () => {
  it.each([
    ['login', 'LoginDetails'],
    ['secureNote', 'NoteDetails'],
    ['paymentCard', 'CardDetails'],
    ['wifi', 'WifiDetails']
  ])('returns the %s details view', (contentType, view) => {
    expect(getDetailsView(contentType)).toBe(view);
  });

  it('returns null for an unknown type', () => {
    expect(getDetailsView(null)).toBeNull();
  });
});
