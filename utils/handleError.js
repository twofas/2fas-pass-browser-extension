// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* This function is used to handle errors in the application. It is used to catch errors and log them to the console.
* @param {Error|SyntaxError|ReferenceError|TypeError|DataError|TwoFasError|Event} e - The error object to handle.
* @return {void} This function does not return a value.
*/
const handleError = e => {
  CatchError(e);
};

export default handleError;
