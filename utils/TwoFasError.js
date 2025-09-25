// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Custom error class for TwoFas
* @extends Error
* @property {string} message - The error message.
* @property {string} params - The error parameters.
*/
class TwoFasError extends Error {
  constructor (errorObject = { message: TwoFasError.errors.unknownError.message, code: TwoFasError.errors.unknownError.code }, params) {
    super(params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TwoFasError);
    }

    this.name = 'TwoFasError';
    this.message = errorObject.message || TwoFasError.errors.unknownError.message;
    this.timestamp = Date.now().toString();
    this.code = errorObject.code || TwoFasError.errors.unknownError.code;
    this.apiLog = params?.apiLog || true;
    this.consoleLog = params?.consoleLog || true;
    this.event = params?.event || null;
    this.visibleErrorMessage = params?.visibleErrorMessage || null;
    this.additional = params?.additional || {};
  }

  static defaultErrorMessage = 'Something went wrong. Please try again.';
  
  static errors = {
    unknownError: {
      message: 'Unknown Error',
      code: 2000
    },
    generateSessionKeysNonces: {
      message: TwoFasError.defaultErrorMessage,
      code: 2010
    },
    generateEphemeralKeys: {
      message: TwoFasError.defaultErrorMessage,
      code: 2020
    },
    generateSessionID: {
      message: TwoFasError.defaultErrorMessage,
      code: 2030
    },
    calculateSignature: {
      message: TwoFasError.defaultErrorMessage,
      code: 2040
    },
    generateQR: {
      message: TwoFasError.defaultErrorMessage,
      code: 2050
    },
    helloAction: {
      message: TwoFasError.defaultErrorMessage,
      code: 2060
    },
    helloFetchAction: {
      message: TwoFasError.defaultErrorMessage,
      code: 2061
    },
    helloFetchActionNoDeviceId: {
      message: TwoFasError.defaultErrorMessage,
      code: 2062
    },
    helloFetchActionWrongDeviceId: {
      message: TwoFasError.defaultErrorMessage,
      code: 2063
    },
    getBeInfo: {
      message: TwoFasError.defaultErrorMessage,
      code: 2070
    },
    importExtensionEphemeralKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2080
    },
    importMobileEphemeralKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2090
    },
    generateSharedSecret: {
      message: TwoFasError.defaultErrorMessage,
      code: 2100
    },
    importSharedSecretKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2110
    },
    generateSessionKeyHKDF: {
      message: TwoFasError.defaultErrorMessage,
      code: 2120
    },
    importSessionKeyForHKDF: {
      message: TwoFasError.defaultErrorMessage,
      code: 2130
    },
    generateAESKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2140
    },
    encryptHkdfSalt: {
      message: TwoFasError.defaultErrorMessage,
      code: 2150
    },
    checkChecksumLength: {
      message: 'Checksum length is not 32 bytes',
      code: 2160
    },
    calculateChecksum: {
      message: TwoFasError.defaultErrorMessage,
      code: 2161
    },
    checkChecksum: {
      message: 'Checksums do not match',
      code: 2162
    },
    sessionStorageCapacityExceeded: {
      message: 'Session storage capacity exceeded',
      code: 2170
    },
    generateEncryptionAESKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2180
    },
    savingEncryptionDataKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2190
    },
    decryptNewSessionId: {
      message: TwoFasError.defaultErrorMessage,
      code: 2200
    },
    decryptFcmToken: {
      message: TwoFasError.defaultErrorMessage,
      code: 2210
    },
    decryptExpirationDate: {
      message: TwoFasError.defaultErrorMessage,
      code: 2211
    },
    addExpirationDateToDevice: {
      message: TwoFasError.defaultErrorMessage,
      code: 2212
    },
    handleSendVaultData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2220
    },
    joinEncGzipVaultData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2230
    },
    exportEncryptionPassKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2240
    },
    decryptVaultData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2250
    },
    pullRequestNoAction: {
      message: TwoFasError.defaultErrorMessage,
      code: 2300
    },
    pullRequestWrongAction: {
      message: TwoFasError.defaultErrorMessage,
      code: 2301
    },
    passwordRequestNoLoginId: {
      message: TwoFasError.defaultErrorMessage,
      code: 2310
    },
    deleteLoginNoLoginId: {
      message: TwoFasError.defaultErrorMessage,
      code: 2320
    },
    newLoginNoData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2330
    },
    updateLoginWrongData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2340
    },
    updateLoginWrongSecurityType: {
      message: TwoFasError.defaultErrorMessage,
      code: 2341
    },
    pullRequestActionDataError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2350
    },
    pullRequestActionWrongData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2351
    },
    pullRequestActionWrongAction: {
      message: TwoFasError.defaultErrorMessage,
      code: 2352
    },
    pullRequestActionPasswordRequestWrongStatus: {
      message: TwoFasError.defaultErrorMessage,
      code: 2360
    },
    pullRequestActionPasswordRequestCancelError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2361
    },
    pullRequestActionPasswordRequestAcceptError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2362
    },
    pullRequestActionDeleteLoginWrongStatus: {
      message: TwoFasError.defaultErrorMessage,
      code: 2370
    },
    pullRequestActionDeleteCancelError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2371
    },
    pullRequestActionDeleteAcceptError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2372
    },
    pullRequestActionNewLoginWrongStatus: {
      message: TwoFasError.defaultErrorMessage,
      code: 2380
    },
    pullRequestActionNewLoginCancelError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2381
    },
    pullRequestActionNewLoginAddedInT1Error: {
      message: TwoFasError.defaultErrorMessage,
      code: 2382
    },
    pullRequestActionNewLoginAddedError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2383
    },
    pullRequestActionNewLoginAddedWrongSecurityType: {
      message: TwoFasError.defaultErrorMessage,
      code: 2384
    },
    pullRequestActionNewLoginAddedWrongData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2385
    },
    pullRequestActionUpdateLoginWrongStatus: {
      message: TwoFasError.defaultErrorMessage,
      code: 2390
    },
    pullRequestActionUpdateLoginCancelError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2391
    },
    pullRequestActionUpdateLoginAddedInT1Error: {
      message: TwoFasError.defaultErrorMessage,
      code: 2392
    },
    pullRequestActionUpdateLoginUpdatedError: {
      message: TwoFasError.defaultErrorMessage,
      code: 2393
    },
    pullRequestActionUpdateLoginUpdatedWrongSecurityType: {
      message: TwoFasError.defaultErrorMessage,
      code: 2394
    },
    pullRequestActionUpdateLoginUpdatedWrongData: {
      message: TwoFasError.defaultErrorMessage,
      code: 2395
    },
    userCancelled: {
      message: 'Browser extension has been closed',
      code: 2995
    },
    getKey: {
      message: TwoFasError.defaultErrorMessage,
      code: 2996
    },
    unknownAction: {
      message: 'Unknown action received',
      code: 2997
    },
    generateNonce: {
      message: TwoFasError.defaultErrorMessage,
      code: 2998
    },
    closeWithErrorReceived: {
      message: 'Close with error action received',
      code: 2999
    }
  };

  static internalErrors = {
    // GENERAL
    unknownError: {
      message: 'Unknown Error',
      code: 9000
    },
    extPlatformNotSet: {
      message: 'EXT_PLATFORM is not set.',
      code: 9001
    },
    notFoundRoute: {
      message: 'Route not found',
      code: 9002
    },
    toastMessageNotString: {
      message: 'Toast message is not a string',
      code: 9003
    },
    // FETCH
    fetchInvalidAction: {
      message: 'Fetch - Invalid action',
      code: 9020
    },
    fetchSendPush: {
      message: 'Error sending push notification',
      code: 9021
    },
    fetchSendPushInvalidDevice: {
      message: 'Error sending push notification - invalid device',
      code: 9022
    },
    fetchSendPushStorageGetPkPersBe: {
      message: 'Error getting pkPersBe from storage',
      code: 9023
    },
    fetchSendPushGetKey: {
      message: 'Error getting key',
      code: 9024
    },
    fetchSendPushResponseIsNotOk: {
      message: 'Response is not ok',
      code: 9025
    },
    fetchSendPushResponseJsonParse: {
      message: 'Error parsing JSON response',
      code: 9026
    },
    // WEBSOCKET
    websocketInstanceNotExists: {
      message: 'WebSocket instance does not exist',
      code: 9040
    },
    websocketInstanceExists: {
      message: 'WebSocket instance already exists',
      code: 9041
    },
    websocketError: {
      message: 'WebSocket error',
      code: 9042
    },
    websocketEventNotTrusted: {
      message: 'WebSocket message event is not trusted',
      code: 9043
    },
    websocketMessageFailToParse: {
      message: 'WebSocket message failed to parse',
      code: 9044
    },
    websocketNotOpened: {
      message: 'WebSocket is not opened',
      code: 9045
    },
    websocketSchemeMismatch: {
      message: 'WebSocket message scheme mismatch',
      code: 9046
    },
    // DEVICE
    deviceNotFound: {
      message: 'Device not found',
      code: 9060
    },
    // SECURITY TYPE
    wrongSecurityType: {
      message: 'Wrong security type',
      code: 9070
    },
    // DECRYPT PASSWORD
    decryptPasswordNotDefined: {
      message: 'decryptPassword: password is not defined',
      code: 9100
    },
    decryptPasswordDeviceIdNotDefined: {
      message: 'decryptPassword: deviceId is not defined',
      code: 9101
    },
    decryptPasswordDecryptBytes: {
      message: 'decryptPassword: error decrypting bytes',
      code: 9102
    },
    decryptPasswordGetKey: {
      message: 'decryptPassword: error getting key item_key_t3',
      code: 9103
    },
    decryptPasswordStorageGetKey: {
      message: 'decryptPassword: error getting key item_key_t3 from storage',
      code: 9104
    },
    decryptPasswordImportKey: {
      message: 'decryptPassword: error importing key',
      code: 9105
    },
    decryptPasswordDecrypt: {
      message: 'decryptPassword: error decrypting password',
      code: 9106
    },
    decryptPasswordSecurityTypeNotDefined: {
      message: 'decryptPassword: security type is not defined',
      code: 9107
    },
    // SEND AUTOFILL TO TAB
    sendAutofillToTabToTabService: {
      message: 'sendAutofillToTab: service error',
      code: 9120
    },
    sendAutofillToTabDecryptPassword: {
      message: 'sendAutofillToTab: error decrypting password',
      code: 9121
    },
    sendAutofillToTabNonceError: {
      message: 'sendAutofillToTab: error generating nonce',
      code: 9122
    },
    sendAutofillToTabImportKeyError: {
      message: 'sendAutofillToTab: error importing key',
      code: 9123
    },
    sendAutofillToTabEncryptError: {
      message: 'sendAutofillToTab: error encrypting data',
      code: 9124
    },
    // GET CURRENT DEVICE
    getCurrentDeviceNoDevice: {
      message: 'No valid device found for push notification',
      code: 9140
    },
    getCurrentDeviceLackOfUUID: {
      message: 'No valid device UUID found for push notification',
      code: 9141
    },
    // VALUE TO NFKD
    valueToNFKDNotText: {
      message: 'The value is not a text.',
      code: 9170
    },
    valueToNFKDNotSupportNormalization: {
      message: 'The value does not support normalization.',
      code: 9171
    },
    // GET KEY
    getKeyNotFoundEnv: {
      message: 'Key %KEY_NAME% not found in persistentKeys or ephemeralKeys',
      code: 9180
    },
    getKeyNoDeviceIdOrUUID: {
      message: 'UUID or deviceId not found in data',
      code: 9181
    },
    getKeyNoUUIDForDeviceId: {
      message: 'UUID not found for deviceId %DEVICE_ID%',
      code: 9182
    },
    getKeyNotFoundKeyInKeys: {
      message: 'Key %KEY_NAME% not found persistentKeys or ephemeralKeys',
      code: 9183
    },
    getKeyCryptoKeyNotFound: {
      message: 'CryptoKey not found in storage',
      code: 9184
    },
    getKeyPublicKeyError: {
      message: 'getKey: error getting public key',
      code: 9185
    },
    getKeyImportKeyError: {
      message: 'getKey: error importing key',
      code: 9186
    },
    getKeySignError: {
      message: 'getKey: error signing data',
      code: 9187
    },
    // GET SERVICES KEYS
    getServicesKeysNotDefined: {
      message: 'getServicesKeys: keyEnv is not defined',
      code: 9200
    },
    getServicesKeysCryptoKeyError: {
      message: 'getServicesKeys: cryptoKeyImported error',
      code: 9201
    },
    // CHECK DOMAIN ON IGNORED LIST
    checkDomainOnIgnoredListUrlError: {
      message: 'checkDomainOnIgnoredList: error parsing URL',
      code: 9220
    },
    // CHECK SERVICES DATA
    checkServicesDataDecryptError: {
      message: 'checkServicesData: error decrypting password',
      code: 9230
    },
    // HANDLE AUTOFILL
    handleAutofillNoService: {
      message: 'handleAutofill: no service found',
      code: 9240
    },
    handleAutofillNoTab: {
      message: 'handleAutofill: no tab found',
      code: 9241
    },
    handleAutofillNoResponse: {
      message: 'handleAutofill: no response from tab',
      code: 9242
    },
    handleAutofillNoInputs: {
      message: 'handleAutofill: no inputs found',
      code: 9243
    },
    // HANDLE USERNAME
    handleUsernameNoService: {
      message: 'handleUsername: no service found',
      code: 9250
    },
    // HANDLE PASSWORD
    handlePasswordNoService: {
      message: 'handlePassword: no service found',
      code: 9260
    },
    // ON WEB REQUEST
    onWebRequestConfiguredError: {
      message: 'onWebRequest: error getting configured value',
      code: 9270
    },
    onWebRequestDomainIgnoredListError: {
      message: 'onWebRequest: error checking domain on ignored list',
      code: 9271
    },
    onWebRequestJsonStringifyError: {
      message: 'onWebRequest: error stringifying JSON',
      code: 9272
    },
    onWebRequestCheckServicesDataError: {
      message: 'onWebRequest: error checking services data',
      code: 9273
    },
    onWebRequestSavePromptActionError: {
      message: 'onWebRequest: error savePrompt action',
      code: 9274
    },
    // CALCULATE SIGNATURE
    calculateSignaturePublicKeyError: {
      message: 'calculateSignature: error getting public key',
      code: 9280
    },
    calculateSignaturePrivateKeyError: {
      message: 'calculateSignature: error getting private key',
      code: 9281
    },
    calculateSignatureSignError: {
      message: 'calculateSignature: error signing data',
      code: 9282
    },
    // CALCULATE SIGNATURE FETCH
    calculateSignatureFetchPublicKeyError: {
      message: 'calculateSignature: error getting public key',
      code: 9290
    },
    calculateSignatureFetchPrivateKeyError: {
      message: 'calculateSignature: error getting private key',
      code: 9291
    },
    calculateSignatureFetchSignError: {
      message: 'calculateSignature: error signing data',
      code: 9292
    },
    // KEEP PASSWORD
    keepPasswordExportKeyError: {
      message: 'keepPassword: error exporting key',
      code: 9300
    },
    // INJECT CS IF NOT ALREADY
    injectCSIfNotAlreadyUnknownTypeError: {
      message: 'injectCSIfNotAlready: unknown type',
      code: 9310
    },
    // COMPRESS PUBLIC KEY
    compressPublicKeyWrongKeyError: {
      message: 'compressPublicKey: wrong key',
      code: 9320
    },
    compressPublicKeyImportKeyError: {
      message: 'compressPublicKey: error importing key',
      code: 9321
    },
    compressPublicKeyExportKeyError: {
      message: 'compressPublicKey: error exporting key',
      code: 9322
    },
    // IS T3 OR T2 WITH PASSWORD
    isT3orT2WithPasswordWrongSecurityTypeError: {
      message: 'isT3orT2WithPassword: wrong security type',
      code: 9330
    },
    // GET CONFIGURED
    getConfiguredNonceError: {
      message: 'getConfigured: error getting nonce',
      code: 9340
    },
    getConfiguredPersistentPrivateKeyError: {
      message: 'getConfigured: error getting persistent private key',
      code: 9341
    },
    getConfiguredPersistentPublicKeyError: {
      message: 'getConfigured: error getting persistent public key',
      code: 9342
    },
    getConfiguredDeriveBitsError: {
      message: 'getConfigured: error deriving bits',
      code: 9343
    },
    getConfiguredAESKeyImportError: {
      message: 'getConfigured: error importing AES key',
      code: 9344
    },
    getConfiguredGetItemFromStorageError: {
      message: 'getConfigured: error getting item from storage',
      code: 9345
    },
    getConfiguredDecryptError: {
      message: 'getConfigured: error decrypting',
      code: 9346
    },
    // GENERATE LOCAL KEY
    generateLocalKeyGenerateKeyError: {
      message: 'generateLocalKey: error generating key',
      code: 9350
    },
    generateLocalKeyExportKeyError: {
      message: 'generateLocalKey: error exporting key',
      code: 9351
    },
    // DECRYPT VALUES
    decryptValuesLocalKeyError: {
      message: 'decryptValues: error getting local key',
      code: 9360
    },
    decryptValuesImportKeyError: {
      message: 'decryptValues: error importing key',
      code: 9361
    },
    decryptValuesDecryptError: {
      message: 'decryptValues: error decrypting data',
      code: 9362
    },
    // CONTENT AUTOFILL
    contentAutofillImportKeyError: {
      message: 'contentAutofill: error importing key',
      code: 9370
    },
    contentAutofillDecryptError: {
      message: 'contentAutofill: error decrypting data',
      code: 9371
    },
    // HANDLE INPUT EVENT
    handleInputEventNonceError: {
      message: 'handleInputEvent: error generating nonce',
      code: 9380
    },
    handleInputEventKeyImportError: {
      message: 'handleInputEvent: error importing key',
      code: 9381
    },
    handleInputEventEncryptError: {
      message: 'handleInputEvent: error encrypting data',
      code: 9382
    },
    // CONTEXT MENU
    contextMenuConfiguredError: {
      message: 'Error configuring context menu',
      code: 9390
    },
    // CHECK INITIAL INPUT VALUES
    checkInitialInputsValuesNonceError: {
      message: 'checkInitialInputsValues: error generating nonce',
      code: 9400
    },
    checkInitialInputsValuesKeyImportError: {
      message: 'checkInitialInputsValues: error importing key',
      code: 9401
    },
    checkInitialInputsValuesEncryptError: {
      message: 'checkInitialInputsValues: error encrypting data',
      code: 9402
    },
    // SETUP STYLE OBSERVER
    setupStyleObserverMutationDetected: {
      message: 'Style observer detected mutation on shadowHost element',
      code: 9403
    },
    // TAG INDEX ERROR
    tagIndexError: {
      message: 'Tag not found in tags list',
      code: 9420
    }
  };
}

export default TwoFasError;
