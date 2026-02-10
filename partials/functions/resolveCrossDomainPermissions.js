// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import sendMessageToAllFrames from './sendMessageToAllFrames.js';
import injectCSIfNotAlready from '@/partials/contentScript/injectCSIfNotAlready.js';

/**
* Resolves cross-domain permissions for iframe autofill by classifying
* each cross-domain iframe's hostname as trusted, untrusted, or unknown.
* @async
* @param {number} tabId - The ID of the tab to check.
* @param {string} autofillType - The type of autofill ('login' or 'card').
* @param {Object} [dataFields] - Flags indicating which data fields are available for autofill.
* @return {Promise<Object>} Classification result with needsDialog, allAllowed, allBlocked,
*   trustedDomains, untrustedDomains, unknownDomains arrays.
*/
const resolveCrossDomainPermissions = async (tabId, autofillType, dataFields) => {
  const result = {
    needsDialog: false,
    allAllowed: true,
    allBlocked: false,
    trustedDomains: [],
    untrustedDomains: [],
    unknownDomains: [],
    crossDomainAllowedDomains: []
  };

  try {
    await injectCSIfNotAlready(tabId, REQUEST_TARGETS.CONTENT);
  } catch (e) {
    await CatchError(e);
  }

  let permissionResults;

  try {
    permissionResults = await sendMessageToAllFrames(tabId, {
      action: REQUEST_ACTIONS.CHECK_IFRAME_PERMISSION,
      target: REQUEST_TARGETS.CONTENT,
      autofillType,
      dataFields
    });
  } catch (e) {
    await CatchError(e);
    return result;
  }

  const crossDomainFrames = permissionResults?.filter(r => r.needsPermission) || [];

  if (crossDomainFrames.length === 0) {
    return result;
  }

  const uniqueDomains = [...new Set(crossDomainFrames.map(f => f.frameInfo?.hostname).filter(Boolean))];

  if (uniqueDomains.length === 0) {
    return result;
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

  for (const domain of uniqueDomains) {
    if (trustedList.includes(domain)) {
      result.trustedDomains.push(domain);
      result.crossDomainAllowedDomains.push(domain);
    } else if (untrustedList.includes(domain)) {
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

export default resolveCrossDomainPermissions;
