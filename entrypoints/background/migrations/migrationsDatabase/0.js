// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getBrowserInfo from '../../utils/getBrowserInfo';
import generatePersistentKeys from '../../utils/generatePersistentKeys';
import generateSecurityIcon from '../../utils/generateSecurityIcon';
import compressPublicKey from '@/partials/functions/compressPublicKey';
import generateLocalKey from '../../utils/generateLocalKey';

/** 
* Function to set default values for storage.
* @async
* @return {Promise<void>} A promise that resolves when the default storage is set.
*/
const defaultStorage = async () => {
  let storageData = await storage.getItems([ // FUTURE - Change maybe to browser.storage.local.get(null)
    'local:theme',
    'local:securityIcon',
    'local:browserInfo',
    'local:contextMenu',
    'local:logging',
    'local:nativePush',
    'local:allLoginsSort',
    'local:devices',
    'local:autoClearClipboard',
    'local:autoIdleLock',
    'local:savePrompt',
    'local:savePromptIgnoreDomains',
    'local:persistentPrivateKey',
    'local:persistentPublicKey',
    'local:lKey'
  ]);

  // Convert array of {key, value} to object { key: value }
  storageData = Object.fromEntries(storageData.map(item => [item.key.replace(/^local:/, ''), item.value]));

  const itemsToSet = [];
  const themeEnum = ['unset', 'light', 'dark'];
  const autoClearClipboardEnum = ['default', 1, 5, 15, 30];
  const autoIdleLockEnum = ['default', 1, 5, 15, 30, 60];
  const savePromptEnum = ['default', 'browser', 'none'];

  // PERSISTENT KEYS || SECURITY ICON
  if (
    !storageData?.persistentPrivateKey ||
    !storageData?.persistentPublicKey ||
    !storageData?.securityIcon ||
    !storageData?.securityIcon?.icon ||
    !storageData?.securityIcon?.colors
  ) {
    let persistentPublicKeyB64;

    if (
      !storageData?.persistentPrivateKey ||
      !storageData?.persistentPublicKey
    ) {
      persistentPublicKeyB64 = await generatePersistentKeys();
    } else {
      persistentPublicKeyB64 = storageData?.persistentPublicKey;
    }

    const persistentPublicKeyAB = Base64ToArrayBuffer(persistentPublicKeyB64);
    const compressedPersistentPublicKeyAB = await compressPublicKey(persistentPublicKeyAB);
    const compressedPersistentPublicKeyB64 = ArrayBufferToBase64(compressedPersistentPublicKeyAB);
    await generateSecurityIcon(compressedPersistentPublicKeyB64);

    // FUTURE - Change functions above to return objects
  }

  // BROWSER INFO
  if (
    !storageData?.browserInfo ||
    !storageData?.browserInfo?.name ||
    !storageData?.browserInfo?.browserName ||
    !storageData?.browserInfo?.browserVersion
  ) {
    let browserInfo = {};

    try {
      browserInfo = getBrowserInfo();
    } catch (e) {
      await CatchError(e);
    }

    itemsToSet.push({ key: 'local:browserInfo', value: browserInfo });
  }

  // THEME
  if (
    !storageData?.theme ||
    themeEnum.indexOf(storageData?.theme) === -1
  ) {
    itemsToSet.push({ key: 'local:theme', value: 'unset' }); // unset, light, dark
  }

  // L KEY
  if (
    !storageData?.lKey ||
    storageData?.lKey === null ||
    storageData?.lKey === undefined
  ) {
    let lKey;

    try {
      lKey = await generateLocalKey();
      itemsToSet.push({ key: 'local:lKey', value: lKey });
    } catch (e) {
      await CatchError(e);
    }
  }

  // CONTEXT MENU
  if (storageData?.contextMenu === undefined) {
    itemsToSet.push({ key: 'local:contextMenu', value: true });
  }

  // LOGGING
  if (storageData?.logging === undefined) {
    itemsToSet.push({ key: 'local:logging', value: false });
  }

  // NATIVE PUSH
  if (storageData?.nativePush === undefined) {
    itemsToSet.push({ key: 'local:nativePush', value: import.meta.env.BROWSER === 'safari' ? false : true });
  }

  // ALL LOGINS SORT
  if (storageData?.allLoginsSort === undefined) {
    itemsToSet.push({ key: 'local:allLoginsSort', value: false });
  }

  // DEVICES
  if (
    !storageData?.devices ||
    !Array.isArray(storageData?.devices)
  ) {
    itemsToSet.push({ key: 'local:devices', value: [] });
  }

  // AUTO CLEAR CLIPBOARD
  if (
    !storageData?.autoClearClipboard ||
    autoClearClipboardEnum.indexOf(storageData?.autoClearClipboard) === -1
  ) {
    itemsToSet.push({ key: 'local:autoClearClipboard', value: 'default' }); // never (default), 1, 5, 15, 30
  }

  // AUTO IDLE LOCK
  if (
    storageData?.autoIdleLock === undefined ||
    autoIdleLockEnum.indexOf(storageData?.autoIdleLock) === -1
  ) {
    itemsToSet.push({ key: 'local:autoIdleLock', value: config.defaultStorageIdleLock }); // never, 1, 5, 15 (default), 30, 60

    if (import.meta.env.BROWSER !== 'safari') {
      browser.idle.setDetectionInterval(config.defaultStorageIdleLock * 60);
    }
  }

  // SAVE PROMPT
  if (
    storageData?.savePrompt === undefined ||
    savePromptEnum.indexOf(storageData?.savePrompt) === -1
  ) {
    itemsToSet.push({ key: 'local:savePrompt', value: 'default' }); // default - pass, browser, none
  }

  // SAVE PROMPT IGNORE DOMAINS
  if (
    !storageData?.savePromptIgnoreDomains ||
    !Array.isArray(storageData?.savePromptIgnoreDomains)
  ) {
    itemsToSet.push({ key: 'local:savePromptIgnoreDomains', value: [] });
  }

  await storage.setItems(itemsToSet);

  // SET PASSWORD SAVING SAVING ENABLED TO FALSE
  if (browser?.privacy?.services?.passwordSavingEnabled && import.meta.env.BROWSER !== 'safari') {
    await browser.privacy.services.passwordSavingEnabled.set({ value: false });
  }
};

export default defaultStorage;
