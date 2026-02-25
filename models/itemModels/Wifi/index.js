// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Item from '@/models/itemModels/Item';

const WIFI_SECURITY_TYPES = ['none', 'wep', 'wpa', 'wpa2', 'wpa3'];

const WIFI_URI_TYPE_MAP = {
  none: 'nopass',
  wep: 'WEP',
  wpa: 'WPA',
  wpa2: 'WPA',
  wpa3: 'WPA'
};

const escapeWifiString = str => str
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/"/g, '\\"')
  .replace(/:/g, '\\:');

/**
* Class representing a wifi network.
* @extends Item
*/
export default class Wifi extends Item {
  static contentType = 'wifi';
  static contentVersion = 1;
  static SECURITY_TYPES = WIFI_SECURITY_TYPES;

  #s_wifi_password;

  constructor (wifiData, deviceId = null, vaultId = null) {
    if (wifiData.constructor.name === Wifi.name) {
      return wifiData;
    }

    super(wifiData, deviceId, vaultId);

    validate(wifiData.content && typeof wifiData.content === 'object', 'Invalid wifi data');

    validate(wifiData?.content?.name, isValidString, 'Invalid or missing wifiData.content.name: must be a string');

    validate(
      typeof wifiData?.content?.securityType === 'string' && WIFI_SECURITY_TYPES.includes(wifiData.content.securityType),
      'Invalid or missing wifiData.content.securityType: must be one of none, wep, wpa, wpa2, wpa3'
    );

    validate(typeof wifiData?.content?.hidden === 'boolean', 'Invalid or missing wifiData.content.hidden: must be a boolean');

    validateOptional(wifiData?.content?.ssid, isValidString, 'Invalid wifiData.content.ssid: must be a string');
    validateOptional(wifiData?.content?.s_wifi_password, isValidBase64, 'Invalid wifiData.content.s_wifi_password: must be a base64 string');
    validateOptional(wifiData?.content?.notes, isValidString, 'Invalid wifiData.content.notes: must be a string');

    this.contentType = Wifi.contentType;
    this.contentVersion = Wifi.contentVersion;

    this.content = {
      name: wifiData.content.name,
      ssid: wifiData.content.ssid ?? null,
      securityType: wifiData.content.securityType,
      hidden: wifiData.content.hidden,
      notes: wifiData.content.notes ?? null,
      s_wifi_password: wifiData.content.s_wifi_password ?? null
    };

    this.internalData = {
      ...this.internalData,
      uiName: getMessage('wifi')
    };

    // Secure Input Fields
    this.#s_wifi_password = wifiData.content.s_wifi_password ?? null;
  }

  removeSif () {
    if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET) {
      throw new Error('Item is not of Highly Secret security tier');
    }

    this.#s_wifi_password = null;
  }

  async decryptSif () {
    return {
      wifiPassword: await super.decryptSif(this.#s_wifi_password, this?.internalData?.type)
    };
  }

  async setSif (sifData) {
    if (!Array.isArray(sifData)) {
      throw new Error('Invalid SIF data: must be an array');
    }

    for (const item of sifData) {
      if (Object.prototype.hasOwnProperty.call(item, 's_wifi_password')) {
        this.#s_wifi_password = await this.encryptSif(item.s_wifi_password, this?.internalData?.type);
      }
    }
  }

  /**
  * Sets already-encrypted SIF data directly without re-encrypting.
  * @param {Array<Object>} sifData - Array of objects with encrypted SIF values.
  */
  setSifEncrypted (sifData) {
    if (!Array.isArray(sifData)) {
      throw new Error('Invalid SIF data: must be an array');
    }

    for (const item of sifData) {
      if (Object.prototype.hasOwnProperty.call(item, 's_wifi_password')) {
        this.#s_wifi_password = item.s_wifi_password;
      }
    }
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: getMessage('this_tab_more_details'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'details' }
    ];

    if (this.content.ssid && this.sifExists) {
      dO.push({ value: 'showQr', label: getMessage('this_tab_more_show_qr'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'showQr' });
    }

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: getMessage('this_tab_more_forget_wifi_password'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'forget' });
    }

    return dO;
  }

  get contextMenuItem () {
    return {};
  }

  get sifs () {
    return ['s_wifi_password'];
  }

  get sifExists () {
    return this.#s_wifi_password && this.#s_wifi_password !== '';
  }

  async generateWifiUri () {
    if (!this.content.ssid) {
      throw new Error('Cannot generate WiFi URI: SSID is required');
    }

    const type = WIFI_URI_TYPE_MAP[this.content.securityType];
    let uri = `WIFI:T:${type};S:${escapeWifiString(this.content.ssid)};`;

    if (this.content.securityType !== 'none' && this.sifExists) {
      let { wifiPassword } = await this.decryptSif();

      if (wifiPassword) {
        uri += `P:${escapeWifiString(wifiPassword)};`;
      }

      wifiPassword = null;
    }

    if (this.content.hidden) {
      uri += 'H:true;';
    }

    uri += ';';

    return uri;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      contentType: Wifi.contentType,
      contentVersion: Wifi.contentVersion,
      content: {
        ...this.content,
        s_wifi_password: this.#s_wifi_password
      },
      internalData: {
        ...this.internalData
      }
    };
  }
}
