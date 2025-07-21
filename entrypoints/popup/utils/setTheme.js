// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to set the theme based on the stored value.
* @async
* @return {Promise<void>}
*/
const setTheme = async () => {
  let themeValueStorage;

  try {
    themeValueStorage = await storage.getItem('local:theme');
  } catch {
    themeValueStorage = 'unset';
  }

  if (!themeValueStorage || (themeValueStorage !== 'unset' && themeValueStorage !== 'light' && themeValueStorage !== 'dark')) {
    themeValueStorage = 'unset';
  }

  document.documentElement.classList.add(`theme-${themeValueStorage}`);
  document.body.classList.add(`theme-${themeValueStorage}`);

  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 10);
};

export default setTheme;
