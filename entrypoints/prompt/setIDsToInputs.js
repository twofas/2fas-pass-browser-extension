// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateInputId from './generateInputId';

/** 
* Function to set unique IDs to input elements.
* @param {HTMLInputElement[]} inputs - The array of input elements.
* @return {void}
*/
const setIDsToInputs = inputs => {
  inputs.forEach(input => {
    let id = input.getAttribute('twofas-pass-id');

    if (!id || id.length <= 0) {
      id = generateInputId();

      // FUTURE - Check if the ID is unique

      input.setAttribute('twofas-pass-id', id);
    }
  });
};

export default setIDsToInputs;
