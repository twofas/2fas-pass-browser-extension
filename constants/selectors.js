// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const selectors = Object.freeze({
  notification: {
    container: 'div.twofas-pass-notification-container',
    notification: 'div.twofas-pass-notification-item'
  },
  matchingLogins: {
    el: '.twofas-pass-notification-item.twofas-pass-matching-logins'
  },
  savePrompt: {
    el: '.twofas-pass-notification-item.twofas-pass-save-prompt'
  },
  crossDomainDialog: {
    el: '.twofas-pass-cross-domain-dialog'
  }
});

export default selectors;
