// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Clears the clipboard if the document has focus.
* @return {void} This function returns nothing.
*/
const clearClipboard = () => {
  if (document.hasFocus()) {
    try {
      navigator.clipboard.writeText('');
      return { status: 'ok' };
    } catch {
      return {
        status: 'error',
        message: 'Failed to clear clipboard'
      };
    }
  } else {
    return {
      status: 'error',
      message: 'Document does not have focus, clipboard not cleared'
    };
  }
};

export default clearClipboard;
