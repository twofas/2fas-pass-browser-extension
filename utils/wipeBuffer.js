// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Overwrites the contents of an ArrayBuffer or TypedArray with zeros to prevent
* sensitive data (keys, decrypted values) from lingering in memory after use.
* Safe to call with null/undefined (no-op).
* @param {ArrayBuffer|TypedArray|null} buf - The buffer to wipe.
*/
const wipeBuffer = buf => {
  if (!buf) {
    return;
  }

  if (buf instanceof ArrayBuffer) {
    new Uint8Array(buf).fill(0);
  } else if (ArrayBuffer.isView(buf)) {
    new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength).fill(0);
  }
};

export default wipeBuffer;
