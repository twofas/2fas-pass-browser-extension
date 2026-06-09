// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Normalizes the `clickBefore` field — a CSS selector, or list of selectors, to click
* (in order) BEFORE input detection, for pages that reveal/enable the login form only
* after an interaction (e.g. a "Sign in" button) — into an array of non-empty strings.
* @param {string|string[]|undefined} value - The raw clickBefore value.
* @return {string[]} The normalized selector list.
*/
const normalizeClickBefore = value => {
  if (typeof value === 'string') {
    return value.length > 0 ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.filter(s => typeof s === 'string' && s.length > 0);
  }

  return [];
};

/**
* Normalizes one target entry (string URL or object) into a full descriptor.
* @param {string|{url:string,name?:string,expect?:{username?:boolean,password?:boolean},crossDomain?:boolean,clickBefore?:string|string[]}} entry - The target entry.
* @return {{url:string,name:string,expect:{username:boolean,password:boolean},crossDomain:boolean,clickBefore:string[]}} The normalized descriptor.
*/
export const normalizeTarget = entry => {
  const obj = typeof entry === 'string' ? { url: entry } : entry;

  if (!obj || typeof obj.url !== 'string' || obj.url.length === 0) {
    throw new TypeError(`Invalid autofill target (missing "url"): ${JSON.stringify(entry)}`);
  }

  const expect = obj.expect || {};

  return {
    url: obj.url,
    name: typeof obj.name === 'string' && obj.name.length > 0 ? obj.name : obj.url,
    expect: {
      username: expect.username !== false,
      password: expect.password !== false
    },
    crossDomain: obj.crossDomain === true,
    clickBefore: normalizeClickBefore(obj.clickBefore)
  };
};

/**
* Normalizes an array of target entries.
* @param {Array} entries - The raw target entries.
* @return {Array<{url:string,name:string,expect:{username:boolean,password:boolean},crossDomain:boolean}>} The normalized descriptors.
*/
export const normalizeTargets = entries => (Array.isArray(entries) ? entries : []).map(normalizeTarget);
