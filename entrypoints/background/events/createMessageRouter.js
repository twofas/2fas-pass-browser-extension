// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import onMessage from './onMessage';
import onPromptMessage from './onPromptMessage';
import onWsMessage from './onWsMessage';

const createMessageRouter = ({ migrations, tabsInputData }) => (request, sender, sendResponse) => {
  if (!request || !request.action || !request.target) {
    return false;
  }

  switch (request.target) {
    case REQUEST_TARGETS.BACKGROUND:
      return onMessage(request, sender, sendResponse, migrations);

    case REQUEST_TARGETS.BACKGROUND_PROMPT:
      return onPromptMessage(request, sender, sendResponse, tabsInputData);

    case REQUEST_TARGETS.BACKGROUND_WS:
      return onWsMessage(request, sender, sendResponse);

    default:
      return false;
  }
};

export default createMessageRouter;
