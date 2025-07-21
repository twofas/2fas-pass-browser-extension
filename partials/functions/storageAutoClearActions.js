// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '../sessionStorage/getServices';
import decryptPassword from './decryptPassword';
import URIMatcher from '../URIMatcher';

/** 
* Function to handle automatic clearing of the clipboard.
* @return {Promise<void>} A promise that resolves when the clipboard is cleared.
*/
const storageAutoClearActions = async () => {
  const storageClearActions = await storage.getItem('session:autoClearActions');

  if (!storageClearActions || storageClearActions.length === 0) {
    return;
  }

  let services;

  try {
    services = await getServices();
  } catch {
    return;
  }

  if (!services || services.length === 0) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  // Get service with latest timestamp
  const action = storageClearActions.reduce((latest, action) => {
    return action.timestamp > latest.timestamp ? action : latest;
  }, storageClearActions[0]);

  const service = services.find(s => s.id === action.itemId);

  if (!service) {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  let serviceValue, clipboardValue;

  if (action.itemType === 'password') {
    try {
      serviceValue = await decryptPassword(service);
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'uri') {
    serviceValue = service.uris || [];
  } else {
    serviceValue = service[action.itemType];
  }

  try {
    clipboardValue = await navigator.clipboard.readText();
  } catch {
    await storage.setItem('session:autoClearActions', []);
    return;
  }

  if (action.itemType === 'uri') {
    const uriFiltered = serviceValue.filter(uri => {
      let normalizedUrl;

      try {
        normalizedUrl = URIMatcher.normalizeUrl(uri.text);
      } catch {}

      return normalizedUrl === clipboardValue;
    });

    if (uriFiltered.length > 0) {
      await navigator.clipboard.writeText('');
    } else {
      await storage.setItem('session:autoClearActions', []);
    }
  }

  if (serviceValue === clipboardValue) {
    try {
      await navigator.clipboard.writeText('');
    } catch {}
  }

  await storage.setItem('session:autoClearActions', []);
};

export default storageAutoClearActions;
