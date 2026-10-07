// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { containsDeniedWord } from './shared';

const ONE_TIME_CODE_AUTOCOMPLETE = 'one-time-code';
const CARD_AUTOCOMPLETE_PREFIX = 'cc-';

const oneTimeCodeTokens = ['otp', 'otc', 'totp', 'sms', '2fa', 'mfa'];
const oneTimeCodeFollowers = ['code', 'token', 'input', 'val', 'pin', 'login', 'verif', 'pass', 'pwd', 'psw', 'auth', 'field'];
const oneTimeCodeLeaders = ['verif', 'email', 'phone', 'text', 'login', 'input', 'txt', 'user'];

const oneTimeCodePatterns = [
  /one.?time/,
  new RegExp(`(?:^|[^a-z0-9])(?:${oneTimeCodeTokens.join('|')})(?:$|[^a-z0-9])`),
  new RegExp(`(?:${oneTimeCodeTokens.join('|')}).?(?:${oneTimeCodeFollowers.join('|')})`),
  new RegExp(`(?:${oneTimeCodeLeaders.join('|')}).?(?:${oneTimeCodeTokens.join('|')})`),
  /(?:sms|mfa).?otp/,
  /verif(?:y|ication)?.?code|(?:^|[^a-z0-9])vcode/,
  /(?:second|two|2).?factor/,
  /wfls-token|email_code/
];

const socialSecurityTokens = ['ssn'];
const socialSecurityPattern = /social.?security/;

const cardSecurityCodeTokens = ['cvv', 'cvc', 'csc', 'cvn', 'cvd', 'ccv', 'cid', 'cccid'];
// "cid" is also a customer ID login, so it disqualifies password fields only.
const usernameCardSecurityCodeTokens = cardSecurityCodeTokens.filter(token => token !== 'cid');
const cardSecurityCodePattern = /card.?(?:identification|verification|code|pin)|security.?(?:code|value)|c-v-v/;

/**
* Checks whether an identifier names a one-time code, a Social Security Number or a card security code.
* @param {string} value - The name or id.
* @param {string[]} securityCodeTokens - The card security code tokens to match.
* @return {boolean} True if the identifier names a non-credential field.
*/
const isNonCredentialIdentifier = (value, securityCodeTokens) => {
  const lowerValue = String(value || '').toLowerCase();

  if (!lowerValue) {
    return false;
  }

  return oneTimeCodePatterns.some(pattern => pattern.test(lowerValue)) ||
    containsDeniedWord(value, socialSecurityTokens) ||
    socialSecurityPattern.test(lowerValue) ||
    containsDeniedWord(value, securityCodeTokens) ||
    cardSecurityCodePattern.test(lowerValue);
};

/**
* Tells whether a field is neither a username nor a password, after Chromium's password manager form parser
* (IsNotPasswordField): its autocomplete field token is a one-time code or a card field ("cc-*"), or its name
* or id names a one-time code, a Social Security Number or a card security code. Unlike Chromium, a bare
* "verification" does not disqualify a field (password and e-mail confirmation fields stay credentials), and
* short tokens such as "ssn" or "cvv" must stand alone ("className" is not an SSN field).
* @param {HTMLElement} input - The input element to check.
* @param {Object} [options] - Check options.
* @param {boolean} [options.username=false] - Checking a username candidate: a field named "cid" (customer ID) is allowed.
* @return {boolean} True if the field must not be treated as a username or password field.
*/
const isNotCredentialField = (input, { username = false } = {}) => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();
  const fieldToken = autocomplete ? autocomplete.split(/\s+/).pop() : '';

  if (fieldToken === ONE_TIME_CODE_AUTOCOMPLETE || fieldToken.startsWith(CARD_AUTOCOMPLETE_PREFIX)) {
    return true;
  }

  const securityCodeTokens = username ? usernameCardSecurityCodeTokens : cardSecurityCodeTokens;

  return isNonCredentialIdentifier(input.name || input.getAttribute('name'), securityCodeTokens) ||
    isNonCredentialIdentifier(input.id, securityCodeTokens);
};

export default isNotCredentialField;
