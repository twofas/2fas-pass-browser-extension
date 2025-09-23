// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { checkDomainOnIgnoredList, getValuesFromTabsInputData, checkServicesData, savePromptAction, cleanTabsInputData, addSavePromptAction, checkFormData } from '../utils';
import { allowedSavePromptRequests, ignoredSavePromptUrls, ignoredSavePromptRequestBodyTexts } from '@/constants';
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
  // COMMENT THIS WHEN DEBUGGING SAVE PROMPT
  if (!tabsInputData || Object.keys(tabsInputData).length === 0 || !tabsInputData[details?.tabId] || tabsInputData[details?.tabId]?.length <= 0) {
    return;
  }
  // [END] COMMENT THIS WHEN DEBUGGING

  // Base filters
  if (
    !details ||
    !details?.tabId ||
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

  if (details?.frameType) {
    if (details.frameType !== 'outermost_frame') {
      return;
    }
  } else {
    if (details?.parentFrameId !== -1) {
      return;
    }
  }

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
    domainOnIgnoredList = await checkDomainOnIgnoredList(details?.initiator || details?.originUrl); // FUTURE - initiator or originUrl first?
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
  tabsInputData[details.tabId] = cleanTabsInputData(details, tabInputs);

  // Only when tabsInputData exists for this tab ID
  if (!tabsInputData || !tabsInputData[details.tabId] || tabsInputData[details.tabId]?.length <= 0) {
    return;
  }

  // Only when password exists
  const values = getValuesFromTabsInputData(tabsInputData[details.tabId]);

  if (!values?.password) {
    return;
  }

  // Check if requestBody.formData exists and it includes a password and username field
  const formDataOk = await checkFormData(details, values);

  // FUTURE - Check if this is correct way to check
  // Check if details.url contains any of the allowedSavePromptRequests
  const urlContainsAllowedRequest = allowedSavePromptRequests.some(request => details?.url?.toLowerCase().includes(request.toLowerCase()));

  if (!urlContainsAllowedRequest || !formDataOk) {
    return;
  }

  // Only when combination of username && password doesn't exist in the storage
  let serviceTypeData;

  try {
    serviceTypeData = await checkServicesData(details, values);
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
