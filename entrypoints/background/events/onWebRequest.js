// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { checkDomainOnIgnoredList, getValuesFromTabsInputData, checkServicesData, savePromptAction, cleanTabsInputData, addSavePromptAction, checkFormData, isProcessableWebRequestFrame, waitForTabInputData } from '../utils';
import isSavePromptBeaconRequest, { isSavePromptBeaconType } from '../utils/savePrompt/isSavePromptBeaconRequest';
import requestBodyBytesToString from '../utils/savePrompt/requestBodyBytesToString';
import hasCredentialPairForOrigin from '../utils/savePrompt/hasCredentialPairForOrigin';
import waitForMatchingCredentials from '../utils/savePrompt/waitForMatchingCredentials';
import { isIgnoredSavePromptUrl, hasIgnoredSavePromptBodyField } from '../utils/savePrompt/savePromptIgnoreRules';
import parseRequestBody from '../utils/savePrompt/parseRequestBody';
import { isSavePromptSuppressedForDomain } from '../utils/savePrompt/savePromptDomainSuppression';
import getPageUrl from '@/partials/functions/getPageUrl';
import { getCurrentLocalKeyId, isStalePromptInput, dropStalePromptInputs, hasEncryptedPromptInputs } from '../utils/savePrompt/promptInputKeyId';

/** 
* Function to handle web requests for saving prompts.
* @async
* @param {Object} details - The details of the web request.
* @param {Object} tabsInputData - Encrypted input data for the tabs.
* @param {Array} savePromptActions - The actions to save the prompt.
* @return {Promise<void>} A promise that resolves when the web request is handled.
*/
const onWebRequest = async (details, tabsInputData, savePromptActions) => {
  // Handle beacon flush from content script (before any other filters)
  if (isSavePromptBeaconRequest(details)) {
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
        const rawData = requestBodyBytesToString(details.requestBody.raw[0].bytes);
        const inputs = JSON.parse(rawData);

        if (Array.isArray(inputs)) {
          if (!tabsInputData[details.tabId]) {
            tabsInputData[details.tabId] = {};
          }

          const currentKeyId = await getCurrentLocalKeyId();

          inputs.forEach(inputData => {
            if (inputData?.id && !isStalePromptInput(inputData, currentKeyId)) {
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
    isSavePromptBeaconType(details) ||
    !details?.url ||
    (details?.url.substring(0, 7) !== 'http://' && details.url.substring(0, 8) !== 'https://') ||
    details?.documentLifecycle === 'prerender' ||
    isIgnoredSavePromptUrl(details.url)
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

  // A fetch & autofill filled a secret that is not saved, so the vault cannot recognise it: no prompt in this tab
  // until it leaves the domain.
  if (await isSavePromptSuppressedForDomain(details.tabId, tab?.url || details.url)) {
    return;
  }

  // Settings first: nothing below (key ids, the wait for inputs) is worth doing while the vault is locked, the save
  // prompt is off or the domain is ignored.
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

  // Inputs encrypted before a lock rotated the local key can never be decrypted; dropping them lets the wait below
  // pick up the values the page resends with the current key.
  if (hasEncryptedPromptInputs(tabsInputData, details.tabId)) {
    dropStalePromptInputs(tabsInputData, details.tabId, await getCurrentLocalKeyId());
  }

  // The captured inputs live only in the in-memory tabsInputData, which the MV3 service
  // worker drops whenever it is recycled (frequently). When the worker is restarted
  // between the user typing credentials and submitting, this POST arrives with an empty
  // store and the save prompt silently never fires — for BOTH the encrypted and
  // unencrypted modes. The content script re-sends the values around submit (form-submit
  // flush + unload beacon), so give those a brief window to repopulate the store before
  // bailing. Runs only for genuine login-candidate POSTs (past the filters + frame gate
  // above) and returns immediately when the data is already present (the warm-worker case).
  //
  // Wait for the whole pair, not for any input: a username captured earlier must not end the wait while the
  // password typed just before submitting is still on its way (debounce, encryption).
  let pageOrigin = '';

  try {
    pageOrigin = new URL(getPageUrl(details, tab?.url)).origin;
  } catch {}

  await waitForTabInputData(tabsInputData, details?.tabId, { isReady: inputs => hasCredentialPairForOrigin(inputs, pageOrigin) });

  // COMMENT THIS WHEN DEBUGGING SAVE PROMPT
  if (!tabsInputData || Object.keys(tabsInputData).length === 0 || !tabsInputData[details?.tabId] || tabsInputData[details?.tabId]?.length <= 0) {
    return;
  }
  // [END] COMMENT THIS WHEN DEBUGGING

  const requestBody = parseRequestBody(details);

  // Only when the body carries the latest captured username and password. They are read again for a short while: a
  // password typed again after a failed attempt may still be on its way while the old one is stored.
  const values = await waitForMatchingCredentials(async () => {
    const tabInputs = structuredClone(tabsInputData[details.tabId] || {});
    tabsInputData[details.tabId] = cleanTabsInputData(details, tabInputs, tab?.url);

    const currentValues = getValuesFromTabsInputData(tabsInputData[details.tabId]);

    if (!currentValues?.password || !currentValues?.username) {
      return null;
    }

    return await checkFormData(details, currentValues, requestBody.texts) ? currentValues : null;
  }, hasIgnoredSavePromptBodyField(details, requestBody) ? { maxWait: 0 } : undefined);

  if (!values) {
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
    await savePromptAction(details, serviceTypeData, tabsInputData, values, savePromptActions);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestSavePromptActionError, { event: e });
  }
};

export default onWebRequest;
