// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateNonce from '@/partials/functions/generateNonce';
import generateEncryptionAESKey from './utils/generateEncryptionAESKey';
import TwoFasWebSocket from '@/partials/WebSocket';
import { ENCRYPTION_KEYS, PULL_REQUEST_TYPES } from '@/constants';

/** 
* Handles the pull request action.
* @param {Object} json - The JSON object containing the pull request data.
* @param {ArrayBuffer} hkdfSaltAB - The salt for HKDF.
* @param {CryptoKey} sessionKeyForHKDF - The session key for HKDF.
* @param {Object} state - The current state of the application.
* @return {Promise<Object>} The response object containing the result of the action.
*/
const handlePullRequest = async (json, hkdfSaltAB, sessionKeyForHKDF, state) => {
  const { newSessionIdEnc } = json.payload;
  let newSessionIdDec_B64;

  const newSessionIdEncAB = Base64ToArrayBuffer(newSessionIdEnc);
  const newSessionIdDecBytes = DecryptBytes(newSessionIdEncAB);

  const encryptionDataKeyAES = await generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.DATA.crypto, sessionKeyForHKDF, false);

  try {
    const newSessionIdDec_AB = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: newSessionIdDecBytes.iv }, encryptionDataKeyAES, newSessionIdDecBytes.data);
    newSessionIdDec_B64 = ArrayBufferToBase64(newSessionIdDec_AB);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.decryptNewSessionId, { event: e });
  }

  const nonceD = generateNonce();
  let data;

  if (!state?.action) {
    throw new TwoFasError(TwoFasError.errors.pullRequestNoAction);
  }

  switch (state.action) {
    case PULL_REQUEST_TYPES.SIF_REQUEST: {
      console.log('PULL_REQUEST_TYPES.SIF_REQUEST', state.data);

      if (!state?.data || !state?.data?.itemId) {
        throw new TwoFasError(TwoFasError.errors.passwordRequestNoLoginId);
      }

      data = {
        type: PULL_REQUEST_TYPES.SIF_REQUEST,
        data: {
          vaultId: state.data.vaultId,
          itemId: state.data.itemId,
          contentType: state.data.contentType
        }
      };

      break;
    }

    case PULL_REQUEST_TYPES.DELETE_DATA: {
      if (!state?.data || !state?.data?.itemId) {
        throw new TwoFasError(TwoFasError.errors.deleteLoginNoLoginId);
      }

      data = {
        type: PULL_REQUEST_TYPES.DELETE_DATA,
        data: {
          vaultId: state.data.vaultId,
          itemId: state.data.itemId,
          contentType: state.data.contentType
        }
      };

      break;
    }

    case PULL_REQUEST_TYPES.ADD_DATA: {
      if (!state?.data) {
        throw new TwoFasError(TwoFasError.errors.newLoginNoData);
      }

      if (!state?.data?.password) {
        data = {
          type: PULL_REQUEST_TYPES.ADD_DATA,
          data: state.data
        };
      } else {
        const [nonceP, encryptionPassNewKeyAES] = await Promise.all([
          generateNonce(),
          generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_NEW.crypto, sessionKeyForHKDF, true)
        ]);
        const passwordEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceP.ArrayBuffer }, encryptionPassNewKeyAES, StringToArrayBuffer(state.data.password));
        const passwordEncBytes = EncryptBytes(nonceP.ArrayBuffer, passwordEnc);
        const passwordEncBytesB64 = ArrayBufferToBase64(passwordEncBytes);

        delete state.data.password;

        data = {
          type: PULL_REQUEST_TYPES.ADD_DATA,
          data: {
            ...state.data,
            passwordEnc: passwordEncBytesB64
          }
        };
      }

      break;
    }

    case PULL_REQUEST_TYPES.UPDATE_DATA: {
      if (!state?.data || !state?.data?.content || !state?.data?.content?.id) { // FUTURE - Check if one of the update fields is existing
        throw new TwoFasError(TwoFasError.errors.updateLoginWrongData);
      }

      if (!state?.data?.password && (state?.data?.password !== '')) {
        const stateData = structuredClone(state.data);
        
        delete stateData?.password;
        delete stateData.deviceId;

        stateData.id = stateData.itemId;
        delete stateData.itemId;

        data = {
          type: PULL_REQUEST_TYPES.UPDATE_DATA,
          data: {
            ...stateData
          }
        };
      } else {
        const keyName = state.data.securityType === SECURITY_TIER.HIGHLY_SECRET ? ENCRYPTION_KEYS.ITEM_T2.crypto : state.data.securityType === SECURITY_TIER.SECRET ? ENCRYPTION_KEYS.ITEM_T3.crypto : null;

        if (!keyName) {
          throw new TwoFasError(TwoFasError.errors.updateLoginWrongSecurityType);
        }

        const [nonceP, encryptionPassTierKeyAES] = await Promise.all([
          generateNonce(),
          generateEncryptionAESKey(hkdfSaltAB, keyName, sessionKeyForHKDF, true)
        ]);

        const passwordEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceP.ArrayBuffer }, encryptionPassTierKeyAES, StringToArrayBuffer(state.data.password));
        const passwordEncBytes = EncryptBytes(nonceP.ArrayBuffer, passwordEnc);
        const passwordEncBytesB64 = ArrayBufferToBase64(passwordEncBytes);

        const stateData = structuredClone(state.data);
        delete stateData?.deviceId;
        
        stateData.id = stateData.itemId;
        delete stateData?.itemId;
        
        stateData.passwordEnc = passwordEncBytesB64;
        delete state?.data?.password;
        delete stateData?.password;

        data = {
          type: PULL_REQUEST_TYPES.UPDATE_DATA,
          data: {
            ...stateData
          }
        };
      }

      break;
    }

    case PULL_REQUEST_TYPES.FULL_SYNC: { // @TODO
      data = {
        type: PULL_REQUEST_TYPES.FULL_SYNC,
        data: {}
      };

      break;
    }

    default: {
      throw new TwoFasError(TwoFasError.errors.pullRequestWrongAction);
    }
  }

  const dataEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceD.ArrayBuffer }, encryptionDataKeyAES, StringToArrayBuffer(JSON.stringify(data)));
  const encryptedBytes = EncryptBytes(nonceD.ArrayBuffer, dataEnc);
  const encryptedBytesB64 = ArrayBufferToBase64(encryptedBytes);

  const socket = TwoFasWebSocket.getInstance();
  await socket.sendMessage({
    id: json.id,
    action: SOCKET_ACTIONS.PULL_REQUEST,
    payload: {
      dataEnc: encryptedBytesB64
    }
  });

  return {
    newSessionId: newSessionIdDec_B64,
    encryptionDataKeyAES
  };
};

export default handlePullRequest;
