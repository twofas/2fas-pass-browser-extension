// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Keywords to check in parent elements' class names, IDs, and data attributes
 * to identify non-login forms like newsletter, search, or subscription forms.
 */
const parentContextDeniedKeywords = Object.freeze([
  'newsletter',
  'search',
  'subscribe',
  'signup',
  'sign-up',
  'promo',
  'offer',
  'contact',
  'inquiry',
  'marketing',
  'notification',
  'alert',
  'banner',
  'footer-email',
  'mailing-list',
  'mailinglist'
]);

export default parentContextDeniedKeywords;
