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

  const isModifierPressed = e.metaKey || e.ctrlKey;

  if (isModifierPressed) {
    if (
      e.key === 's' || // save
      e.key === 'p' || // print
      e.key === 'u' || // view source
      e.key === 'f' || // find
      e.key === 'g' // find
    ) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (e.key === 'a') {
      const tagName = e.target.tagName.toLowerCase();
      
      if (tagName !== 'input' && tagName !== 'textarea' && e.target.contentEditable !== 'true') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }
};

export default lockShortcuts;
