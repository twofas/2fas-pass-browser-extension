// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import PULL_REQUEST_TYPES from '@/entrypoints/popup/routes/Fetch/constants/PULL_REQUEST_TYPES';
import PULL_REQUEST_STATUSES from '@/entrypoints/popup/routes/Fetch/constants/PULL_REQUEST_STATUSES';
import { deleteLoginAccept, deleteLoginCancel } from './fetch/deleteLogin';
import { newLoginAdded, newLoginAddedInT1, newLoginCancel } from './fetch/newLogin';
import { passwordRequestAccept, passwordRequestCancel } from './fetch/passwordRequest';
import { updateLoginAddedInT1, updateLoginCancel, updateLoginUpdated } from './fetch/updateLogin';

/** 
* Handles the pull request action.
* @param {Object} json - The JSON object containing the pull request data.
* @param {ArrayBuffer} hkdfSaltAB - The salt for HKDF.
* @param {CryptoKey} sessionKeyForHKDF - The session key for HKDF.
* @param {CryptoKey} encryptionDataKeyAES - The AES encryption key for the data.
* @param {Object} state - The current state of the application.
* @return {Promise<Object>} The response object containing the result of the action.
*/
const handlePullRequestAction = async (json, hkdfSaltAB, sessionKeyForHKDF, encryptionDataKeyAES, state) => {
  let data;

  try {
    const { dataEnc } = json.payload;
    const dataEncAb = Base64ToArrayBuffer(dataEnc);
    const dataDecBytes = DecryptBytes(dataEncAb);
    const dataDec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: dataDecBytes.iv }, encryptionDataKeyAES, dataDecBytes.data);
    const dataString = ArrayBufferToString(dataDec);
    data = JSON.parse(dataString);
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionDataError, { event: e });
  }

  let closeData = {
    returnUrl: '',
    returnToast: {
      text: '',
      type: 'info'
    }
  };

  if (!data?.status || !data?.type || !state?.action) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionWrongData);
  }

  switch (state.action) {
    case PULL_REQUEST_TYPES.PASSWORD_REQUEST: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await passwordRequestCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ACCEPT: {
          closeData = await passwordRequestAccept(
            data,
            state,
            hkdfSaltAB,
            sessionKeyForHKDF,
            json.id
          );

          break;
        }

        default: {
          throw new TwoFasError(TwoFasError.errors.pullRequestActionPasswordRequestWrongStatus);
        }
      }

      break;
    }

    case PULL_REQUEST_TYPES.DELETE_LOGIN: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await deleteLoginCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ACCEPT: {
          closeData = await deleteLoginAccept(state, json.id);
          break;
        }

        default: {
          throw new TwoFasError(TwoFasError.errors.pullRequestActionDeleteLoginWrongStatus);
        }
      }

      break;
    }

    case PULL_REQUEST_TYPES.NEW_LOGIN: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await newLoginCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED_IN_T1: {
          closeData = await newLoginAddedInT1(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED: {
          closeData = await newLoginAdded(
            data,
            hkdfSaltAB,
            sessionKeyForHKDF,
            json.id
          );
          break;
        }

        default: {
          throw new TwoFasError(TwoFasError.errors.pullRequestActionNewLoginWrongStatus);
        }
      }

      break;
    }

    case PULL_REQUEST_TYPES.UPDATE_LOGIN: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await updateLoginCancel(state.data.loginId, json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED_IN_T1: {
          closeData = await updateLoginAddedInT1(state, json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.UPDATED: {
          closeData = await updateLoginUpdated(
            data,
            state,
            hkdfSaltAB,
            sessionKeyForHKDF,
            json.id
          );
          break;
        }

        default: {
          throw new TwoFasError(TwoFasError.errors.pullRequestActionUpdateLoginWrongStatus);
        }
      }

      break;
    }

    default: {
      throw new TwoFasError(TwoFasError.errors.pullRequestActionWrongAction);
    }
  }

  return closeData;
};

export default handlePullRequestAction;
