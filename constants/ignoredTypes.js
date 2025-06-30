// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to generate a string of ignored input types and attributes for form elements.
* @return {string} A string of ignored input types and attributes.
*/
const ignoredTypes = () => {
  const ignored = [
    ':not([type="hidden"])',
    ':not([type="submit"])',
    ':not([type="button"])',
    ':not([type="reset"])',
    ':not([type="file"])',
    ':not([type="image"])',
    ':not([type="checkbox"])',
    ':not([type="radio"])',
    ':not([type="range"])',
    ':not([type="color"])',
    ':not([type="date"])',
    ':not([type="datetime"])',
    ':not([type="datetime-local"])',
    ':not([type="month"])',
    ':not([type="time"])',
    ':not([type="week"])',
    ':not([type="number"])',
    ':not([type="tel"])',
    ':not([type="url"])',
    ':not([type="search"])',
    ':not(read-only)',
    ':not(readonly)',
    ':not([read-only])',
    ':not([readonly])',
    ':not(list)',
    ':not(-moz-read-only)',
    ':not(disabled)',
    ':not([disabled])'
  ];

  return ignored.join('');
};

export default ignoredTypes;
