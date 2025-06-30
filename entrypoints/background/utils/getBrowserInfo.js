// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global navigator */
import getOSName from './getOSName';
import isBrave from './isBrave';
import getBrowserVersion from './getBrowserVersion';
import { v4 as uuidv4 } from 'uuid';

/** 
* Function to get browser information including name, version, and OS.
* @return {Object} An object containing the browser name, version, and OS.
*/
const getBrowserInfo = () => {
  const randomID = uuidv4().substring(0, 4);
  const osName = getOSName();
  const userAgent = navigator.userAgent;
  let browserName = 'unknown';
  let browserVersion = null;

  const nameRegex = {
    UCBrowser: /ucbrowser/i,
    Edge: /edg/i,
    Vivaldi: /vivaldi/i,
    Chromium: /chromium/i,
    Firefox: /firefox|fxios/i,
    Seamonkey: /seamonkey/i,
    Chrome: /chrome|crios/i,
    NotChrome: /opr|opera|chromium|edg|ucbrowser/i,
    Safari: /safari/i,
    NotSafari: /chromium|edg|ucbrowser|chrome|crios|opr|opera|fxios|firefox/i,
    Opera: /opr|opera/i
  };

  const versionRegex = {
    UCBrowser: /(ucbrowser)\/([\d\.]+)/i,
    Edge: /(edge|edga|edgios|edg)\/([\d\.]+)/i,
    Chromium: /(chromium)\/([\d\.]+)/i,
    Firefox: /(firefox|fxios)\/([\d\.]+)/i,
    Chrome: /(chrome|crios)\/([\d\.]+)/i,
    Brave: /(chrome|crios)\/([\d\.]+)/i,
    Safari: /(safari)\/([\d\.]+)/i,
    Opera: /(opera|opr)\/([\d\.]+)/i,
    Vivaldi: /(vivaldi)\/([\d\.]+)/i
  };

  // Detect browser name
  if (nameRegex.UCBrowser.test(userAgent)) {
    browserName = 'UCBrowser';
  } else if (nameRegex.Edge.test(userAgent)) {
    browserName = 'Edge';
  } else if (nameRegex.Vivaldi.test(userAgent)) {
    browserName = 'Vivaldi';
  } else if (nameRegex.Chromium.test(userAgent)) {
    browserName = 'Chromium';
  } else if (nameRegex.Firefox.test(userAgent) && !nameRegex.Seamonkey.test(userAgent)) {
    browserName = 'Firefox';
  } else if (nameRegex.Chrome.test(userAgent) && !nameRegex.NotChrome.test(userAgent)) {
    if (isBrave()) {
      browserName = 'Brave';
    } else {
      browserName = 'Chrome';
    }
  } else if (nameRegex.Safari.test(userAgent) && !nameRegex.NotSafari.test(userAgent)) {
    browserName = 'Safari';
  } else if (nameRegex.Opera.test(userAgent)) {
    browserName = 'Opera';
  }

  browserVersion = getBrowserVersion(userAgent, versionRegex[browserName]);

  return {
    name: `${browserName} ${browser.i18n.getMessage('background_get_browser_info_on')} ${osName} (${randomID})`,
    browserName,
    browserVersion
  };
};

export default getBrowserInfo;
