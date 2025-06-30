// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import PULL_REQUEST_TYPES from '@/entrypoints/popup/routes/Fetch/constants/PULL_REQUEST_TYPES';
import generateNonce from '@/partials/functions/generateNonce';
import generateEncryptionAESKey from './utils/generateEncryptionAESKey';
import TwoFasWebSocket from '@/partials/WebSocket';

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

  const encryptionDataKeyAES = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('Data'), sessionKeyForHKDF, false);

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
    case PULL_REQUEST_TYPES.PASSWORD_REQUEST: {
      if (!state?.data || !state?.data?.loginId) {
        throw new TwoFasError(TwoFasError.errors.passwordRequestNoLoginId);
      }

      data = {
        type: PULL_REQUEST_TYPES.PASSWORD_REQUEST,
        data: {
          loginId: state.data.loginId,
        }
      };

      break;
    }

    case PULL_REQUEST_TYPES.DELETE_LOGIN: {
      if (!state?.data || !state?.data?.loginId) {
        throw new TwoFasError(TwoFasError.errors.deleteLoginNoLoginId);
      }

      data = {
        type: PULL_REQUEST_TYPES.DELETE_LOGIN,
        data: {
          loginId: state.data.loginId,
        }
      };

      break;
    }

    case PULL_REQUEST_TYPES.NEW_LOGIN: {
      if (!state?.data) {
        throw new TwoFasError(TwoFasError.errors.newLoginNoData);
      }

      if (!state?.data?.password) {
        data = {
          type: PULL_REQUEST_TYPES.NEW_LOGIN,
          data: state.data
        };
      } else {
        const nonceP = generateNonce();
        const encryptionPassNewKeyAES = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassNew'), sessionKeyForHKDF, true);
        const passwordEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceP.ArrayBuffer }, encryptionPassNewKeyAES, StringToArrayBuffer(state.data.password));
        const passwordEncBytes = EncryptBytes(nonceP.ArrayBuffer, passwordEnc);
        const passwordEncBytesB64 = ArrayBufferToBase64(passwordEncBytes);

        delete state.data.password;

        data = {
          type: PULL_REQUEST_TYPES.NEW_LOGIN,
          data: {
            ...state.data,
            passwordEnc: passwordEncBytesB64
          }
        };
      }

      break;
    }

    case PULL_REQUEST_TYPES.UPDATE_LOGIN: {
      if (!state?.data || !state?.data?.loginId || (!state?.data?.securityType && !Number.isInteger(state?.data?.securityType))) { // FUTURE - Check if one of the update fields is existing
        throw new TwoFasError(TwoFasError.errors.updateLoginWrongData);
      }

      if (!state?.data?.password && (state?.data?.password !== '')) {
        const stateData = structuredClone(state.data);
        
        delete stateData?.password;
        delete stateData.deviceId;

        stateData.id = stateData.loginId;
        delete stateData.loginId;

        data = {
          type: PULL_REQUEST_TYPES.UPDATE_LOGIN,
          data: {
            ...stateData
          }
        };
      } else {
        const nonceP = generateNonce();
        let encryptionPassTierKeyAES;

        if (state.data.securityType === 1) { // Tier 2
          encryptionPassTierKeyAES = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassT2'), sessionKeyForHKDF, true);
        } else if (state.data.securityType === 2) { // Tier 3
          encryptionPassTierKeyAES = await generateEncryptionAESKey(hkdfSaltAB, StringToArrayBuffer('PassT3'), sessionKeyForHKDF, true);
        } else {
          throw new TwoFasError(TwoFasError.errors.updateLoginWrongSecurityType);
        }

        const passwordEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceP.ArrayBuffer }, encryptionPassTierKeyAES, StringToArrayBuffer(state.data.password));
        const passwordEncBytes = EncryptBytes(nonceP.ArrayBuffer, passwordEnc);
        const passwordEncBytesB64 = ArrayBufferToBase64(passwordEncBytes);

        const stateData = structuredClone(state.data);
        delete stateData?.deviceId;
        
        stateData.id = stateData.loginId;
        delete stateData?.loginId;
        
        stateData.passwordEnc = passwordEncBytesB64;
        delete state?.data?.password;
        delete stateData?.password;

        data = {
          type: PULL_REQUEST_TYPES.UPDATE_LOGIN,
          data: {
            ...stateData
          }
        };
      }

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
