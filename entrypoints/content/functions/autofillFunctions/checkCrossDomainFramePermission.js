// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isTopFrame from '@/partials/functions/isTopFrame';
import getFrameHostname from '@/partials/functions/getFrameHostname';

/**
* Decides whether the current frame may be autofilled for a cross-domain request.
* Single source of truth shared by autofill() (login) and autofillCard() (card), so
* the cross-domain gate can never drift between the two paths. The decision is
* fail-closed: a cross-domain frame is only allowed when it is explicitly listed in
* request.crossDomainAllowedDomains, or — when that list is absent —
* request.iframePermissionGranted is set.
* @param {Object} request - The autofill request.
* @param {string[]} [request.crossDomainAllowedDomains] - Hostnames allowed for cross-domain autofill.
* @param {boolean} [request.iframePermissionGranted] - Whether cross-domain permission was granted.
* @return {{allowed: boolean, frameHostname: string}} Whether the frame may be filled and its resolved hostname.
*/
const checkCrossDomainFramePermission = request => {
  if (isTopFrame()) {
    return { allowed: true, frameHostname: '' };
  }

  const frameHostname = getFrameHostname();
  let isCrossDomain = false;

  try {
    const topHostname = new URL(window.top.location.href).hostname;
    isCrossDomain = frameHostname !== topHostname;
  } catch {
    isCrossDomain = true;
  }

  if (!isCrossDomain) {
    return { allowed: true, frameHostname };
  }

  if (request.crossDomainAllowedDomains) {
    return { allowed: request.crossDomainAllowedDomains.includes(frameHostname), frameHostname };
  }

  return { allowed: Boolean(request.iframePermissionGranted), frameHostname };
};

export default checkCrossDomainFramePermission;
