// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { openPopupWindowInNewWindow, sendAutofillToTab } from '../utils';
import { SERVICE_REGEX, FETCH_REGEX } from '@/constants';

/** 
* Function to handle context menu click events.
* @async
* @param {Object} info - The context menu click event information.
* @param {Object} tab - The tab where the context menu was clicked.
* @return {Promise<boolean>} A promise that resolves to true if the context menu click is handled successfully, otherwise false.
*/
const onContextMenuClick = async (info, tab) => {
  const { menuItemId } = info;
  const serviceRegexTest = SERVICE_REGEX.exec(menuItemId);

  try {
    if (serviceRegexTest) {
      const serviceID = serviceRegexTest[1];
      await sendAutofillToTab(tab.id, serviceID);
      return true;
    }
  
    const fetchRegexTest = FETCH_REGEX.exec(menuItemId);
  
    if (fetchRegexTest) {
      const loginId = fetchRegexTest[1];
      const deviceId = fetchRegexTest[2];

      const data = encodeURIComponent(JSON.stringify({ action: 'passwordRequest', from: 'contextMenu', data: { loginId, deviceId } }));
      await openPopupWindowInNewWindow({ pathname: `/fetch/${data}` });
      return true;
    }
  
    switch (menuItemId) {
      case '2fas-pass-not-configured': {
        await openPopupWindowInNewWindow();
        return true;
      }
  
      case '2fas-pass-add-account': {
        await openPopupWindowInNewWindow({ pathname: '/add-new' });
        return true;
      }
  
      default: {
        return false;
      }
    }
  } catch (e) {
    await CatchError(e);
    return false;
  }
};

export default onContextMenuClick;
