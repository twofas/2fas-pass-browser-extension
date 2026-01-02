// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateNonce from '@/partials/functions/generateNonce';
import generateEncryptionAESKey from './utils/generateEncryptionAESKey';
import TwoFasWebSocket from '@/partials/WebSocket';
import { ENCRYPTION_KEYS, PULL_REQUEST_TYPES } from '@/constants';
import getItem from '../sessionStorage/getItem';
import isText from '@/partials/functions/isText';

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
      if (!state?.data || !state?.data?.contentType) {
        throw new TwoFasError(TwoFasError.errors.newLoginNoData);
      }

      switch (state.data.contentType) {
        case 'login': {
          if (!isText(state?.data?.content?.s_password?.value)) {
            data = {
              type: PULL_REQUEST_TYPES.ADD_DATA,
              data: state.data
            };
          } else {
            const [nonceP, encryptionPassNewKeyAES] = await Promise.all([
              generateNonce(),
              generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_NEW.crypto, sessionKeyForHKDF, true)
            ]);
            const passwordEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceP.ArrayBuffer }, encryptionPassNewKeyAES, StringToArrayBuffer(state.data.content.s_password.value));
            const passwordEncBytes = EncryptBytes(nonceP.ArrayBuffer, passwordEnc);
            const passwordEncBytesB64 = ArrayBufferToBase64(passwordEncBytes);

            state.data.content.s_password.value = passwordEncBytesB64;

            data = {
              type: PULL_REQUEST_TYPES.ADD_DATA,
              data: {
                ...state.data
              }
            };
          }

          break;
        }

        case 'secureNote': {
          if (!isText(state?.data?.content?.s_text)) {
            data = {
              type: PULL_REQUEST_TYPES.ADD_DATA,
              data: state.data
            };
          } else {
            const [nonceP, encryptionTextNewKeyAES] = await Promise.all([
              generateNonce(),
              generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_NEW.crypto, sessionKeyForHKDF, true)
            ]);
            const textEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceP.ArrayBuffer }, encryptionTextNewKeyAES, StringToArrayBuffer(state.data.content.s_text));
            const textEncBytes = EncryptBytes(nonceP.ArrayBuffer, textEnc);
            const textEncBytesB64 = ArrayBufferToBase64(textEncBytes);

            state.data.content.s_text = textEncBytesB64;

            data = {
              type: PULL_REQUEST_TYPES.ADD_DATA,
              data: {
                ...state.data
              }
            };
          }

          break;
        }

        case 'paymentCard': {
          if (!isText(state?.data?.content?.s_cardNumber) && !isText(state?.data?.content?.s_expirationDate) && !isText(state?.data?.content?.s_securityCode)) {
            data = {
              type: PULL_REQUEST_TYPES.ADD_DATA,
              data: state.data
            };
          } else {
            if (isText(state?.data?.content?.s_cardNumber)) {
              const [nonceCardNumber, encryptionCardNumberNewKeyAES] = await Promise.all([
                generateNonce(),
                generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_NEW.crypto, sessionKeyForHKDF, true)
              ]);
              const cardNumberEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceCardNumber.ArrayBuffer }, encryptionCardNumberNewKeyAES, StringToArrayBuffer(state.data.content.s_cardNumber));
              const cardNumberEncBytes = EncryptBytes(nonceCardNumber.ArrayBuffer, cardNumberEnc);
              const cardNumberEncBytesB64 = ArrayBufferToBase64(cardNumberEncBytes);

              state.data.content.s_cardNumber = cardNumberEncBytesB64;
            }

            if (isText(state?.data?.content?.s_expirationDate)) {
              const [nonceExpirationDate, encryptionExpirationDateNewKeyAES] = await Promise.all([
                generateNonce(),
                generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_NEW.crypto, sessionKeyForHKDF, true)
              ]);
              const expirationDateEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceExpirationDate.ArrayBuffer }, encryptionExpirationDateNewKeyAES, StringToArrayBuffer(state.data.content.s_expirationDate));
              const expirationDateEncBytes = EncryptBytes(nonceExpirationDate.ArrayBuffer, expirationDateEnc);
              const expirationDateEncBytesB64 = ArrayBufferToBase64(expirationDateEncBytes);

              state.data.content.s_expirationDate = expirationDateEncBytesB64;
            }

            if (isText(state?.data?.content?.s_securityCode)) {
              const [nonceSecurityCode, encryptionSecurityCodeNewKeyAES] = await Promise.all([
                generateNonce(),
                generateEncryptionAESKey(hkdfSaltAB, ENCRYPTION_KEYS.ITEM_NEW.crypto, sessionKeyForHKDF, true)
              ]);
              const securityCodeEnc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceSecurityCode.ArrayBuffer }, encryptionSecurityCodeNewKeyAES, StringToArrayBuffer(state.data.content.s_securityCode));
              const securityCodeEncBytes = EncryptBytes(nonceSecurityCode.ArrayBuffer, securityCodeEnc);
              const securityCodeEncBytesB64 = ArrayBufferToBase64(securityCodeEncBytes);

              state.data.content.s_securityCode = securityCodeEncBytesB64;
            }

            data = {
              type: PULL_REQUEST_TYPES.ADD_DATA,
              data: {
                ...state.data
              }
            };
          }

          break;
        };

        default: {
          throw new TwoFasError(TwoFasError.errors.newLoginWrongContentType);
        }
      }

      break;
    }

    case PULL_REQUEST_TYPES.UPDATE_DATA: {
      if (!state?.data || !state?.data?.content || !state?.data?.itemId || !state?.data?.contentType) {
        throw new TwoFasError(TwoFasError.errors.updateLoginWrongData);
      }

      switch (state.data.contentType) {
        case 'login': {
          if (!isText(state?.data?.content?.s_password?.value)) {
            const stateData = structuredClone(state.data);
            delete stateData?.deviceId;

            data = {
              type: PULL_REQUEST_TYPES.UPDATE_DATA,
              data: { ...stateData }
            };
          } else {
            const originalItem = await getItem(state.data.deviceId, state.data.vaultId, state.data.itemId);

            if (!originalItem) {
              throw new TwoFasError(TwoFasError.errors.pullRequestNoOriginalItem);
            }

            const keyName = originalItem.securityType === SECURITY_TIER.HIGHLY_SECRET
              ? ENCRYPTION_KEYS.ITEM_T2.crypto
              : originalItem.securityType === SECURITY_TIER.SECRET
                ? ENCRYPTION_KEYS.ITEM_T3.crypto
                : null;

            if (!keyName) {
              throw new TwoFasError(TwoFasError.errors.updateLoginWrongSecurityType);
            }

            const [nonceP, encryptionPassTierKeyAES] = await Promise.all([
              generateNonce(),
              generateEncryptionAESKey(hkdfSaltAB, keyName, sessionKeyForHKDF, true)
            ]);

            const passwordEnc = await crypto.subtle.encrypt(
              { name: 'AES-GCM', iv: nonceP.ArrayBuffer },
              encryptionPassTierKeyAES,
              StringToArrayBuffer(state.data.content.s_password.value)
            );
            const passwordEncBytes = EncryptBytes(nonceP.ArrayBuffer, passwordEnc);
            const passwordEncBytesB64 = ArrayBufferToBase64(passwordEncBytes);

            const stateData = structuredClone(state.data);
            delete stateData?.deviceId;
            stateData.content.s_password.value = passwordEncBytesB64;

            data = {
              type: PULL_REQUEST_TYPES.UPDATE_DATA,
              data: { ...stateData }
            };
          }

          break;
        }

        case 'secureNote': {
          if (!isText(state?.data?.content?.s_text)) {
            const stateData = structuredClone(state.data);
            delete stateData?.deviceId;

            data = {
              type: PULL_REQUEST_TYPES.UPDATE_DATA,
              data: { ...stateData }
            };
          } else {
            const originalItem = await getItem(state.data.deviceId, state.data.vaultId, state.data.itemId);

            if (!originalItem) {
              throw new TwoFasError(TwoFasError.errors.pullRequestNoOriginalItem);
            }

            const keyName = originalItem.securityType === SECURITY_TIER.HIGHLY_SECRET
              ? ENCRYPTION_KEYS.ITEM_T2.crypto
              : originalItem.securityType === SECURITY_TIER.SECRET
                ? ENCRYPTION_KEYS.ITEM_T3.crypto
                : null;

            if (!keyName) {
              throw new TwoFasError(TwoFasError.errors.updateLoginWrongSecurityType);
            }

            const [nonceT, encryptionTextTierKeyAES] = await Promise.all([
              generateNonce(),
              generateEncryptionAESKey(hkdfSaltAB, keyName, sessionKeyForHKDF, true)
            ]);

            const textEnc = await crypto.subtle.encrypt(
              { name: 'AES-GCM', iv: nonceT.ArrayBuffer },
              encryptionTextTierKeyAES,
              StringToArrayBuffer(state.data.content.s_text)
            );
            const textEncBytes = EncryptBytes(nonceT.ArrayBuffer, textEnc);
            const textEncBytesB64 = ArrayBufferToBase64(textEncBytes);

            const stateData = structuredClone(state.data);
            delete stateData?.deviceId;
            stateData.content.s_text = textEncBytesB64;

            data = {
              type: PULL_REQUEST_TYPES.UPDATE_DATA,
              data: { ...stateData }
            };
          }

          break;
        }

        case 'paymentCard': {
          const hasSifFields = isText(state?.data?.content?.s_cardNumber)
            || isText(state?.data?.content?.s_expirationDate)
            || isText(state?.data?.content?.s_securityCode);

          if (!hasSifFields) {
            const stateData = structuredClone(state.data);
            delete stateData?.deviceId;

            data = {
              type: PULL_REQUEST_TYPES.UPDATE_DATA,
              data: { ...stateData }
            };
          } else {
            const originalItem = await getItem(state.data.deviceId, state.data.vaultId, state.data.itemId);

            if (!originalItem) {
              throw new TwoFasError(TwoFasError.errors.pullRequestNoOriginalItem);
            }

            const keyName = originalItem.securityType === SECURITY_TIER.HIGHLY_SECRET
              ? ENCRYPTION_KEYS.ITEM_T2.crypto
              : originalItem.securityType === SECURITY_TIER.SECRET
                ? ENCRYPTION_KEYS.ITEM_T3.crypto
                : null;

            if (!keyName) {
              throw new TwoFasError(TwoFasError.errors.updateLoginWrongSecurityType);
            }

            const stateData = structuredClone(state.data);
            delete stateData?.deviceId;

            if (isText(state?.data?.content?.s_cardNumber)) {
              const [nonceCardNumber, encryptionCardNumberKeyAES] = await Promise.all([
                generateNonce(),
                generateEncryptionAESKey(hkdfSaltAB, keyName, sessionKeyForHKDF, true)
              ]);

              const cardNumberEnc = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonceCardNumber.ArrayBuffer },
                encryptionCardNumberKeyAES,
                StringToArrayBuffer(state.data.content.s_cardNumber)
              );
              const cardNumberEncBytes = EncryptBytes(nonceCardNumber.ArrayBuffer, cardNumberEnc);

              stateData.content.s_cardNumber = ArrayBufferToBase64(cardNumberEncBytes);
            }

            if (isText(state?.data?.content?.s_expirationDate)) {
              const [nonceExpirationDate, encryptionExpirationDateKeyAES] = await Promise.all([
                generateNonce(),
                generateEncryptionAESKey(hkdfSaltAB, keyName, sessionKeyForHKDF, true)
              ]);

              const expirationDateEnc = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonceExpirationDate.ArrayBuffer },
                encryptionExpirationDateKeyAES,
                StringToArrayBuffer(state.data.content.s_expirationDate)
              );
              const expirationDateEncBytes = EncryptBytes(nonceExpirationDate.ArrayBuffer, expirationDateEnc);

              stateData.content.s_expirationDate = ArrayBufferToBase64(expirationDateEncBytes);
            }

            if (isText(state?.data?.content?.s_securityCode)) {
              const [nonceSecurityCode, encryptionSecurityCodeKeyAES] = await Promise.all([
                generateNonce(),
                generateEncryptionAESKey(hkdfSaltAB, keyName, sessionKeyForHKDF, true)
              ]);

              const securityCodeEnc = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonceSecurityCode.ArrayBuffer },
                encryptionSecurityCodeKeyAES,
                StringToArrayBuffer(state.data.content.s_securityCode)
              );
              const securityCodeEncBytes = EncryptBytes(nonceSecurityCode.ArrayBuffer, securityCodeEnc);

              stateData.content.s_securityCode = ArrayBufferToBase64(securityCodeEncBytes);
            }

            data = {
              type: PULL_REQUEST_TYPES.UPDATE_DATA,
              data: { ...stateData }
            };
          }

          break;
        }

        default: {
          throw new TwoFasError(TwoFasError.errors.updateLoginWrongContentType);
        }
      }

      break;
    }

    case PULL_REQUEST_TYPES.FULL_SYNC: {
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
