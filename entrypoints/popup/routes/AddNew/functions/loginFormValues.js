// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { REQUEST_STRING_ACTIONS } from '@/constants';

/**
* Function to get the username field of the request: the trimmed typed value, or generating it in the mobile app when it is
* empty or blank.
* @param {string} value - The typed value.
* @return {{ value: string, action: string }} The request field.
*/
export const getLoginStringField = value => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';

  return trimmedValue
    ? { value: trimmedValue, action: REQUEST_STRING_ACTIONS.SET }
    : { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
};

/**
* Function to get the password field of the request: the typed password exactly as typed (never trimmed), or generating it
* in the mobile app when it is empty.
* @param {string} value - The typed password.
* @return {{ value: string, action: string }} The request field.
*/
export const getLoginPasswordField = value => (value
  ? { value, action: REQUEST_STRING_ACTIONS.SET }
  : { value: '', action: REQUEST_STRING_ACTIONS.GENERATE });
