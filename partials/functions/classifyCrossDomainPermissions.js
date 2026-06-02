// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Pure classification of the cross-domain hostnames that require a permission
* decision before iframe autofill.
*
* Only hostnames that actually reported an autofillable login/card form
* (needsPermission: true) should reach this function. Frames that never responded
* to CHECK_IFRAME_PERMISSION must NOT be passed in: they are denied by default
* (omitted from crossDomainAllowedDomains, so they cannot be silently autofilled)
* and the user must not be prompted to trust unrelated third-party tracking/ad
* iframes (doubleclick/adsrvr/etc.) embedded on the page.
*
* @param {Set<string>|string[]} hostnames - Cross-domain hostnames that reported a form.
* @param {string[]} [trustedList] - Hostnames the user previously trusted.
* @param {string[]} [untrustedList] - Hostnames the user previously blocked.
* @return {{needsDialog: boolean, allAllowed: boolean, allBlocked: boolean,
*   trustedDomains: string[], untrustedDomains: string[], unknownDomains: string[],
*   crossDomainAllowedDomains: string[]}} Classification result.
*/
const classifyCrossDomainPermissions = (hostnames, trustedList = [], untrustedList = []) => {
  const result = {
    needsDialog: false,
    allAllowed: true,
    allBlocked: false,
    trustedDomains: [],
    untrustedDomains: [],
    unknownDomains: [],
    crossDomainAllowedDomains: []
  };

  const domains = hostnames instanceof Set
    ? [...hostnames]
    : (Array.isArray(hostnames) ? hostnames : []);

  const trusted = Array.isArray(trustedList) ? trustedList : [];
  const untrusted = Array.isArray(untrustedList) ? untrustedList : [];

  if (domains.length === 0) {
    return result;
  }

  for (const domain of domains) {
    if (trusted.includes(domain)) {
      result.trustedDomains.push(domain);
      result.crossDomainAllowedDomains.push(domain);
    } else if (untrusted.includes(domain)) {
      result.untrustedDomains.push(domain);
    } else {
      result.unknownDomains.push(domain);
    }
  }

  if (result.unknownDomains.length > 0) {
    result.needsDialog = true;
    result.allAllowed = false;
  } else if (result.untrustedDomains.length > 0 && result.trustedDomains.length === 0) {
    result.allAllowed = false;
    result.allBlocked = true;
  } else if (result.untrustedDomains.length > 0) {
    result.allAllowed = false;
  }

  return result;
};

export default classifyCrossDomainPermissions;
