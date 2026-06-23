// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Pure aggregation of per-frame AUTOFILL (login) responses into a single outcome.
*
* Every frame in a tab answers the AUTOFILL message independently
* (see entrypoints/content/functions/autofill.js). Each frame reports its own
* `canAutofillUsername` / `canAutofillPassword` flags, reflecting only the inputs
* present in THAT frame. A login form split across frames (e.g. username in the
* top frame, password in an iframe) therefore yields one 'ok' response with
* `canAutofillUsername: false` and another with `canAutofillPassword: false`,
* even though both fields were filled overall.
*
* `allFieldsFilled` must be derived by aggregating capability ACROSS frames
* (some-per-field), never per-frame: a per-frame `every` check falsely reports a
* partial fill whenever the form is split, a frame is unreachable (sendMessage
* rejected → literal `false`), or a cross-domain frame was intentionally blocked
* (status 'cancelled'). Such frames are treated as neutral here; success is judged
* only by the frames that actually filled a field. Extracting the reduction into a
* single shared function keeps the popup path (handleLoginAutofill), the
* permission/dialog path (dispatchLoginAutofill) and the shortcut path
* (finishPullRequestAutofill) from re-implementing — and re-introducing — the bug
* (finding #43).
*
* @param {Array<Object>|*} responses - Per-frame responses from sendMessageToAllFrames.
*   Non-array values and non-object / `false` entries (rejected broadcasts) are
*   treated as neutral.
* @param {Object} actionData - The autofill request; its `username` / `password`
*   presence determines which fields had to be filled.
* @return {{ isOk: boolean, allFieldsFilled: boolean }} Aggregated outcome.
*/
const aggregateLoginAutofillResponses = (responses, actionData) => {
  const frames = Array.isArray(responses) ? responses : [];

  const isOk = frames.some(frameResponse => frameResponse?.status === 'ok');
  const filledUsername = frames.some(frameResponse => frameResponse?.status === 'ok' && frameResponse.canAutofillUsername);
  const filledPassword = frames.some(frameResponse => frameResponse?.status === 'ok' && frameResponse.canAutofillPassword);

  const allFieldsFilled = (!actionData?.username || filledUsername) && (!actionData?.password || filledPassword);

  return { isOk, allFieldsFilled };
};

export default aggregateLoginAutofillResponses;
