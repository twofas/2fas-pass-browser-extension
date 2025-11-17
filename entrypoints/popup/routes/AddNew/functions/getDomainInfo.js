// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToAllFrames, getLastActiveTab } from '@/partials/functions';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready';

/** 
* Function to get domain information.
* @async
* @return {Promise<Object>} The domain information.
*/
const getDomainInfo = async () => {
  let framesInfo;
  const data = {
    minLength: null,
    maxLength: null,
    pattern: null,
    url: null
  };
  const onCatch = () => data;
  const tab = await getLastActiveTab(onCatch);

  if (!tab) {
    return data;
  }

  data.url = tab.url;

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
