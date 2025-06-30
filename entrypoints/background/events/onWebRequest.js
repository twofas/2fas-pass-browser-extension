// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import checkDomainOnIgnoredList from '../utils/savePrompt/checkDomainOnIgnoredList';
import getValuesFromTabsInputData from '../utils/savePrompt/getValuesFromTabsInputData';
import checkServicesData from '../utils/savePrompt/checkServicesData';
import savePromptAction from '../utils/savePrompt/savePromptAction';
import allowedSavePromptRequests from '@/constants/allowedSavePromptRequests';
import ignoredSavePromptUrls from '@/constants/ignoredSavePromptUrls';
import ignoredSavePromptRequestBodyTexts from '@/constants/ignoredSavePromptRequestBodyTexts';
import cleanTabsInputData from '../utils/savePrompt/cleanTabsInputData';
import addSavePromptAction from '../utils/savePrompt/addSavePromptAction';
import isText from '@/partials/functions/isText';
import checkFormData from '../utils/savePrompt/checkFormData';

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
  if (!tabsInputData || Object.keys(tabsInputData).length === 0 || !tabsInputData[details?.tabId]) {
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
    details.url.substring(0, 8) !== 'https://' ||
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

  let storageSavePrompt = null;
  let domainOnIgnoredList;

  try {
    storageSavePrompt = await storage.getItem('local:savePrompt');
    domainOnIgnoredList = await checkDomainOnIgnoredList(details?.initiator || details?.originUrl);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestDomainIgnoredListError, { event: e });
  }

  if (!storageSavePrompt) {
    storageSavePrompt = 'default';
    await storage.setItem('local:savePrompt', storageSavePrompt);
  }

  if (
    !configured || // Only when configured
    storageSavePrompt !== 'default' || // Only when savePrompt is set to default
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

  if (!urlContainsAllowedRequest && !formDataOk) {
    return;
  }

  // Only when combination of username && password doesn't exist in the storage
  let serviceType;

  try {
    serviceType = await checkServicesData(details, values);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestCheckServicesDataError, { event: e });
  }

  if (!serviceType) {
    return;
  }

  // Action
  try {
    await addSavePromptAction(details, serviceType, values, savePromptActions);
    await savePromptAction(details, serviceType, tabsInputData, values, savePromptActions, tabUpdateData);
  } catch (e) {
    throw new TwoFasError(TwoFasError.internalErrors.onWebRequestSavePromptActionError, { event: e });
  }
};

export default onWebRequest;
