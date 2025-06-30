// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Check if the variable is a text.
* @param {any} variable - The variable to check.
* @return {boolean} Returns true if the variable is a text, otherwise false.
*/
const isText = variable => {
  if (typeof variable === 'string' || variable instanceof String) {
    return true;
  }

  return false;
};

export default isText;
