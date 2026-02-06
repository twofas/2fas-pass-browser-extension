// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Saves cross-domain autofill preferences for domains based on user choices.
* @async
* @param {Object} domainPreferences - Map of domain → preference.
*   Keys are domain hostnames, values are 'always_autofill', 'never_autofill', or 'always_ask'.
* @return {Promise<void>}
*/
const saveCrossDomainPreferences = async domainPreferences => {
  if (!domainPreferences || typeof domainPreferences !== 'object') {
    return;
  }

  let trustedList = [];
  let untrustedList = [];

  try {
    const stored = await storage.getItem('local:crossDomainTrustedDomains');
    trustedList = stored || [];
  } catch { }

  try {
    const stored = await storage.getItem('local:crossDomainUntrustedDomains');
    untrustedList = stored || [];
  } catch { }

  let modified = false;

  for (const [domain, preference] of Object.entries(domainPreferences)) {
    if (preference === 'always_autofill') {
      if (!trustedList.includes(domain)) {
        trustedList.push(domain);
        modified = true;
      }

      const untrustedIndex = untrustedList.indexOf(domain);

      if (untrustedIndex !== -1) {
        untrustedList.splice(untrustedIndex, 1);
        modified = true;
      }
    } else if (preference === 'never_autofill') {
      if (!untrustedList.includes(domain)) {
        untrustedList.push(domain);
        modified = true;
      }

      const trustedIndex = trustedList.indexOf(domain);

      if (trustedIndex !== -1) {
        trustedList.splice(trustedIndex, 1);
        modified = true;
      }
    }
  }

  if (modified) {
    await storage.setItem('local:crossDomainTrustedDomains', trustedList);
    await storage.setItem('local:crossDomainUntrustedDomains', untrustedList);
  }
};

export default saveCrossDomainPreferences;
