// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { sendMessageToTab, getCurrentDevice } from '@/partials/functions';

const notifyShareTabs = async configured => {
  let supported = false;

  if (configured) {
    try {
      const device = await getCurrentDevice();
      supported = Array.isArray(device.supportedFeatures) &&
        device.supportedFeatures.includes('shareLink');
    } catch {}
  }

  const shareUrl = import.meta.env.VITE_SHARE_API_URL;

  if (!shareUrl) {
    return;
  }

  let tabs;

  try {
    tabs = await browser.tabs.query({ url: `${shareUrl}/*` });
  } catch {
    return;
  }

  if (!tabs?.length) {
    return;
  }

  const message = {
    action: REQUEST_ACTIONS.SHARE_LINK_STATE_CHANGE,
    target: REQUEST_TARGETS.SHARE_CONTENT,
    supported
  };

  await Promise.all(
    tabs.map(tab => sendMessageToTab(tab.id, message).catch(() => {}))
  );
};

export default notifyShareTabs;
