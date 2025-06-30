// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to generate a unique input ID.
* @return {string} The generated input ID.
*/
const generateInputId = () => {
  const idArray = new Uint32Array(16);
  const id = [...crypto.getRandomValues(idArray)].map(m=>('0'+m.toString(16)).slice(-2)).join('');
  return id;
};

export default generateInputId;
