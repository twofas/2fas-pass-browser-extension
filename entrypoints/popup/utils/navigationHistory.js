// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

let history = [];

/**
* Add a path to navigation history.
* Keeps only the last 5 paths.
* Only adds if the path is different from the last entry to avoid duplicates.
* @param {string} path - The pathname to add
*/
export const addToNavigationHistory = path => {
  if (history[history.length - 1] !== path) {
    history = [...history.slice(-4), path];
  }
};

/**
* Get the previous path from navigation history.
* @return {string|null} The previous path or null if not available
*/
export const getPreviousPath = () => {
  return history.length >= 2 ? history[history.length - 2] : null;
};