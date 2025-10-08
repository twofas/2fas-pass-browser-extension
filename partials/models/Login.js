// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '../URIMatcher';
import Item from './Item';

/**
* Class representing a login.
* @extends Item
*/
export default class Login extends Item {
  static contentType = 'login';
  static contentVersion = 1;

  constructor (loginData) {
    super (loginData);

    validate(isValidUUID(loginData.id), 'Invalid or missing id: must be a valid UUID');
    validate(isValidUUID(loginData.deviceId), 'Invalid or missing deviceId: must be a valid UUID');
    validate(isValidInteger(loginData.createdAt), 'Invalid or missing createdAt: must be an integer');
    validate(isValidInteger(loginData.updatedAt), 'Invalid or missing updatedAt: must be an integer');
    validate(isValidInteger(loginData.securityType, 0, 2), 'Invalid or missing securityType: must be an integer between 0 and 2');

    const content = loginData?.content ? JSON.parse(loginData.content) : {};

    validate(content && typeof content === 'object', 'Invalid login content data');
    validate(isValidInteger(content.iconType, 0, 2), 'Invalid or missing content.iconType: must be an integer between 0 and 2');

    validateOptional(content.name, isValidString, 'Invalid content.name: must be a string');
    validateOptional(content.username, isValidString, 'Invalid content.username: must be a string');
    validateOptional(content.s_password, isValidBase64, 'Invalid content.s_password: must be a base64 string');

    if (content.uris !== undefined) {
      validate(Array.isArray(content.uris), 'Invalid content.uris: must be an array');

      content.uris.forEach((uri, index) => {
        validate(uri && typeof uri === 'object', `Invalid content.uris[${index}]: must be an object`);
        validate(typeof uri.text === 'string', `Invalid content.uris[${index}].text: must be a string`);
        validate(typeof uri.matcher === 'string' || Number.isInteger(uri.matcher), `Invalid content.uris[${index}].matcher: must be a string or integer`);
      });
    }

    if (content.iconUriIndex !== undefined) {
      const urisLength = content.uris?.length || 0;

      validate(isValidInteger(content.iconUriIndex, 0, urisLength - 1), `Invalid content.iconUriIndex: must be an integer between 0 and ${urisLength - 1}`);
    }

    validateOptional(content.labelText, isValidString, 'Invalid content.labelText: must be a string');
    validateOptional(content.labelColor, isValidHexColor, 'Invalid content.labelColor: must be a hex color string (3 or 6 characters)');
    validateOptional(content.customImageUrl, isValidString, 'Invalid content.customImageUrl: must be a string');
    validateOptional(content.notes, isValidString, 'Invalid content.notes: must be a string');
    validateOptional(loginData.tags, tags => isValidArray(tags, tag => isValidString(tag)), 'Invalid tags: must be an array of strings');

    this.id = loginData.id;
    this.deviceId = loginData.deviceId;
    this.createdAt = loginData.createdAt;
    this.updatedAt = loginData.updatedAt;
    this.securityType = loginData.securityType;
    this.name = content.name;
    this.username = content.username;
    this.s_password = content.s_password;
    this.uris = this.#normalizeUris(content.uris) || [];
    this.iconType = content.iconType;
    this.iconUriIndex = content.iconUriIndex ?? null;
    this.labelText = content.labelText ?? null;
    this.labelColor = content.labelColor ?? null;
    this.customImageUrl = content.customImageUrl ?? null;
    this.notes = content.notes ?? null;
    this.tags = loginData.tags || [];
  }

  #normalizeUris (uris) {
    if (uris && uris.length > 0) {
      uris = uris.filter(uri => uri && uri?.text && uri.text !== '' && URIMatcher.isText(uri.text) && URIMatcher.isUrl(uri.text, true));
      uris.forEach(uri => {
        uri.text = URIMatcher.normalizeUrl(uri.text, true);
      });
    }

    return uris;
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.s_password && this.s_password !== '') {
      dO.push({ value: 'forget', label: browser.i18n.getMessage('this_tab_more_forget_password'), id: this.id, type: 'forget' });
    }

    if (this.uris && this.uris.length > 0) {
      dO.push({ value: 'uris:', label: `${browser.i18n.getMessage('this_tab_more_uris')}`, type: 'urisHeader' });

      this.uris.forEach(uri => {
        dO.push({ value: uri.text, label: uri.text, itemId: this.id });
      });
    }

    return dO;
  }
}
