// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from '@/partials/functions/sendMessageToAllFrames';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/**
* Function to get the password rules (minlength, maxlength, pattern) of the page in a tab.
* @async
* @param {Object} tab - The tab to read, from getLastActiveTab.
* @return {Promise<Object>} The password rules; null values when the page has none or cannot be read.
*/
const getDomainInfo = async tab => {
  let framesInfo;
  const data = {
    minLength: null,
    maxLength: null,
    pattern: null
  };

  if (!tab?.id) {
    return data;
  }

  try {
    await injectCSIfNotAlready(tab.id, REQUEST_TARGETS.CONTENT);
  } catch {
    return data;
  }

  try {
    framesInfo = await sendMessageToAllFrames(tab.id,
      {
        action: REQUEST_ACTIONS.GET_DOMAIN_INFO,
        target: REQUEST_TARGETS.CONTENT
      }
    );
  } catch {
    return data;
  }

  if (!framesInfo || !Array.isArray(framesInfo)) {
    return data;
  }

  const filteredFramesInfo = framesInfo.filter(Boolean);

  if (!filteredFramesInfo || filteredFramesInfo.length <= 0) {
    return data;
  }

  const tabInfo = filteredFramesInfo[0];

  if (!tabInfo) {
    return data;
  }

  if (tabInfo?.minLength) {
    try {
      data.minLength = tabInfo.minLength || null;
    } catch {}
  }

  if (tabInfo?.maxLength) {
    try {
      data.maxLength = tabInfo.maxLength || null;
    } catch {}
  }

  if (tabInfo?.pattern) {
    data.pattern = tabInfo.pattern;
  }

  return data;
};

export default getDomainInfo;
