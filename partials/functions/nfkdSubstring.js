// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Returns a substring of the given string, considering Unicode NFKD normalization and grapheme clusters.
* @param {string} str - The input string.
* @param {number} indexStart - The starting index (inclusive).
* @param {number} indexEnd - The ending index (exclusive).
* @return {string} The substring of the input string, considering Unicode NFKD normalization and grapheme clusters.
*/
const nfkdSubstring = (str, indexStart, indexEnd) => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const graphemes = [...segmenter.segment(str.normalize('NFKD'))].map(s => s.segment);

  return graphemes.slice(indexStart, indexEnd).join('');
};

export default nfkdSubstring;
