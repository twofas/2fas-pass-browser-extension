// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '../URIMatcher';
import Item from './Item';
import { v4 as uuidv4 } from 'uuid';

/**
* Class representing a login.
* @extends Item
*/
export default class Login extends Item {
  static contentType = 'login';
  static contentVersion = 1;

  #s_password;

  constructor (loginData, internal = false) {
    super (loginData, internal);

    validate(isValidUUID(loginData.deviceId), 'Invalid or missing deviceId: must be a valid UUID');

    const content = internal
      ? loginData
      : (loginData?.content ? JSON.parse(loginData.content) : null);

    validate(content && typeof content === 'object', 'Invalid login content data');
    validate(isValidInteger(content.iconType, 0, 2), 'Invalid or missing content.iconType: must be an integer between 0 and 2');

    validateOptional(content.name, isValidString, 'Invalid content.name: must be a string');
    validateOptional(content.username, isValidString, 'Invalid content.username: must be a string');

    if (!internal) {
      validateOptional(content.s_password, isValidBase64, 'Invalid content.s_password: must be a base64 string');
    }

    if (content.uris !== undefined) {
      validate(Array.isArray(content.uris), 'Invalid content.uris: must be an array');

      if (content.uris.length > 0) {
        content.uris.forEach((uri, index) => {
          validate(uri && typeof uri === 'object', `Invalid content.uris[${index}]: must be an object`);
          validate(typeof uri.text === 'string', `Invalid content.uris[${index}].text: must be a string`);
          validate(isValidInteger(uri.matcher, URIMatcher.M_DOMAIN_TYPE, URIMatcher.M_EXACT_TYPE), `Invalid content.uris[${index}].matcher: must be an integer`);
        });
      }
    }

    if (content.iconUriIndex !== undefined && content.iconUriIndex !== null) {
      const urisLength = content.uris?.length && content.uris.length > 0 ? content.uris.length : 1;
      validate(isValidInteger(content.iconUriIndex, -1, urisLength - 1), `Invalid content.iconUriIndex: must be an integer between 0 and ${urisLength - 1}`);
    }

    validateOptional(content.labelText, isValidString, 'Invalid content.labelText: must be a string');
    validateOptional(content.labelColor, isValidHexColor, 'Invalid content.labelColor: must be a hex color string (3 or 6 characters)');
    validateOptional(content.customImageUrl, isValidString, 'Invalid content.customImageUrl: must be a string');
    validateOptional(content.notes, isValidString, 'Invalid content.notes: must be a string');

    this.deviceId = loginData.deviceId;
    this.name = content.name;
    this.username = content.username;
    this.uris = this.#urisWidthTempIds(content.uris) || [];
    this.normalizedUris = internal ? (this.#urisWidthTempIds(content.uris) || []) : (this.#normalizeUris(content.uris) || []);
    this.iconType = content.iconType;
    this.iconUriIndex = content.iconUriIndex ?? null;
    this.labelText = content.labelText ?? null;
    this.labelColor = content.labelColor ?? null;
    this.customImageUrl = content.customImageUrl ?? null;
    this.notes = content.notes ?? null;
    if (internal && content.s_password !== undefined && content.s_password !== '******' && !isValidBase64(content.s_password)) {
      this.s_password = content.s_password;
    } else {
      this.s_password = this.securityType === SECURITY_TIER.SECRET ? '******' : null;
    }

    // Secure Input Fields
    if (content.s_password && isValidBase64(content.s_password)) {
      this.#s_password = content.s_password;
    } else {
      this.#s_password = null;
    }
  }

  #normalizeUris (uris) {
    if (uris && uris.length > 0) {
      uris = uris.filter(uri => uri && uri?.text && uri.text !== '' && URIMatcher.isText(uri.text) && URIMatcher.isUrl(uri.text, true));
      uris.forEach(uri => {
        uri.text = URIMatcher.normalizeUrl(uri.text, true);
        uri._tempId = uuidv4();
      });
    }

    return uris;
  }

  #urisWidthTempIds (uris) {
    if (uris && uris.length > 0) {
      uris = uris.map(uri => {
        return {
          text: uri.text,
          matcher: uri.matcher,
          _tempId: uri._tempId || uuidv4()
        };
      });
    }

    return uris;
  }

  async decryptSif () {
    return {
      password: await super.decryptSif(this.#s_password)
    };
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: browser.i18n.getMessage('this_tab_more_forget_password'), id: this.id, type: 'forget' });
    }

    if (this.normalizedUris && this.normalizedUris.length > 0) {
      dO.push({ value: 'uris:', label: `${browser.i18n.getMessage('this_tab_more_uris')}`, type: 'urisHeader' });

      this.normalizedUris.forEach(uri => {
        dO.push({ value: uri.text, label: uri.text, itemId: this.id });
      });
    }

    return dO;
  }

  get contextMenuItem () {
    if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET && this.securityType !== SECURITY_TIER.SECRET) {
      return {};
    }

    const contexts = ['page', 'editable'];

    if (import.meta.env.BROWSER !== 'safari')  {
      contexts.push('page_action'); // @TODO: Check this with latest Safari
    }

    const documentUrlPatterns = new Set();

    try {
      const recognizedURIs = URIMatcher.recognizeURIs(this.normalizedUris);

      if (recognizedURIs?.urls && recognizedURIs?.urls.length > 0) {
        recognizedURIs.urls.forEach(uri => {
          const patterns = URIMatcher.generateDocumentUrlPatterns(uri);

          if (patterns && patterns.length > 0) {
            patterns.forEach(pattern => documentUrlPatterns.add(pattern));
          }
        });
      }
    } catch {}

    if (!documentUrlPatterns || documentUrlPatterns.size <= 0) {
      return {};
    }

    if (
      this.securityType === SECURITY_TIER.SECRET ||
      (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.s_password && this.s_password !== '')
    ) {
      return {
        id: `2fas-pass-autofill-${this.id}`,
        enabled: true,
        title: `${browser.i18n.getMessage('autofill')} ${this.username || this.name}`,
        type: 'normal',
        visible: true,
        parentId: '2fas-pass-configured',
        documentUrlPatterns: [...documentUrlPatterns],
        contexts
      };
    } else if (
      this.securityType === SECURITY_TIER.HIGHLY_SECRET && !this.s_password ||
      this.s_password?.length <= 0
    ) {
      return {
        id: `2fas-pass-fetch-${this.id}|${this.deviceId}`,
        enabled: true,
        title: `${browser.i18n.getMessage('fetch')} ${this.username || this.name}...`,
        type: 'normal',
        visible: true,
        parentId: '2fas-pass-configured',
        documentUrlPatterns: [...documentUrlPatterns],
        contexts
      };
    } else {
      return {};
    }
  }

  get sifExists () {
    return this.#s_password && this.#s_password !== '';
  }

  get isT3orT2WithPassword () {
    return this.securityType === SECURITY_TIER.SECRET 
      || (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists);
  }
}
