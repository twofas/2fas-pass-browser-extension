// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** @type {number} Number of PBKDF2 iterations for password-based key derivation. */
const PBKDF2_ITERATIONS = 600000;

/**
 * Generate a random 96-bit nonce for AES-GCM.
 * @returns {Uint8Array} 12-byte nonce.
 */
function generateNonce () {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Generate a random 128-bit salt for PBKDF2.
 * @returns {Uint8Array} 16-byte salt.
 */
function generateSalt () {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random 256-bit key for AES-256-GCM.
 * @returns {Uint8Array} 32-byte key.
 */
function generateRandomKey () {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Derive a 256-bit key from a password using PBKDF2.
 * @param {string} password - User-supplied password.
 * @param {Uint8Array} salt - 128-bit salt.
 * @returns {Promise<Uint8Array>} 32-byte derived key.
 */
async function deriveKeyFromPassword (password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}

/**
 * Encrypt data using AES-256-GCM.
 * @param {Uint8Array} keyBytes - 256-bit encryption key.
 * @param {Uint8Array} nonce - 96-bit nonce / initialization vector.
 * @param {any} plaintext - Data to encrypt (will be JSON-serialized).
 * @returns {Promise<Uint8Array>} Ciphertext with appended GCM auth tag.
 */
async function encryptData (keyBytes, nonce, plaintext) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cryptoKey,
    encoder.encode(JSON.stringify(plaintext))
  );

  return new Uint8Array(encrypted);
}

/**
 * Encode a Uint8Array to a standard Base64 string (with padding).
 * @param {Uint8Array} bytes - Binary data to encode.
 * @returns {string} Base64-encoded string.
 */
function toBase64 (bytes) {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Encode a Uint8Array to a Base64URL string (no padding).
 * @param {Uint8Array} bytes - Binary data to encode.
 * @returns {string} Base64URL-encoded string.
 */
function toBase64Url (bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a Base64URL string to a Uint8Array.
 * @param {string} str - Base64URL-encoded string.
 * @returns {Uint8Array} Decoded binary data.
 */
function fromBase64Url (str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

/**
 * Decrypt data using AES-256-GCM.
 * @param {Uint8Array} keyBytes - 256-bit decryption key.
 * @param {Uint8Array} nonce - 96-bit nonce / initialization vector.
 * @param {Uint8Array} ciphertext - Ciphertext with appended GCM auth tag.
 * @returns {Promise<any>} Parsed plaintext (JSON-deserialized).
 * @throws {Error} If decryption or authentication fails.
 */
async function decryptShareData (keyBytes, nonce, ciphertext) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted));
}

export {
  generateNonce,
  generateSalt,
  generateRandomKey,
  deriveKeyFromPassword,
  encryptData,
  toBase64,
  toBase64Url,
  fromBase64Url,
  decryptShareData
};
