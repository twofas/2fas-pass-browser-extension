// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Function to set default language value for storage.
 * @async
 * @return {Promise<void>} A promise that resolves when the default language is set.
 */
const defaultLanguage = async () => {
  const storageData = await browser.storage.local.get(null);

  const itemsToSet = [];
  const langEnum = ['default', 'en', 'pl'];

  if (
    storageData?.lang === undefined ||
    langEnum.indexOf(storageData?.lang) === -1
  ) {
    itemsToSet.push({ key: 'local:lang', value: 'default' });
  }

  await storage.setItems(itemsToSet);
};

export default defaultLanguage;
