// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import onMessage from './onMessage';
import onPromptMessage from './onPromptMessage';
import onWsMessage from './onWsMessage';
import handleE2EMessage from '../devE2E';

const createMessageRouter = ({ migrations, tabsInputData, savePromptActions, tabUpdateData }) => (request, sender, sendResponse) => {
  if (sender.id !== browser.runtime.id) {
    return false;
  }

  if (!request || !request.action || !request.target) {
    return false;
  }

  switch (request.target) {
    case REQUEST_TARGETS.BACKGROUND:
      return onMessage(request, sender, sendResponse, migrations, savePromptActions, tabUpdateData, tabsInputData);

    case REQUEST_TARGETS.BACKGROUND_PROMPT:
      return onPromptMessage(request, sender, sendResponse, tabsInputData);

    case REQUEST_TARGETS.BACKGROUND_WS:
      return onWsMessage(request, sender, sendResponse);

    default:
      // DEV-only autofill E2E harness seam (tests/e2e/autofill). Stripped from prod.
      if (import.meta.env.DEV && request.target === 'e2e') {
        return handleE2EMessage(request, sendResponse);
      }

      return false;
  }
};

export default createMessageRouter;
