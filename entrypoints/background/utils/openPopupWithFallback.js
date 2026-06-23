// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { openPopup } from '@/partials/functions';
import isFirefoxBelow149 from '@/partials/browserInfo/isFirefoxBelow149';
import openPopupWindowInNewWindow from './openPopupWindowInNewWindow';

/**
* Opens the extension popup, with a fallback for Firefox versions below 149.
* In the autofill path openPopup() runs after awaited operations (storage,
* getItems, sendMessageToAllFrames), so on Firefox < 149 — where
* browser.action.openPopup() still requires a user gesture — the gesture
* context is already lost and the call rejects silently. windows.create has no
* such requirement, so openPopupWindowInNewWindow() is used instead on those
* versions. On Firefox 149+ and every other browser the regular openPopup()
* (toolbar popup) is used.
* @async
* @return {Promise<void>} A promise that resolves when the popup is opened.
*/
const openPopupWithFallback = async () => {
  if (import.meta.env.BROWSER === 'firefox' && await isFirefoxBelow149()) {
    return openPopupWindowInNewWindow({ pathname: '' });
  }

  return openPopup();
};

export default openPopupWithFallback;
