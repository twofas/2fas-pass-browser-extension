// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to decode webRequest requestBody.raw[].bytes to a string. The bytes are an ArrayBuffer in Chromium and Firefox and a Uint8Array in Safari.
* @param {ArrayBuffer|ArrayBufferView} bytes - The raw request body bytes.
* @return {string} The decoded string.
*/
const requestBodyBytesToString = bytes => {
  if (ArrayBuffer.isView(bytes)) {
    return new TextDecoder().decode(bytes);
  }

  return ArrayBufferToString(bytes);
};

export default requestBodyBytesToString;
