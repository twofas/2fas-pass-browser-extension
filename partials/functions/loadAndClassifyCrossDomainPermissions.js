// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import classifyCrossDomainPermissions from './classifyCrossDomainPermissions.js';

/**
* Loads the persisted trusted/untrusted cross-domain hostname lists from storage
* and classifies the supplied hostnames against them.
*
* Thin async wrapper around the pure classifyCrossDomainPermissions so the storage
* reads live in a single place instead of being duplicated across
* resolveCrossDomainPermissions and the handleAutofill*WithPermission handlers.
* Missing or unreadable lists default to empty arrays (fail-closed classification).
* @async
* @param {Set<string>|string[]} hostnames - Cross-domain hostnames that reported a form.
* @return {Promise<{needsDialog: boolean, allAllowed: boolean, allBlocked: boolean,
*   trustedDomains: string[], untrustedDomains: string[], unknownDomains: string[],
*   crossDomainAllowedDomains: string[]}>} Classification result.
*/
const loadAndClassifyCrossDomainPermissions = async hostnames => {
  let trustedList = [];
  let untrustedList = [];

  try {
    trustedList = (await storage.getItem('local:crossDomainTrustedDomains')) || [];
  } catch { }

  try {
    untrustedList = (await storage.getItem('local:crossDomainUntrustedDomains')) || [];
  } catch { }

  return classifyCrossDomainPermissions(hostnames, trustedList, untrustedList);
};

export default loadAndClassifyCrossDomainPermissions;
