// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';

/** 
* Function to generate the dropdown options for a login item.
* @param {Object} login - The login item data.
* @return {Array} The array of dropdown options.
*/
const generateDropdown = login => {
  if (!login) {
    return null;
  }

  const dO = [
    { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), id: login.id, type: 'details' }
  ];

  if (login?.securityType === SECURITY_TIER.HIGHLY_SECRET && login?.password && login?.password !== '') {
    dO.push({ value: 'forget', label: browser.i18n.getMessage('this_tab_more_forget_password'), id: login.id, type: 'forget' });
  }

  let uris = [];

  if (login?.uris && login?.uris?.length > 0) {
    uris = login.uris.filter(uri => uri && uri?.text && uri.text !== '' && URIMatcher.isText(uri.text) && URIMatcher.isUrl(uri.text, true));
  }

  if (uris && uris.length > 0) {
    dO.push({ value: 'uris:', label: `${browser.i18n.getMessage('this_tab_more_uris')}`, type: 'urisHeader' });

    try {
      login.uris.forEach(uri => {
        let uriText = uri?.text;
        uriText = URIMatcher.normalizeUrl(uriText);
        dO.push({ value: uriText, label: uriText, loginId: login.id });
      });
    } catch {}
  }

  return dO;
};

export default generateDropdown;
