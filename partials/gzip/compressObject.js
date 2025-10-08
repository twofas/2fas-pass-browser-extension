// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import compress from './compress';

/**
* Compresses a JavaScript object into a GZIP-compressed Base64 string.
* @param {Object} object - The object to compress.
* @return {Promise<string>} The GZIP-compressed Base64 string representation of the object.
* @throws {TypeError} If object contains circular references or non-serializable values.
* @throws {Error} If compression or encoding fails.
*/
const compressObject = async object => {
  try {
    if (object === null || object === undefined) {
      throw new TypeError('compressObject: Object parameter is required');
    }

    const objectStringify = JSON.stringify(object);
    const objectGzipAB = await compress(objectStringify);
    const objectGzip = ArrayBufferToBase64(objectGzipAB);

    return objectGzip;
  } catch (e) {
    await CatchError(e);
    throw e;
  }
};

export default compressObject;
