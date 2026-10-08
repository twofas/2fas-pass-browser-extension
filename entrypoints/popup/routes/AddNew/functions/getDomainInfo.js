// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import readPasswordRules from './readPasswordRules';

/**
* Function to get the password rules (minlength, maxlength, pattern) of the page in a tab.
* Reads the top frame with one injected function instead of injecting the content script.
* @async
* @param {Object} tab - The tab to read, from getLastActiveTab.
* @return {Promise<Object>} The password rules; null values when the page has none or cannot be read.
*/
const getDomainInfo = async tab => {
  const data = {
    minLength: null,
    maxLength: null,
    pattern: null
  };

  if (!tab?.id) {
    return data;
  }

  let results;

  try {
    results = await browser.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] },
      func: readPasswordRules,
      injectImmediately: true
    });
  } catch {
    return data;
  }

  const rules = Array.isArray(results) ? results[0]?.result : null;

  if (!rules) {
    return data;
  }

  data.minLength = rules.minLength || null;
  data.maxLength = rules.maxLength || null;
  data.pattern = rules.pattern || null;

  return data;
};

export default getDomainInfo;
