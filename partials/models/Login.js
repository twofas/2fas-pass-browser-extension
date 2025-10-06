// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// [
//   {
//       "content": "{\"name\":\"Test\",\"username\":\"test\",\"s_password\":\"1BR4pEWQ/TVQWO+0lfeoP6Wbdo0IfxijIEURfh2utnkkYo0b2ey6G6m3o8j4ig==\",\"uris\":[{\"text\":\"ifirma.pl\",\"matcher\":0}],\"iconType\":0,\"iconUriIndex\":0}"
//   },
//   {
//       "id": "37e10aac-5c28-438c-9260-b6ed384142a2",
//       "deviceId": "7ab4a407-d87d-422e-adc5-47af7e209b33",
//       "createdAt": 1758640449799,
//       "updatedAt": 1758640449799,
//       "securityType": 2,
//       "contentType": "login",
//       "contentVersion": 1,
//       "content": "{\"name\":\"222\",\"username\":\"test\",\"s_password\":\"Fw9UhtfTZ0+sLTaEwWm5ScbE4s6ryqxNVy7lvv7OKfqDOBO8uOzw9JK0cCGjKg==\",\"uris\":[{\"text\":\"google.pl\",\"matcher\":0}],\"iconType\":0,\"iconUriIndex\":0}"
//   },
//   {
//       "id": "910c1f55-a832-4909-974b-cb0218cf9389",
//       "deviceId": "7ab4a407-d87d-422e-adc5-47af7e209b33",
//       "createdAt": 1758640466303,
//       "updatedAt": 1758640466303,
//       "securityType": 2,
//       "contentType": "login",
//       "contentVersion": 1,
//       "content": "{\"name\":\"Ifirma\",\"username\":\"test\",\"s_password\":\"0ICqt0P8mfvD9JGME5UbaFruSyeoX3zigLwpGlIbFf5WJK1KojdpZK0F3CtpjQ==\",\"uris\":[{\"text\":\"ifirma.pl\",\"matcher\":0}],\"iconType\":0,\"iconUriIndex\":0}"
//   }
// ];

export default class Login {
  static contentType = 'login';
  static contentVersion = 1;

  constructor (loginData) {
    if (!loginData || typeof loginData !== 'object') {
      throw new Error('Invalid login data');
    }

    if (!isValidUUID(loginData.id)) {
      throw new Error('Invalid or missing id: must be a valid UUID');
    }

    if (!isValidUUID(loginData.deviceId)) {
      throw new Error('Invalid or missing deviceId: must be a valid UUID');
    }

    if (!isValidInteger(loginData.createdAt)) {
      throw new Error('Invalid or missing createdAt: must be an integer');
    }

    if (!isValidInteger(loginData.updatedAt)) {
      throw new Error('Invalid or missing updatedAt: must be an integer');
    }

    if (!isValidInteger(loginData.securityType, 0, 2)) {
      throw new Error('Invalid or missing securityType: must be an integer between 0 and 2');
    }

    const content = loginData?.content ? JSON.parse(loginData.content) : {};

    if (!content || typeof content !== 'object') {
      throw new Error('Invalid login content data');
    }

    if (!isValidInteger(content.iconType, 0, 2)) {
      throw new Error('Invalid or missing content.iconType: must be an integer between 0 and 2');
    }

    if (content.name !== undefined && !isValidString(content.name)) {
      throw new Error('Invalid content.name: must be a string');
    }

    if (content.username !== undefined && !isValidString(content.username)) {
      throw new Error('Invalid content.username: must be a string');
    }

    if (content.s_password !== undefined && !isValidBase64(content.s_password)) {
      throw new Error('Invalid content.s_password: must be a base64 string');
    }

    if (content.uris !== undefined) {
      if (!Array.isArray(content.uris)) {
        throw new Error('Invalid content.uris: must be an array');
      }

      content.uris.forEach((uri, index) => {
        if (!uri || typeof uri !== 'object') {
          throw new Error(`Invalid content.uris[${index}]: must be an object`);
        }

        if (typeof uri.text !== 'string') {
          throw new Error(`Invalid content.uris[${index}].text: must be a string`);
        }

        if (typeof uri.matcher !== 'string' && !Number.isInteger(uri.matcher)) {
          throw new Error(`Invalid content.uris[${index}].matcher: must be a string or integer`);
        }
      });
    }

    if (content.iconUriIndex !== undefined) {
      const urisLength = content.uris?.length || 0;

      if (!isValidInteger(content.iconUriIndex, 0, urisLength - 1)) {
        throw new Error(`Invalid content.iconUriIndex: must be an integer between 0 and ${urisLength - 1}`);
      }
    }

    if (content.labelText !== undefined && !isValidString(content.labelText)) {
      throw new Error('Invalid content.labelText: must be a string');
    }

    if (content.labelColor !== undefined && !isValidHexColor(content.labelColor)) {
      throw new Error('Invalid content.labelColor: must be a hex color string (3 or 6 characters)');
    }

    if (content.customImageUrl !== undefined && !isValidString(content.customImageUrl)) {
      throw new Error('Invalid content.customImageUrl: must be a string');
    }

    if (content.notes !== undefined && !isValidString(content.notes)) {
      throw new Error('Invalid content.notes: must be a string');
    }

    if (loginData.tags !== undefined && !isValidArray(loginData.tags, tag => isValidString(tag))) {
      throw new Error('Invalid tags: must be an array of strings');
    }

    this.id = loginData.id;
    this.deviceId = loginData.deviceId;
    this.createdAt = loginData.createdAt;
    this.updatedAt = loginData.updatedAt;
    this.securityType = loginData.securityType;
    this.name = content.name;
    this.username = content.username;
    this.s_password = content.s_password;
    this.uris = content.uris || [];
    this.iconType = content.iconType;
    this.iconUriIndex = content.iconUriIndex ?? null;
    this.labelText = content.labelText ?? null;
    this.labelColor = content.labelColor ?? null;
    this.customImageUrl = content.customImageUrl ?? null;
    this.notes = content.notes ?? null;
    this.tags = loginData.tags || [];
  }
}
