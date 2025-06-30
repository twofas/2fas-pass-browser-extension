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
    } catch {}
  }
};

export default clearClipboard;
