// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getLoginInputs from './autofillFunctions/getLoginInputs';

// DEV-only helper for the autofill E2E harness (tests/e2e/autofill). It reads the
// CURRENT values of the EXACT inputs autofill() targets — resolved via getLoginInputs()
// — so the harness verifies a fill using the extension's own input selection and
// visibility logic, never its own DOM/shadow heuristics. Tree-shaken from production:
// the only caller (contentOnMessage) invokes it inside `if (import.meta.env.DEV && ...)`.

/**
* Reads back the values of the login inputs the extension would autofill.
* Password content is never returned — only lengths — so secrets never leave the frame.
* @return {{status: string, usernameValues: string[], passwordLengths: number[]}} The read-back values.
*/
const e2eReadAutofillValues = () => {
  const { passwordInputs, usernameInputs } = getLoginInputs();

  return {
    status: 'ok',
    usernameValues: usernameInputs.map(input => input.value || ''),
    passwordLengths: passwordInputs.map(input => (input.value || '').length)
  };
};

export default e2eReadAutofillValues;
