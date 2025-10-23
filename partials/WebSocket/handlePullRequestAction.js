// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import PULL_REQUEST_TYPES from '@/constants/PULL_REQUEST_TYPES';
import PULL_REQUEST_STATUSES from '@/entrypoints/popup/routes/Fetch/constants/PULL_REQUEST_STATUSES';
import { deleteDataAccept, deleteDataCancel } from './fetch/deleteData';
import { addDataAdded, addDataAddedInAnotherVault, addDataAddedInT1, addDataCancel } from './fetch/addData';
import { sifRequestAccept, sifRequestCancel } from './fetch/sifRequest';
import { updateDataAddedInT1, updateDataAddedInAnotherVault, updateDataCancel, updateDataUpdated } from './fetch/updateData';
import { fullSyncAccept, fullSyncCancel } from './fetch/fullSync';

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

  console.log('HANDLE PULL REQUEST ACTION', state, data, json);

  if (!data?.status || !data?.type || !state?.action) {
    throw new TwoFasError(TwoFasError.errors.pullRequestActionWrongData);
  }

  switch (state.action) {
    case PULL_REQUEST_TYPES.SIF_REQUEST: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await sifRequestCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ACCEPT: {
          closeData = await sifRequestAccept(
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

    case PULL_REQUEST_TYPES.DELETE_DATA: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await deleteDataCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ACCEPT: {
          closeData = await deleteDataAccept(state, json.id);
          break;
        }

        default: {
          throw new TwoFasError(TwoFasError.errors.pullRequestActionDeleteLoginWrongStatus);
        }
      }

      break;
    }

    case PULL_REQUEST_TYPES.ADD_DATA: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await addDataCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED_IN_T1: {
          closeData = await addDataAddedInT1(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED_IN_ANOTHER_VAULT: {
          closeData = await addDataAddedInAnotherVault(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED: {
          closeData = await addDataAdded(
            data,
            state,
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

    case PULL_REQUEST_TYPES.UPDATE_DATA: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await updateDataCancel(state.data.deviceId, state.data.vaultId, state.data.itemId, json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED_IN_T1: {
          closeData = await updateDataAddedInT1(state, json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ADDED_IN_ANOTHER_VAULT: {
          closeData = await updateDataAddedInAnotherVault(state, json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.UPDATED: {
          closeData = await updateDataUpdated(
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

    case PULL_REQUEST_TYPES.FULL_SYNC: {
      switch (data.status) {
        case PULL_REQUEST_STATUSES.CANCEL: {
          closeData = await fullSyncCancel(json.id);
          break;
        }

        case PULL_REQUEST_STATUSES.ACCEPT: {
          await fullSyncAccept(
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
