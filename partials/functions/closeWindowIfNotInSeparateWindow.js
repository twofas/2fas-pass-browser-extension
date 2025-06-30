// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';

/** 
* Closes the window if it is not in a separate window.
* @async
* @param {boolean} separateWindow - Indicates if the popup is in a separate window.
* @return {Promise<void>}
*/
const closeWindowIfNotInSeparateWindow = async separateWindow => {
  if (separateWindow === undefined) {
    separateWindow = await popupIsInSeparateWindow();
  }

  if (
    window &&
    typeof window?.close === 'function' &&
    import.meta.env.BROWSER !== 'safari' &&
    !separateWindow
  ) {
    window.close();
  }
};

export default closeWindowIfNotInSeparateWindow;
