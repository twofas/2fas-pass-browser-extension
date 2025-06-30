// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isText from './isText';
import { filterXSS } from 'xss';

/** 
* Sanitize object to prevent XSS attacks.
* @param {Object} service - The object to sanitize.
* @return {Object} The sanitized object.
*/
const sanitizeObject = service => {
  // FUTURE - Add tests
  const sanitize = obj => {
    if (!obj) {
      return obj;
    }

    const keys = Object.keys(obj);

    keys.forEach(key => {
      if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach(item => {
          sanitize(item);
        });
      } else {
        // Do not sanitize password
        if (key === 'password') {
          return;
        }

        if (obj && key && obj[key] && isText(obj[key])) {
          obj[key] = filterXSS(obj[key]);
        }
      }
    });

    return obj;
  };

  return sanitize(service);
};

export default sanitizeObject;
