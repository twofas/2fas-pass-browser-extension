// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { v4 as uuidv4 } from 'uuid';
import getKey from '@/partials/sessionStorage/getKey';
import compressPublicKey from '@/partials/functions/compressPublicKey';

/** 
* Function to generate ephemeral keys.
* @async
* @return {Promise<{ publicKey: string, uuid: string }>} A promise that resolves to the generated ephemeral keys.
*/
const generateEphemeralKeys = async () => {
  try {
    let uuid = uuidv4();

    let devices = await storage.getItem('local:devices');

    if (!devices) {
      devices = [];
    }

    let existingDevice = devices.find(device => device.uuid === uuid);
    
    while (existingDevice) {
      uuid = uuidv4();
      existingDevice = devices.find(device => device.uuid === uuid);
    }
    
    devices.push({ uuid, updatedAt: new Date().valueOf() });
    await storage.setItem('local:devices', devices);
  
    const keys = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
  
    const publicKeyArrayBuffer = await crypto.subtle.exportKey('spki', keys.publicKey);
    const privateKeyArrayBuffer = await crypto.subtle.exportKey('pkcs8', keys.privateKey);

    const compressedPublicKeyAB = await compressPublicKey(publicKeyArrayBuffer);
    const compressedPublicKeyB64 = ArrayBufferToBase64(compressedPublicKeyAB);

    const publicKey = ArrayBufferToBase64(publicKeyArrayBuffer);
    const privateKey = ArrayBufferToBase64(privateKeyArrayBuffer);
    
    const publicKeyKey = await getKey('ephe_public_key', { uuid });
    const privateKeyKey = await getKey('ephe_private_key', { uuid });
    
    await storage.setItems([
      { key: `session:${publicKeyKey}`, value: publicKey },
      { key: `session:${privateKeyKey}`, value: privateKey }
    ]);

    return {
      publicKey: compressedPublicKeyB64,
      uuid
    };
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateEphemeralKeys, { event: e });
  }
};

export default generateEphemeralKeys;
