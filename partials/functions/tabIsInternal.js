// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import correctProtocols from '@/constants/correctProtocols';

/** 
* Checks if a tab is an internal tab (e.g. chrome://settings, chrome://extensions, etc.).
* @param {Object} tab - The tab object to check.
* @return {boolean} Returns true if the tab is internal, otherwise false.
*/
const tabIsInternal = tab => {
  let internal = false;
  
  try {
    const url = new URL(tab?.url);
    internal = !correctProtocols.includes(url.protocol);
  } catch {
    internal = true;
  }
  
  return internal;
};

export default tabIsInternal;
