// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Compresses a string using GZIP algorithm.
* @param {string} string - The string to compress.
* @return {Promise<ArrayBuffer>} A promise that resolves to the compressed data as an ArrayBuffer.
*/
const compress = string => {
  const byteArray = new TextEncoder().encode(string);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();

  writer.write(byteArray);
  writer.close();

  return new Response(cs.readable).arrayBuffer();
};

export default compress;
