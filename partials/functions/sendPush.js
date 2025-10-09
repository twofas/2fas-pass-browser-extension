// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getKey from '@/partials/sessionStorage/getKey';
import compressPublicKey from '@/partials/functions/compressPublicKey';

/** 
* Sends a push notification to a device.
* @async
* @param {Object} device - The device object to send the notification to.
* @param {Object} [data={}] - The data to include in the notification.
* @return {Promise<Object>} The response from the push notification service.
*/
const sendPush = async (device, data = {}) => {
  if (!device || !device.id || !device?.uuid) {
    throw new TwoFasError(TwoFasError.internalErrors.fetchSendPushInvalidDevice, { additional: { func: 'sendPush' } });
  }

  let pkPersBe;

  try {
    const storagePkPersBe = await storage.getItem('local:persistentPublicKey');
    const storagePkPersBeAB = Base64ToArrayBuffer(storagePkPersBe);
    const storageCompressedPkPersBeAB = await compressPublicKey(storagePkPersBeAB);
    pkPersBe = ArrayBufferToBase64(storageCompressedPkPersBeAB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.fetchSendPushStorageGetPkPersBe, { event: e, additional: { func: 'sendPush' } });
  }

  let pkEpheBe;

  try {
    const pkEpheBeKey = await getKey('ephe_public_key', { uuid: device.uuid });
    const storagePkEpheBe = await storage.getItem(`session:${pkEpheBeKey}`);
    const storagePkEpheBeAB = Base64ToArrayBuffer(storagePkEpheBe);
    const storageCompressedPkEpheBeAB = await compressPublicKey(storagePkEpheBeAB);
    pkEpheBe = ArrayBufferToBase64(storageCompressedPkEpheBeAB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.fetchSendPushGetKey, { event: e, additional: { func: 'sendPush' } });
  }

  const body = {
    deviceId: device.id,
    scheme: config.scheme,
    data: {
      ...data,
      pkPersBe,
      pkEpheBe
    }
  };

  if (device?.fcmToken && device?.fcmToken?.length > 0 && device?.platform && device?.platform?.length > 0) {
    body.fcmToken = Base64ToString(device.fcmToken);
    body.fcmTargetType = device.platform;
  }

  let response;

  try {
    response = await fetch(`https://${import.meta.env.VITE_API_URL_ORIGIN}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new TwoFasError(
      TwoFasError.internalErrors.fetchSendPushResponseIsNotOk,
      { event: e, additional: { func: 'sendPush - fetch' } }
    );
  }

  let json;

  try {
    json = await response?.json();
  } catch (e) {
    throw new TwoFasError(
      TwoFasError.internalErrors.fetchSendPushResponseJsonParse,
      { event: e, additional: { func: 'sendPush - response.json' } }
    );
  }

  if (!response || !response.ok) {
    if (json?.firebaseErrorCode === 'UNREGISTERED') {
      return { error: 'UNREGISTERED' };
    }

    throw new TwoFasError(
      TwoFasError.internalErrors.fetchSendPushResponseIsNotOk,
      { event: response, additional: { func: 'sendPush - response' } }
    );
  }

  return json;
};

export default sendPush;
