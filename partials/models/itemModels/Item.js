// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { HEX_REGEX, ENCRYPTION_KEYS } from '@/constants';
import getKey from '@/partials/sessionStorage/getKey';

/**
* Class representing an item.
*/
class Item {
  constructor (data, deviceId = null, vaultId = null) {
    validate(data && typeof data === 'object', 'Invalid item data');
    validate(isValidUUID(data.id), 'Invalid or missing id: must be a valid UUID');

    if (deviceId) {
      validate(isValidUUID(deviceId), 'Invalid or missing deviceId: must be a valid UUID');
      this.deviceId = deviceId;
    } else if (data.deviceId) {
      validate(isValidUUID(data.deviceId), 'Invalid or missing deviceId: must be a valid UUID');
      this.deviceId = data.deviceId;
    } else {
      throw new Error('Missing deviceId');
    }

    if (vaultId) {
      validate(isValidUUID(vaultId), 'Invalid or missing vaultId: must be a valid UUID');
      this.vaultId = vaultId;
    } else if (data.vaultId) {
      validate(isValidUUID(data.vaultId), 'Invalid or missing vaultId: must be a valid UUID');
      this.vaultId = data.vaultId;
    } else {
      throw new Error('Missing vaultId');
    }

    validate(isValidInteger(data.createdAt), 'Invalid or missing createdAt: must be an integer');
    validate(isValidInteger(data.updatedAt), 'Invalid or missing updatedAt: must be an integer');
    validate(isValidInteger(data.securityType, 0, 2), 'Invalid or missing securityType: must be an integer between 0 and 2');

    validateOptional(data.tags, tags => isValidArray(tags, tag => isValidString(tag)), 'Invalid tags: must be an array of strings');

    this.id = data.id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.securityType = data.securityType;
    this.tags = data.tags || [];

    this.internalData = {
      originalSecurityType: data.internalData?.originalSecurityType || this.securityType
    };
  }

  /** 
  * Converts a hex color code to RGB.
  * @param {string} hex - The hex color code.
  * @return {Array<number>} The RGB representation of the color.
  */
  #hexToRgb (hex) {
    hex = hex.replace(/^#/, '');

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
  }

  /** 
  * Calculates the relative luminance of a color.
  * @param {number} r - The red component (0-255).
  * @param {number} g - The green component (0-255).
  * @param {number} b - The blue component (0-255).
  * @return {number} The relative luminance (0-1).
  */
  #calculateLuminance (r, g, b) {
    const [R, G, B] = [r, g, b].map(value => {
      value /= 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /** 
  * Converts a hex color string to its luminance value.
  * @param {string} hex - The hex color string.
  * @return {number} The luminance value.
  */
  #luminanceFromHex (hex) {
    const [r, g, b] = this.#hexToRgb(hex);
    return this.#calculateLuminance(r, g, b);
  }

  /** 
  * Decrypts the secure item field (sif) using the appropriate encryption key.
  * @async
  * @param {string} secureItemValue - The base64 encoded secure item field to decrypt.
  * @return {Promise<string>} The decrypted secure item value.
  * @throws Will throw an error if decryption fails at any step.
  */
  async decryptSif (secureItemValue, internalType = null) {
    if (!secureItemValue || typeof secureItemValue !== 'string') {
      throw new Error('Invalid secure item field');
    }

    let sifDecryptedBytes;

    try {
      const sifAB = Base64ToArrayBuffer(secureItemValue);
      sifDecryptedBytes = DecryptBytes(sifAB);
    } catch (e) {
      throw new TwoFasError(TwoFasError.internalErrors.decryptSifDecryptBytes, { event: e, additional: { func: 'decryptSif' } });
    }

    let itemKey;

    try {
      if (this.securityType === SECURITY_TIER.SECRET) {
        if (internalType && internalType === 'added') {
          itemKey = await getKey(ENCRYPTION_KEYS.ITEM_T3_NEW.sK, { deviceId: this.deviceId, itemId: this.id });
        } else {
          itemKey = await getKey(ENCRYPTION_KEYS.ITEM_T3.sK, { deviceId: this.deviceId });
        }
      } else {
        itemKey = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: this.deviceId, itemId: this.id });
      }
    } catch (e) {
      sifDecryptedBytes = null;

      throw new TwoFasError(TwoFasError.internalErrors.decryptSifGetKey, {
        event: e,
        additional: {
          func: 'decryptSif',
          deviceId: this?.deviceId || null
        }
      });
    }

    let encryptionItemKey;

    try {
      encryptionItemKey = await storage.getItem(`session:${itemKey}`);
    } catch (e) {
      sifDecryptedBytes = null;
      throw new TwoFasError(TwoFasError.internalErrors.decryptSifStorageGetKey, { event: e, additional: { func: 'decryptSif' } });
    }

    itemKey = null;
    let encryptionKey;

    try {
      const encryptionItemKeyAB = Base64ToArrayBuffer(encryptionItemKey);
      encryptionKey = await crypto.subtle.importKey(
        'raw',
        encryptionItemKeyAB,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
    } catch (e) {
      sifDecryptedBytes = null;
      throw new TwoFasError(TwoFasError.internalErrors.decryptSifImportKey, { event: e, additional: { func: 'decryptSif' } });
    }

    encryptionItemKey = null;
    let decryptedSifAB;

    try {
      decryptedSifAB = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: sifDecryptedBytes.iv },
        encryptionKey,
        sifDecryptedBytes.data
      );
    } catch (e) {
      sifDecryptedBytes = null;
      encryptionKey = null;

      throw new TwoFasError(TwoFasError.internalErrors.decryptSifDecrypt, {
        event: e,
        additional: { func: 'decryptSif' }
      });
    }

    sifDecryptedBytes = null;
    encryptionKey = null;

    const result = ArrayBufferToString(decryptedSifAB);
    decryptedSifAB = null;

    return result;
  }

  /** 
  * Gets the text color based on the item label color.
  * @return {string} The text color (black or white) based on the label color.
  */
  get textColor () {
    if (!this.labelColor) {
      return '#fff';
    }

    if (this.labelColor && HEX_REGEX.test(this.labelColor)) {
      const yiq = this.#luminanceFromHex(this.labelColor);
      return yiq > 0.5 ? '#000' : '#fff';
    } else {
      return '#fff';
    }
  }

  get isT3orT2WithSif () {
    return this.securityType === SECURITY_TIER.SECRET
      || (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists);
  }

  toJSON () {
    return {
      id: this.id,
      vaultId: this.vaultId,
      deviceId: this.deviceId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      securityType: this.securityType,
      tags: this.tags
    };
  }
}

export default Item;
