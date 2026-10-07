// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// webRequest requestBody.raw[].bytes is an ArrayBuffer in Chromium and Firefox, but a
// Uint8Array in Safari (WebKit JSObjectMakeTypedArray kJSTypedArrayTypeUint8Array).
// ArrayBufferToString accepts only an ArrayBuffer, so Safari bodies threw and every
// JSON / fetch login and the unload beacon were silently dropped.

import { describe, it, expect } from 'vitest';
import requestBodyBytesToString from './requestBodyBytesToString.js';

describe('requestBodyBytesToString', () => {
  it('decodes an ArrayBuffer (Chromium / Firefox)', () => {
    expect(requestBodyBytesToString(new TextEncoder().encode('{"user":"a"}').buffer)).toBe('{"user":"a"}');
  });

  it('decodes a Uint8Array (Safari)', () => {
    expect(requestBodyBytesToString(new TextEncoder().encode('{"user":"a"}'))).toBe('{"user":"a"}');
  });

  it('decodes only the viewed part of a typed array', () => {
    const bytes = new TextEncoder().encode('xx{"user":"ą"}yy');

    expect(requestBodyBytesToString(bytes.subarray(2, bytes.length - 2))).toBe('{"user":"ą"}');
  });

  it('decodes UTF-8 the same way for both shapes', () => {
    const encoded = new TextEncoder().encode('hasło=Zażółć');

    expect(requestBodyBytesToString(encoded)).toBe(requestBodyBytesToString(encoded.buffer));
  });

  it('still rejects values that are not binary data', () => {
    expect(() => requestBodyBytesToString('{"user":"a"}')).toThrow(TypeError);
  });
});
