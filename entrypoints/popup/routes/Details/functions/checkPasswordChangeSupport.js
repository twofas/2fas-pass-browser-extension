// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from '@/partials/URIMatcher';

const WELL_KNOWN_CHANGE_PASSWORD_PATH = '/.well-known/change-password';
const WELL_KNOWN_RELIABILITY_PATH = '/.well-known/resource-that-should-not-exist-whose-status-code-should-not-be-200';

const WELL_KNOWN_FETCH_OPTIONS = {
  method: 'HEAD',
  redirect: 'follow',
  cache: 'no-cache'
};

/**
 * Checks whether an origin reports reliable response status codes.
 * Some servers (e.g. SPAs) answer with an ok status to any path ("soft 404"),
 * which makes the change password check report a false positive. Following the
 * W3C "response code reliability" test, the origin is only trusted when a path
 * that should not exist returns a non-ok status.
 * @async
 * @param {string} origin - The origin (protocol + hostname) to test
 * @return {Promise<boolean>} True when the origin returns a non-ok status for a path that should not exist
 */
async function isOriginStatusReliable (origin) {
  try {
    const response = await fetch(`${origin}${WELL_KNOWN_RELIABILITY_PATH}`, {
      ...WELL_KNOWN_FETCH_OPTIONS,
      signal: AbortSignal.timeout(3000)
    });

    return !response.ok;
  } catch {
    return false;
  }
}

/**
 * Checks if a URL supports the well-known change password URL mechanism
 * @async
 * @param {string} url - The URL to check
 * @return {Promise<string|null>} The change password URL if supported, null otherwise
 */
async function checkPasswordChangeSupport (url) {
  try {
    const normalizedUrl = URIMatcher.normalizeUrl(url);
    const parsedUrl = new URL(normalizedUrl);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    const wellKnownUrl = `${origin}${WELL_KNOWN_CHANGE_PASSWORD_PATH}`;

    const response = await fetch(wellKnownUrl, {
      ...WELL_KNOWN_FETCH_OPTIONS,
      signal: AbortSignal.timeout(3000)
    });

    if (
      response.status !== 200 &&
      response.status !== 302 &&
      response.status !== 303 &&
      response.status !== 307
    ) {
      return null;
    }

    const reliable = await isOriginStatusReliable(origin);

    if (!reliable) {
      return null;
    }

    return wellKnownUrl;
  } catch {
    return null;
  }
}

/**
 * Gets all parent domains from a URL (iterating through subdomain levels)
 * @param {string} url - The URL to process
 * @return {Array<string>} Array of parent domain URLs from most specific to least specific
 */
function getAllParentDomains (url) {
  try {
    const normalizedUrl = URIMatcher.normalizeUrl(url);
    const parsedUrl = new URL(normalizedUrl);
    const hostParts = parsedUrl.hostname.split('.');
    const parentDomains = [];
    
    for (let i = 1; i < hostParts.length - 1; i++) {
      const parentDomain = hostParts.slice(i).join('.');
      parentDomains.push(`${parsedUrl.protocol}//${parentDomain}`);
    }
    
    return parentDomains;
  } catch {
    return [];
  }
}

/**
 * Checks multiple URIs for password change support
 * @param {Array} uris - Array of URI objects
 * @return {Promise<string|null>} The first valid change password URL found, or null
 */
export async function findPasswordChangeUrl (uris) {
  if (!uris || uris.length === 0) {
    return null;
  }
  
  for (const uri of uris) {
    if (!uri?.text) continue;
    
    let urlToCheck;
    try {
      urlToCheck = URIMatcher.normalizeUrl(uri.text);
    } catch {
      continue;
    }
    
    if (URIMatcher.isIp(urlToCheck)) {
      continue;
    }

    const changePasswordUrl = await checkPasswordChangeSupport(urlToCheck);
    if (changePasswordUrl) {
      return changePasswordUrl;
    }
  }
  
  const parentDomainsToCheck = [];
  const addedDomains = new Set();
  
  for (const uri of uris) {
    if (!uri?.text) continue;
    
    let urlToCheck = uri.text;
    
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = `https://${urlToCheck}`;
    }
    
    try {
      const normalizedUrl = URIMatcher.normalizeUrl(urlToCheck);

      if (URIMatcher.isIp(normalizedUrl)) {
        continue;
      }
    } catch {
      continue;
    }
    
    const parentDomains = getAllParentDomains(urlToCheck);
    for (const domain of parentDomains) {
      if (!addedDomains.has(domain)) {
        addedDomains.add(domain);
        parentDomainsToCheck.push(domain);
      }
    }
  }
  
  for (const parentDomain of parentDomainsToCheck) {
    const changePasswordUrl = await checkPasswordChangeSupport(parentDomain);
    if (changePasswordUrl) {
      return changePasswordUrl;
    }
  }
  
  return null;
}

export default findPasswordChangeUrl;