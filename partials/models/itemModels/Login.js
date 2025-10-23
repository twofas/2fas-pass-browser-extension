// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '../../URIMatcher';
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
  #s_passwordDecrypted;

  constructor (loginData, vaultId = null, deviceId = null) {
    if (loginData.constructor.name === Login.name) {
      return loginData;
    }

    super (loginData, vaultId, deviceId);

    validate(loginData.content && typeof loginData.content === 'object', 'Invalid login data');

    validate(isValidInteger(loginData.content.iconType, 0, 2), 'Invalid or missing loginData.iconType: must be an integer between 0 and 2');

    validateOptional(loginData?.content?.name, isValidString, 'Invalid loginData.content.name: must be a string');
    validateOptional(loginData?.content?.username, isValidString, 'Invalid loginData.content.username: must be a string');

    validateOptional(loginData?.content?.s_password, isValidBase64, 'Invalid loginData.content.s_password: must be a base64 string');

    if (loginData?.content?.uris !== undefined) {
      validate(Array.isArray(loginData.content.uris), 'Invalid loginData.content.uris: must be an array');

      if (loginData?.content?.uris?.length > 0) {
        loginData.content.uris.forEach((uri, index) => {
          validate(uri && typeof uri === 'object', `Invalid loginData.content.uris[${index}]: must be an object`);
          validate(typeof uri.text === 'string', `Invalid loginData.content.uris[${index}].text: must be a string`);
          validate(isValidInteger(uri.matcher, URIMatcher.M_DOMAIN_TYPE, URIMatcher.M_EXACT_TYPE), `Invalid loginData.content.uris[${index}].matcher: must be an integer`);
        });
      }
    }

    if (loginData?.content?.iconUriIndex !== undefined && loginData?.content?.iconUriIndex !== null) {
      const urisLength = loginData?.content?.uris?.length && loginData.content.uris.length > 0 ? loginData.content.uris.length : 1;
      validate(isValidInteger(loginData.content.iconUriIndex, -1, urisLength - 1), `Invalid loginData.content.iconUriIndex: must be an integer between 0 and ${urisLength - 1}`);
    }

    validateOptional(loginData?.content?.labelText, isValidString, 'Invalid loginData.content.labelText: must be a string');
    validateOptional(loginData?.content?.labelColor, isValidHexColor, 'Invalid loginData.content.labelColor: must be a hex color string (3 or 6 characters)');
    validateOptional(loginData?.content?.customImageUrl, isValidString, 'Invalid loginData.content.customImageUrl: must be a string');
    validateOptional(loginData?.content?.notes, isValidString, 'Invalid loginData.content.notes: must be a string');

    validateOptional(loginData?.internalData, data => typeof data === 'object', 'Invalid loginData.internalData: must be an object');
    validateOptional(loginData?.internalData?.type, isValidString, 'Invalid loginData.internalData.type: must be a string');

    this.contentType = Login.contentType;
    this.contentVersion = Login.contentVersion;
    this.content = {
      name: loginData.content.name,
      username: loginData.content.username,
      uris: loginData.content.uris,
      iconType: loginData.content.iconType,
      iconUriIndex: loginData.content.iconUriIndex ?? null,
      labelText: loginData.content.labelText ?? null,
      labelColor: loginData.content.labelColor ?? null,
      customImageUrl: loginData.content.customImageUrl ?? null,
      notes: loginData.content.notes ?? null,
      s_password: '******'
    };

    this.internalData = {
      urisWithTempIds: this.#urisWidthTempIds(loginData.content.uris) || [],
      normalizedUris: this.#normalizeUris(loginData.content.uris) || [],
      type: loginData.internalData?.type || null,
      sifResetTime: loginData.internalData?.sifResetTime || null
    };

    this.#s_password = loginData.content.s_password || null;
    this.#s_passwordDecrypted = null;

    // if (internal && content.s_password !== undefined && content.s_password !== '******' && !isValidBase64(content.s_password)) {
    //   this.s_password = content.s_password;
    // } else {
    //   this.s_password = this.securityType === SECURITY_TIER.SECRET ? '******' : null;
    // }

    // // Secure Input Fields
    // if (content.s_password && isValidBase64(content.s_password)) {
    //   this.#s_password = content.s_password;
    // } else {
    //   this.#s_password = null;
    // }
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

  removeSif () {
    if (this.securityType !== SECURITY_TIER.HIGHLY_SECRET) {
      throw new Error('Item is not of Highly Secret security tier');
    }

    this.#s_password = null;
  }

  async decryptSif () {
    return {
      password: await super.decryptSif(this.#s_password, this?.internalData?.type)
    };
  }

  setSif (arr) {
    // @TODO: Validate password, arr?

    arr.forEach(item => {
      if (Object.prototype.hasOwnProperty.call(item, 's_password')) {
        this.#s_password = item.s_password;
      }
    });
  }

  setPasswordDecrypted (decryptedPassword) {
    this.#s_passwordDecrypted = decryptedPassword;
  }

  removePasswordDecrypted () {
    this.#s_passwordDecrypted = null;
  }

  get isPasswordDecrypted () {
    return this.#s_passwordDecrypted !== null;
  }

  get dropdownList () {
    const dO = [
      { value: 'details', label: browser.i18n.getMessage('this_tab_more_details'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'details' }
    ];

    if (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists) {
      dO.push({ value: 'forget', label: browser.i18n.getMessage('this_tab_more_forget_password'), deviceId: this.deviceId, vaultId: this.vaultId, id: this.id, type: 'forget' });
    }

    if (this.internalData.normalizedUris && this.internalData.normalizedUris.length > 0) {
      dO.push({ value: 'uris:', label: `${browser.i18n.getMessage('this_tab_more_uris')}`, type: 'urisHeader' });

      this.internalData.normalizedUris.forEach(uri => {
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
      const recognizedURIs = URIMatcher.recognizeURIs(this.internalData.normalizedUris);

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
      (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists)
    ) {
      return {
        id: `2fas-pass-autofill-${this.deviceId}|${this.vaultId}|${this.id}`,
        enabled: true,
        title: `${browser.i18n.getMessage('autofill')} ${this.content.username || this.content.name}`,
        type: 'normal',
        visible: true,
        parentId: '2fas-pass-configured',
        documentUrlPatterns: [...documentUrlPatterns],
        contexts
      };
    } else if (
      this.securityType === SECURITY_TIER.HIGHLY_SECRET && !this.sifExists ||
      !this.sifExists
    ) {
      return {
        id: `2fas-pass-fetch-${this.deviceId}|${this.vaultId}|${this.id}|${this.contentType}`,
        enabled: true,
        title: `${browser.i18n.getMessage('fetch')} ${this.content.username || this.content.name}...`,
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

  get sifs () {
    return ['s_password'];
  }

  get sifExists () {
    return this.#s_password && this.#s_password !== '';
  }

  get isT3orT2WithPassword () {
    return this.securityType === SECURITY_TIER.SECRET
      || (this.securityType === SECURITY_TIER.HIGHLY_SECRET && this.sifExists);
  }

  toJSON () {
    return {
      ...super.toJSON(),
      contentType: Login.contentType,
      contentVersion: Login.contentVersion,
      content: {
        ...this.content,
        s_password: this.#s_password
      },
      internalData: {
        type: this.internalData.type,
        sifResetTime: this.internalData.sifResetTime
      }
    };
  }
}
