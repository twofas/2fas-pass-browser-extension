// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to detect the default theme.
* @async
* @return {void}
*/
const detectDefaultTheme = async () => {
  let themeValueStorage;

  try {
    themeValueStorage = await storage.getItem('local:theme');
  } catch {
    themeValueStorage = 'unset';
  }

  if (!themeValueStorage || themeValueStorage === 'unset') {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeValue = isDarkMode ? 'dark' : 'light';

    try {
      await storage.setItem('local:theme', themeValue);
      themeValueStorage = themeValue;
    } catch {
      themeValueStorage = 'light';
    }
  }

  document.body.classList.add(`theme-${themeValueStorage}`);
};

export default detectDefaultTheme;
