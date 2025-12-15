// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { vi } from 'vitest';

// Mock the addNewOptions module to prevent browser.i18n.getMessage call at load time
vi.mock('@/constants/addNewOptions.js', () => ({
  default: Object.freeze([
    { value: '/add-new/Login', label: 'Login', item: 'Login' },
    { value: '/add-new/SecureNote', label: 'Secure Note', item: 'SecureNote' }
  ])
}));
