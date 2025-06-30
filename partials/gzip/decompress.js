// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global TextDecoder, DecompressionStream, Response */

/** 
* Decompresses a GZIP compressed byte array.
* @async
* @param {Uint8Array} byteArray - The GZIP compressed byte array to decompress.
* @return {string} The decompressed string from the byte array.
*/
const decompress = async byteArray => {
  const cs = new DecompressionStream('gzip');
  const writer = cs.writable.getWriter();

  writer.write(byteArray);
  writer.close();

  const arrayBuffer = await new Response(cs.readable).arrayBuffer();
  
  return new TextDecoder().decode(arrayBuffer);
}

export default decompress;
