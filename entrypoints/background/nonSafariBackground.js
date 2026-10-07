// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { onIdleStateChange, onUpdateAvailable } from './events';

/**
* Function to handle non-Safari background tasks. The save prompt webRequest listener is registered by registerSavePromptWebRequest.
* @return {void}
*/
const nonSafariBackground = () => {
  browser.idle.onStateChanged.addListener(onIdleStateChange);
  browser.runtime.onUpdateAvailable.addListener(onUpdateAvailable);
};

export default nonSafariBackground;
