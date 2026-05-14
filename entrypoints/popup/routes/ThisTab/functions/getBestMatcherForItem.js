// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';

/**
* Returns the highest matcher type value from the item's URIs that matches the given tab URL.
* Higher values represent more specific matches (EXACT > START_WITH > HOST > DOMAIN).
* @param {Object} item - The item containing content.uris.
* @param {string} tabUrl - The current tab URL.
* @return {number} The highest matching matcher value, or -1 when no URI matches.
*/
const getBestMatcherForItem = (item, tabUrl) => {
  if (!item?.content?.uris || !Array.isArray(item.content.uris) || item.content.uris.length <= 0) {
    return -1;
  }

  if (!URIMatcher.isText(tabUrl) || tabUrl.length <= 0) {
    return -1;
  }

  let bestMatcher = -1;

  for (const uri of item.content.uris) {
    const { matcher, text } = uri || {};

    if (
      !Number.isInteger(matcher) ||
      matcher < URIMatcher.M_DOMAIN_TYPE ||
      matcher > URIMatcher.M_EXACT_TYPE
    ) {
      continue;
    }

    if (matcher <= bestMatcher) {
      continue;
    }

    if (!URIMatcher.isText(text) || text.length <= 0) {
      continue;
    }

    let isValidUrl = false;

    try {
      isValidUrl = URIMatcher.isUrl(text, true);
    } catch {
      isValidUrl = false;
    }

    if (!isValidUrl) {
      continue;
    }

    const matcherFn = URIMatcher.MATCHER_FUNCTIONS[matcher];

    if (!matcherFn) {
      continue;
    }

    let matched = false;

    try {
      matched = matcherFn(text, tabUrl, true);
    } catch {
      matched = false;
    }

    if (matched) {
      bestMatcher = matcher;

      if (bestMatcher === URIMatcher.M_EXACT_TYPE) {
        break;
      }
    }
  }

  return bestMatcher;
};

export default getBestMatcherForItem;
