// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '../sessionStorage/getServices';
import decryptPassword from './decryptPassword';
import URIMatcher from '../URIMatcher';

/** 
* Function to check storage auto clear actions.
* @async
* @return {Promise<boolean>} A promise that resolves to true if an action is found, otherwise false.
*/
const checkStorageAutoClearActions = async () => {
  if (import.meta.env.BROWSER === 'safari') {
    return false;
  }

  const storageClearActions = await storage.getItem('session:autoClearActions');

  if (!storageClearActions || storageClearActions.length === 0) {
    return false;
  }
  
  // Get service with latest timestamp
  const action = storageClearActions.reduce((latest, action) => {
    return action.timestamp > latest.timestamp ? action : latest;
  }, storageClearActions[0]);

  if (!action || !action?.itemId || !action?.itemType) {
    await storage.setItem('session:autoClearActions', []);
    return false;
  }

  let serviceValue;

  if (action?.itemId === '00000000-0000-0000-0000-000000000000') {
    return 'addNew';
  }

  let services;

  try {
    services = await getServices();
  } catch {
    return false;
  }

  if (!services || services.length === 0) {
    await storage.setItem('session:autoClearActions', []);
    return false;
  }

  const service = services.find(s => s?.id === action?.itemId);

  if (!service) {
    await storage.setItem('session:autoClearActions', []);
    return false;
  }

  if (action.itemType === 'password') {
    try {
      serviceValue = await decryptPassword(service);
    } catch {
      await storage.setItem('session:autoClearActions', []);
      return;
    }
  } else if (action.itemType === 'uri') {
    const uris = service.uris || [];
    
    if (!uris || uris.length === 0) {
      await storage.setItem('session:autoClearActions', []);
      return false;
    }
    
    const uriTexts = uris.map(uri => uri?.text).filter(text => text);
    
    if (!uriTexts || uriTexts.length === 0) {
      await storage.setItem('session:autoClearActions', []);
      return false;
    }
    
    serviceValue = [];
    uriTexts.forEach(text => {
      serviceValue.push(text);

      try {
        const normalized = URIMatcher.normalizeUrl(text, true);

        if (normalized !== text) {
          serviceValue.push(normalized);
        }
      } catch {}
    });

    serviceValue = [...new Set(serviceValue)]; // unique values
    serviceValue = JSON.stringify(serviceValue);
  } else {
    serviceValue = service[action.itemType];
  }

  await storage.setItem('session:autoClearActions', []);

  return serviceValue;
};

export default checkStorageAutoClearActions;
