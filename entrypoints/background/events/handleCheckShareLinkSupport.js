// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { getCurrentDevice } from '@/partials/functions';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

const handleCheckShareLinkSupport = sendResponse => {
  getConfiguredBoolean()
    .then(async configured => {
      if (!configured) {
        return false;
      }

      const device = await getCurrentDevice();
      return Array.isArray(device.supportedFeatures) &&
        device.supportedFeatures.includes('shareLink');
    })
    .then(supported => {
      sendResponse({ status: 'ok', supported });
    })
    .catch(() => {
      sendResponse({ status: 'ok', supported: false });
    });
};

export default handleCheckShareLinkSupport;
