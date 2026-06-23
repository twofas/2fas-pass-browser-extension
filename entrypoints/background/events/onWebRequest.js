// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { checkDomainOnIgnoredList, getValuesFromTabsInputData, checkServicesData, savePromptAction, cleanTabsInputData, addSavePromptAction, checkFormData, isProcessableWebRequestFrame, waitForTabInputData } from '../utils';
import { ignoredSavePromptUrls, ignoredSavePromptRequestBodyTexts } from '@/constants';
import isText from '@/partials/functions/isText';

/** 
* Function to handle web requests for saving prompts.
* @async
* @param {Object} details - The details of the web request.
* @param {Object} tabsInputData - Encrypted input data for the tabs.
* @param {Array} savePromptActions - The actions to save the prompt.
* @param {Object} tabUpdateData - Data for updating the tab.
* @return {Promise<void>} A promise that resolves when the web request is handled.
*/
const onWebRequest = async (details, tabsInputData, savePromptActions, tabUpdateData) => {
  // Handle beacon flush from content script (before any other filters)
  if (details?.type === 'ping' && details?.url?.startsWith(`https://${import.meta.env.VITE_BEACON}.invalid`)) {
    if (details?.requestBody?.raw?.[0]?.bytes && details?.tabId) {
      // Accept beacons from the top document or a same-root-domain sub-frame only;
      // resolve the tab url only for sub-frames (the common top-frame case skips it).
      let processable = isProcessableWebRequestFrame(details);

      if (!processable) {
        let beaconTabUrl;

        try {
          const beaconTab = await browser.tabs.get(details.tabId);
          beaconTabUrl = beaconTab?.url;
        } catch {}

        processable = isProcessableWebRequestFrame(details, beaconTabUrl);
      }

      if (!processable) {
        return;
      }

      try {
        const rawData = ArrayBufferToString(details.requestBody.raw[0].bytes);
        const inputs = JSON.parse(rawData);

        if (Array.isArray(inputs)) {
          if (!tabsInputData[details.tabId]) {
            tabsInputData[details.tabId] = {};
          }

          inputs.forEach(inputData => {
            if (inputData?.id) {
              tabsInputData[details.tabId][inputData.id] = inputData;
            }
          });
        }
      } catch {}
    }

    return;
  }

  // Base filters — cheap, synchronous, and run BEFORE any async work or waiting below so
  // ordinary GET traffic, bodyless / non-http POSTs, prerenders, pings, ignored URLs and
  // non-tab (tabId < 0) requests are rejected without cost.
  if (
    !details ||
    !details?.tabId ||
    details?.tabId < 0 ||
    !details?.method ||
    details?.method !== 'POST' ||
    !details?.requestBody ||
    details?.requestBody?.error ||
    details?.type === 'ping' ||
    !details?.url ||
    (details?.url.substring(0, 7) !== 'http://' && details.url.substring(0, 8) !== 'https://') ||
    details?.documentLifecycle === 'prerender' ||
    ignoredSavePromptUrls.some(ignoredUrl => details.url.toLowerCase().includes(ignoredUrl.toLowerCase()))
  ) {
    return;
  }

  const suppressed = await storage.getItem(`session:savePromptSuppressed-${details.tabId}`);

  if (suppressed) {
    return;
  }

  let tab;

  try {
    tab = await browser.tabs.get(details.tabId);
  } catch {}

  // Process the top document, plus same-root-domain sub-frames (login forms in
  // same-site iframes). Cross-root-domain sub-frames (e.g. SSO widgets) are rejected
  // — their credentials belong to the embedded site, not this page (finding #19).
  if (!isProcessableWebRequestFrame(details, tab?.url)) {
    return;
  }

  // The captured inputs live only in the in-memory tabsInputData, which the MV3 service
  // worker drops whenever it is recycled (frequently). When the worker is restarted
  // between the user typing credentials and submitting, this POST arrives with an empty
  // store and the save prompt silently never fires — for BOTH the encrypted and
  // unencrypted modes. The content script re-sends the values around submit (form-submit
  // flush + unload beacon), so give those a brief window to repopulate the store before
  // bailing. Runs only for genuine login-candidate POSTs (past the filters + frame gate
  // above) and returns immediately when the data is already present (the warm-worker case).
  await waitForTabInputData(tabsInputData, details?.tabId);

  // COMMENT THIS WHEN DEBUGGING SAVE PROMPT
  if (!tabsInputData || Object.keys(tabsInputData).length === 0 || !tabsInputData[details?.tabId] || tabsInputData[details?.tabId]?.length <= 0) {
    return;
  }
  // [END] COMMENT THIS WHEN DEBUGGING

  if (details?.requestBody?.raw && details.requestBody.raw.length > 0 && details.requestBody.raw[0].bytes) {
    let requestBodyRaw = '';

    try {
      requestBodyRaw = ArrayBufferToString(details.requestBody.raw[0].bytes);
    } catch {}

    if (
      requestBodyRaw &&
      requestBodyRaw.length > 0 &&
      isText(requestBodyRaw) &&
      ignoredSavePromptRequestBodyTexts.some(ignoredText => requestBodyRaw.toLowerCase().includes(ignoredText.toLowerCase()))
    ) {
      return;
    }
  }

  const tabInputs = structuredClone(tabsInputData[details.tabId]);

  let configured;

  try {
    configured = await getConfiguredBoolean();
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestConfiguredError, { event: e });
  }

  if (!configured) {
    return;
  }

  let storageSavePrompt = null;
  let domainOnIgnoredList;

  try {
    storageSavePrompt = await storage.getItem('local:savePrompt');

    const tabUrlIgnored = tab?.url ? await checkDomainOnIgnoredList(tab.url) : false;
    const requestUrlIgnored = details?.url ? await checkDomainOnIgnoredList(details.url) : false;
    domainOnIgnoredList = tabUrlIgnored || requestUrlIgnored;
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestDomainIgnoredListError, { event: e });
  }

  if (!storageSavePrompt) {
    storageSavePrompt = 'default';
    await storage.setItem('local:savePrompt', storageSavePrompt);
  }

  if (
    (storageSavePrompt !== 'default' && storageSavePrompt !== 'default_encrypted') || // Only when savePrompt is set to default or default_encrypted
    domainOnIgnoredList // Only when domain is not on the ignored list
  ) {
    return;
  }

  // Cleanup tabsInputData for this tab ID
  tabsInputData[details.tabId] = cleanTabsInputData(details, tabInputs, tab?.url);

  // Only when tabsInputData exists for this tab ID
  if (!tabsInputData || !tabsInputData[details.tabId] || tabsInputData[details.tabId]?.length <= 0) {
    return;
  }

  // Only when both username and password exist
  const values = getValuesFromTabsInputData(tabsInputData[details.tabId]);

  if (!values?.password || !values?.username) {
    return;
  }

  const formDataOk = await checkFormData(details, values);

  if (!formDataOk) {
    return;
  }

  // Only when combination of username && password doesn't exist in the storage
  let serviceTypeData;

  try {
    serviceTypeData = await checkServicesData(details, values, tab?.url);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestCheckServicesDataError, { event: e });
  }

  if (!serviceTypeData) {
    return;
  }

  // Action
  try {
    await addSavePromptAction(details, serviceTypeData, values, savePromptActions);
    await savePromptAction(details, serviceTypeData, tabsInputData, values, savePromptActions, tabUpdateData);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestSavePromptActionError, { event: e });
  }
};

export default onWebRequest;
