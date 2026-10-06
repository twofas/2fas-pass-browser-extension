// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to remove the whitespace around a string. Values that are not strings are returned as they are.
* @param {*} value - The value.
* @return {*} The trimmed string or the given value.
*/
const trimString = value => (typeof value === 'string' ? value.trim() : value);

export default trimString;
