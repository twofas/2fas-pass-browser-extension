// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isText from '@/partials/functions/isText';
import requestBodyBytesToString from './requestBodyBytesToString';

/**
* Maximum nesting depth read from a JSON body.
* @type {number}
*/
const MAX_JSON_DEPTH = 32;

/**
* Function to walk a parsed body (form data or JSON), collecting its string and number values and its field names.
* @param {*} value - The value to read.
* @param {Object} result - The lists the values ({ texts }) and field names ({ fieldNames }) are added to.
* @param {number} [depth=0] - The current nesting depth.
* @return {void}
*/
const collect = (value, result, depth = 0) => {
  if (depth > MAX_JSON_DEPTH || value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    result.texts.push(value);
    return;
  }

  if (typeof value === 'number') {
    result.texts.push(String(value));
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  if (!Array.isArray(value)) {
    result.fieldNames.push(...Object.keys(value));
  }

  Object.values(value).forEach(item => collect(item, result, depth + 1));
};

/**
* Function to read the raw request body, joining all its byte parts. Parts without bytes (uploaded files) are skipped.
* @param {Object} details - The details of the web request.
* @return {string} The body text, or an empty string.
*/
const getRawBody = details => {
  const parts = details?.requestBody?.raw;

  if (!Array.isArray(parts) || parts.length <= 0) {
    return '';
  }

  try {
    return parts
      .filter(part => part?.bytes)
      .map(part => requestBodyBytesToString(part.bytes))
      .join('');
  } catch {
    return '';
  }
};

/**
* Function to parse a request body into the texts it carries and its field names. Texts are the form data values, the
* raw body, the values of a JSON body, the values of a URL-encoded body and the URL-decoded body; reading values
* instead of the encoded text keeps characters that JSON and URL encoding escape (quotes, backslashes, "+") comparable.
* @param {Object} details - The details of the web request.
* @return {{ texts: string[], fieldNames: string[] }} The texts and field names of the body.
*/
const parseRequestBody = details => {
  const result = { texts: [], fieldNames: [] };

  if (details?.requestBody?.formData) {
    collect(details.requestBody.formData, result);
  }

  const rawBody = getRawBody(details);

  if (!rawBody || !isText(rawBody)) {
    return result;
  }

  result.texts.push(rawBody);

  let isJson = false;

  try {
    collect(JSON.parse(rawBody), result);
    isJson = true;
  } catch {}

  if (!isJson && rawBody.includes('=')) {
    try {
      new URLSearchParams(rawBody).forEach((value, name) => {
        result.texts.push(value);
        result.fieldNames.push(name);
      });
    } catch {}
  }

  try {
    const decodedBody = decodeURIComponent(rawBody);

    if (decodedBody !== rawBody) {
      result.texts.push(decodedBody);
    }
  } catch {}

  return result;
};

export default parseRequestBody;
