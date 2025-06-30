// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to lock certain keyboard shortcuts in production.
* @param {KeyboardEvent} e - The keyboard event object.
* @return {boolean} Whether the default action was prevented.
*/
const lockShortcuts = e => {
  if (import.meta.env.DEV) {
    return false;
  }

  if (e.ctrlKey) {
    if (
      e.key === 's' || // save
      e.key === 'p' || // print
      e.key === 'u' || // view source
      e.key === 'a' || // select all
      e.key === 'f' || // find
      e.key === 'g' // find
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
};

export default lockShortcuts;
