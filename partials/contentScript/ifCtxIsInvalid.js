// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to check if the context is invalid and execute a callback.
* @param {Object} ctx - The context object to check.
* @param {Function} cb - The callback function to execute if the context is invalid.
* @return {boolean} True if the context is invalid, false otherwise.
*/
const ifCtxIsInvalid = (ctx, cb) => {
  if (ctx?.isInvalid) {
    if (typeof cb === 'function') {
      try {
        cb();
      } catch {}
    }
    
    return true;
  }

  return false;
};

export default ifCtxIsInvalid;
