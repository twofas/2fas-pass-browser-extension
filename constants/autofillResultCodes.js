// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const AUTOFILL_RESULT_CODES = Object.freeze({
  NO_INPUT_FIELDS: 'noInputFields', // content → background/popup: frame has no fillable inputs for the request
  NO_CREDENTIALS: 'noCredentials', // content → background: request carried neither username nor password
  CROSS_DOMAIN_DENIED: 'crossDomainDenied' // content → background/popup: cross-domain iframe autofill not permitted
});
