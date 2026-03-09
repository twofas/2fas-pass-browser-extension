// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { wsState } from './wsState.js';
import { cancelCurrentAction } from './wsManager.js';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';

const onPopupDisconnect = async () => {
  if (wsState.type !== 'connect_qr' || !wsState.active) {
    return;
  }

  const isConfigured = await getConfiguredBoolean();

  if (isConfigured) {
    return;
  }

  await cancelCurrentAction();
};

export default onPopupDisconnect;
