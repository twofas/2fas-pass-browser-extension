// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Creates a lookup of the popup view of each item type.
* @param {Object<string, Function>} viewsByContentType - The view component of each content type.
* @return {(contentType: string|null|undefined) => Function|null} Returns the view, or null for an unknown type.
*/
const createItemViewResolver = viewsByContentType => {
  const views = Object.freeze({ ...viewsByContentType });

  return contentType => {
    if (!contentType || !Object.hasOwn(views, contentType)) {
      return null;
    }

    return views[contentType];
  };
};

export default createItemViewResolver;
