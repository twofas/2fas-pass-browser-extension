// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import tryWindowClose from '../browserInfo/tryWindowClose';

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

  if (!separateWindow) {
    await tryWindowClose();
  }
};

export default closeWindowIfNotInSeparateWindow;
