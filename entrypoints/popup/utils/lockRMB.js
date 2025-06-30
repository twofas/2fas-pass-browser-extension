// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to lock the right mouse button context menu.
* @param {MouseEvent} e - The mouse event object.
* @return {boolean} Whether the default action was prevented.
*/
const lockRMB = e => {
  if (import.meta.env.DEV) {
    return false;
  }

  e.preventDefault();
  return false;
};

export default lockRMB;
