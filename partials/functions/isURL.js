// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { URL_REGEX } from '@/constants';

/** 
* Check if a string is a valid URL.
* @param {string} str - The string to check.
* @return {boolean} Returns true if the string is a valid URL, otherwise false.
*/
const isURL = str => {
  return URL_REGEX.test(str);
};

export default isURL;
