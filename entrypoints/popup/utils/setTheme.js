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

  const browserName = import.meta.env.BROWSER || 'unknown';
  const platform = navigator.platform || '';
  const userAgent = navigator.userAgent || '';
  let osClass = 'os-unknown';

  if (platform.startsWith('Win') || userAgent.includes('Windows')) {
    osClass = 'os-windows';
  } else if (platform.startsWith('Mac') || userAgent.includes('Macintosh')) {
    osClass = 'os-macos';
  } else if (platform.startsWith('Linux') || userAgent.includes('Linux')) {
    osClass = 'os-linux';
  }

  document.documentElement.classList.add(`theme-${themeValueStorage}`, browserName, osClass);
  document.body.classList.add(`theme-${themeValueStorage}`, browserName, osClass);

  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 10);
};

export default setTheme;
