// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const addNewOptions = Object.freeze([
  { value: '/add-new/Login', label: browser.i18n.getMessage('login'), item: 'Login' },
  { value: '/add-new/SecureNote', label: browser.i18n.getMessage('secure_note'), item: 'SecureNote' }
]);

export default addNewOptions;
