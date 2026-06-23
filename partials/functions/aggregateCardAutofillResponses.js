// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { AUTOFILL_RESULT_CODES } from '@/constants';

/**
* Pure aggregation of per-frame AUTOFILL_CARD responses into a single outcome.
*
* Every frame in a tab answers the AUTOFILL_CARD message independently
* (see entrypoints/content/functions/autofillCard.js). A frame with no card
* inputs replies `{ status: 'error', code: AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS }`
* and is treated as irrelevant noise. The remaining ("relevant") frame responses are
* collapsed here so that every caller derives the same outcome and missing-field
* list instead of re-implementing the reduction (the logic previously lived,
* verbatim and already drifting, in four separate background handlers).
*
* The calling layer keeps full control over presentation (TwofasNotification vs
* wsNotify, success toast vs T2-failed recovery): it reads `outcome` for the
* common notify-or-stay-silent paths and the raw `isOk` / `isPartial` /
* `hasMissingInputs` flags for handlers that distinguish "ok but a field's input
* was missing" from "a critical field partially failed".
*
* @param {Array<Object>|*} responses - Per-frame responses from sendMessageToAllFrames.
*   Non-array values (false/null/undefined from a failed broadcast) are treated as
*   "no relevant responses" and yield outcome 'noInputs'.
* @return {{
*   outcome: 'ok'|'partial'|'noInputs'|'error',
*   isOk: boolean,
*   isPartial: boolean,
*   hasMissingInputs: boolean,
*   missingInputFields: string[],
*   filledFields: Object<string, boolean>
* }} Aggregated outcome.
*/
const aggregateCardAutofillResponses = responses => {
  const relevantResponses = (Array.isArray(responses) ? responses : [])
    .filter(r => r && r.status && r.code !== AUTOFILL_RESULT_CODES.NO_INPUT_FIELDS);

  const isOk = relevantResponses.some(frameResponse => frameResponse.status === 'ok');
  const isPartial = relevantResponses.some(frameResponse => frameResponse.status === 'partial');

  const filledFields = relevantResponses.reduce((acc, r) => {
    if (r.filledFields) {
      Object.keys(r.filledFields).forEach(field => {
        if (r.filledFields[field]) {
          acc[field] = true;
        }
      });
    }

    return acc;
  }, {});

  const missingInputFields = relevantResponses
    .flatMap(r => r.missingInputFields || [])
    .filter((field, index, self) => self.indexOf(field) === index)
    .filter(field => !filledFields[field]);
  const hasMissingInputs = missingInputFields.length > 0;

  let outcome;

  if (relevantResponses.length === 0) {
    outcome = 'noInputs';
  } else if (!isOk && !isPartial) {
    outcome = 'error';
  } else if (isPartial || hasMissingInputs) {
    outcome = 'partial';
  } else {
    outcome = 'ok';
  }

  return {
    outcome,
    isOk,
    isPartial,
    hasMissingInputs,
    missingInputFields,
    filledFields
  };
};

export default aggregateCardAutofillResponses;
