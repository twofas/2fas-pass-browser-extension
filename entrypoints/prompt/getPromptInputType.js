// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { isRevealedPasswordInput } from '@/partials/inputFunctions/revealedPasswordInputs';

/**
* Function to tell the save prompt type of a tracked input. A password field revealed by a "show password" toggle
* (type="text") still holds the password, so it counts as the password, not the username.
* @param {HTMLInputElement} input - The input element.
* @return {string} 'password' or 'username'.
*/
const getPromptInputType = input => (input?.type === 'password' || isRevealedPasswordInput(input) ? 'password' : 'username');

export default getPromptInputType;
