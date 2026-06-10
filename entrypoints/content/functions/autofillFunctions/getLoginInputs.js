// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getPasswordInputs from '@/partials/inputFunctions/getPasswordInputs';
import getUsernameInputs from '@/partials/inputFunctions/getUsernameInputs';
import getShadowRoots from './getShadowRoots';

/**
* Resolves the login inputs exactly the way autofill does: password inputs first, then
* the username inputs associated with those password forms. Single source of truth
* shared by checkAutofillInputs(), autofill(), and the DEV E2E read seam, so detection,
* filling, and (test) verification can never use a different notion of "the login
* fields" — they all run this same code. The shadow DOM is scanned once and the result
* is shared with both getters, instead of each getter re-traversing the whole tree.
* @return {{passwordInputs: HTMLInputElement[], passwordForms: HTMLFormElement[], usernameInputs: HTMLInputElement[]}} The resolved login inputs.
*/
const getLoginInputs = () => {
  const shadowRoots = getShadowRoots();
  const passwordInputs = getPasswordInputs(shadowRoots);
  const passwordForms = passwordInputs
    .map(input => input.closest('form'))
    .filter(Boolean);
  const usernameInputs = getUsernameInputs(passwordForms, shadowRoots);

  return { passwordInputs, passwordForms, usernameInputs };
};

export default getLoginInputs;
