// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the editable amount.
* @param {boolean} nameEditable - Indicates if the name field is editable.
* @param {boolean} usernameEditable - Indicates if the username field is editable.
* @param {boolean} passwordEditable - Indicates if the password field is editable.
* @param {Array<boolean>} domainsEditable - Indicates if the domain fields are editable.
* @param {boolean} notesEditable - Indicates if the notes field is editable.
* @param {boolean} tierEditable - Indicates if the tier field is editable.
* @return {Object} An object containing the editable amount and a text description.
*/
const getEditableAmount = (nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable) => {
  let amount = 0;

  if (nameEditable) { amount++; }
  if (usernameEditable) { amount++; }
  if (passwordEditable) { amount++; }
  if (notesEditable) { amount++; }
  if (tierEditable) { amount++; }
  domainsEditable.forEach(d => { if (d) { amount++; } });

  if (amount === 0) {
    return {
      text: '',
      amount: 0
    };
  }

  if (amount === 1) {
    return {
      text: ` (1 ${browser.i18n.getMessage('details_field')})`,
      amount: 1
    };
  }

  return {
    text: ` (${amount} ${browser.i18n.getMessage('details_fields')})`,
    amount: amount
  };
};

export default getEditableAmount;
