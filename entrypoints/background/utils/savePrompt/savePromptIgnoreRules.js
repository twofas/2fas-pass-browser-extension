// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import ignoredSavePromptUrls from '@/constants/ignoredSavePromptUrls';
import ignoredSavePromptRequestBodyTexts from '@/constants/ignoredSavePromptRequestBodyTexts';
import parseRequestBody from './parseRequestBody';

/**
* Function to tell whether a request goes to an analytics, ads or telemetry endpoint. Only the host and the path are
* checked: a login whose query string mentions a listed word (e.g. captchaToken) is not skipped.
* @param {string} url - The request URL.
* @return {boolean} True when the request is ignored.
*/
export const isIgnoredSavePromptUrl = url => {
  let target;

  try {
    const parsed = new URL(url);
    target = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return false;
  }

  return ignoredSavePromptUrls.some(ignoredUrl => target.includes(ignoredUrl.toLowerCase()));
};

/**
* Function to tell whether a request body has a field named after a telemetry marker (e.g. totalJSHeapSize). Field
* names must match whole, and values are not checked, so a login sending "userAgent" with the credentials is still
* recognised by its values; the marker only spares such requests the wait for matching values.
* @param {Object} details - The details of the web request.
* @param {Object} [requestBody] - The body from parseRequestBody, when the caller already parsed it.
* @return {boolean} True when the body has a listed field.
*/
export const hasIgnoredSavePromptBodyField = (details, requestBody = parseRequestBody(details)) => {
  const { fieldNames } = requestBody;

  if (fieldNames.length <= 0) {
    return false;
  }

  const ignoredFields = new Set(ignoredSavePromptRequestBodyTexts.map(text => text.toLowerCase()));

  return fieldNames.some(name => ignoredFields.has(String(name).toLowerCase()));
};
