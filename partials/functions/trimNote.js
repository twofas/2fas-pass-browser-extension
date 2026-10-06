// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to remove the spaces and tabs around a note. Line breaks are kept, so the empty lines at the start and the end
* of the note are not removed. Values that are not strings are returned as they are.
* @param {*} value - The value.
* @return {*} The trimmed note or the given value.
*/
const trimNote = value => (typeof value === 'string' ? value.replace(/^[^\S\r\n]+|[^\S\r\n]+$/g, '') : value);

export default trimNote;
