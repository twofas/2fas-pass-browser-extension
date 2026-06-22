// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Default total time onWebRequest waits for a tab's captured inputs to appear.
* @type {number}
*/
const DEFAULT_MAX_WAIT = 600; // milliseconds

/**
* Default polling step while waiting for captured inputs.
* @type {number}
*/
const DEFAULT_STEP = 50; // milliseconds

/**
* Waits briefly for a tab's captured save-prompt inputs to be present in the
* in-memory store before the caller decides to bail.
*
* The captured credentials live only in the in-memory tabsInputData object, which
* the MV3 service worker drops every time it is recycled (frequently — observed at
* a median of ~16s on Chrome). When the worker is restarted between the user typing
* credentials and submitting the form, the submitting POST reaches onWebRequest with
* an empty store and the save prompt silently never fires. The content script already
* re-sends the values around submit (the form-submit flush and the unload beacon), so
* this gives those messages a short window to repopulate the store first. Resolves
* immediately when data is already present (the warm-worker common case), so it adds
* no latency unless the store was actually lost.
* @async
* @param {Object} tabsInputData - The in-memory per-tab captured input store.
* @param {number} tabId - The id of the tab whose inputs are awaited.
* @param {Object} [options] - Optional timing overrides.
* @param {number} [options.maxWait=600] - Total time to wait in milliseconds.
* @param {number} [options.step=50] - Polling interval in milliseconds.
* @return {Promise<boolean>} True when the tab has captured inputs, false on timeout.
*/
const waitForTabInputData = async (tabsInputData, tabId, options = {}) => {
  const maxWait = typeof options.maxWait === 'number' ? options.maxWait : DEFAULT_MAX_WAIT;
  const step = typeof options.step === 'number' ? options.step : DEFAULT_STEP;

  const hasData = () => Boolean(tabsInputData && tabId && tabsInputData[tabId] && Object.keys(tabsInputData[tabId]).length > 0);

  if (hasData()) {
    return true;
  }

  let waited = 0;

  while (waited < maxWait) {
    await new Promise(resolve => setTimeout(resolve, step));
    waited += step;

    if (hasData()) {
      return true;
    }
  }

  return hasData();
};

export default waitForTabInputData;
