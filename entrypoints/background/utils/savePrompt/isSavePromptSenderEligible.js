// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isFrameSameRootDomain from './isFrameSameRootDomain';

/**
* Decides whether a prompt content-script message sender is allowed to capture
* credentials for the save-prompt pipeline. The top frame is always allowed; a
* sub-frame is allowed only when it shares the active tab's root domain.
*
* This is the background-side defence-in-depth companion to the content script's
* own same-site self-gate: even a forged PROMPT_INPUT from a cross-domain frame
* (whose browser-set `sender` cannot be spoofed) is dropped here.
*
* about:blank / about:srcdoc sub-frames are treated as ineligible (fail-closed):
* prompt.js tags captured inputs with `window.location.origin`, which is the
* opaque string "null" for such frames, so their data can never be matched to the
* submitting POST downstream (cleanTabsInputData / onWebRequest origin checks).
* Granting eligibility would therefore be dead — only http(s) sub-frames sharing
* the tab's root domain actually capture credentials, consistent with the
* webRequest frame gate (isProcessableWebRequestFrame).
* @async
* @param {Object} sender - The runtime message sender (browser-populated).
* @return {Promise<boolean>} True when the sender frame may capture credentials.
*/
const isSavePromptSenderEligible = async sender => {
  // Top frame is the page itself — always eligible, no lookup needed.
  if (sender?.frameId === 0) {
    return true;
  }

  const tabId = sender?.tab?.id;

  if (!tabId) {
    return false;
  }

  let tabUrl;

  try {
    const tab = await browser.tabs.get(tabId);
    tabUrl = tab?.url;
  } catch {}

  if (!tabUrl) {
    return false;
  }

  return isFrameSameRootDomain(sender?.url, tabUrl);
};

export default isSavePromptSenderEligible;
