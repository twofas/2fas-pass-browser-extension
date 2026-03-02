// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import TwoFasWebSocket from '../../websocket';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import getItems from '@/partials/sessionStorage/getItems';
import badgeState from './badgeState';
import setBadgeConnecting from './setBadgeConnecting';
import setBadgeLocked from './setBadgeLocked';
import updateBadge from './updateBadge';

const restoreBadge = async () => {
  const configured = await getConfiguredBoolean();

  if (configured) {
    const items = await getItems(['Login', 'PaymentCard']).catch(() => []);
    await updateBadge(true, items).catch(() => {});
  } else {
    await setBadgeLocked().catch(() => {});
  }
};

const initBadgeState = () => {
  TwoFasWebSocket.addStateListener(async isActive => {
    badgeState.connecting = isActive;

    try {
      if (isActive) {
        await setBadgeConnecting();
      } else {
        await restoreBadge();
      }
    } catch {
      await setBadgeLocked().catch(() => {});
    }
  });

  (async () => {
    try {
      await restoreBadge();
    } catch {
      await setBadgeLocked().catch(() => {});
    }
  })();
};

export default initBadgeState;
