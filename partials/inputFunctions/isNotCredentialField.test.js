// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests, after Chromium's password manager form parser (IsNotPasswordField): a field whose
// autocomplete is a one-time code or a card field, or whose name/id names a one-time code, a Social Security
// Number or a card security code, is neither a username nor a password. Unlike Chromium, a bare
// "verification" does not disqualify a field, so password and e-mail confirmation fields stay credentials.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import isNotCredentialField from './isNotCredentialField';

const field = attributes => {
  const input = document.createElement('input');

  Object.entries(attributes).forEach(([name, value]) => input.setAttribute(name, value));
  document.body.appendChild(input);

  return input;
};

describe('isNotCredentialField', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    'one-time-code', 'cc-csc', 'cc-number', 'cc-exp', 'billing cc-name', 'section-pay cc-csc'
  ])('rejects the autocomplete token "%s"', autocomplete => {
    expect(isNotCredentialField(field({ autocomplete }))).toBe(true);
  });

  it.each([
    'otp', 'otp_code', 'otpInput', 'otpauth', 'smsCode', 'sms-code', 'totp', 'mfaToken', 'mfa', '2fa', '2faCode', 'user_otp',
    'loginOtp', 'textsms', 'sms_otp', 'verificationCode', 'verification_code', 'verify-code', 'vcode', 'two-factor-code',
    'TwoFactorCode', 'second_factor', 'oneTimePassword', 'one-time-code', 'email_code', 'wfls-token'
  ])('rejects the one-time code name "%s"', name => {
    expect(isNotCredentialField(field({ name }))).toBe(true);
  });

  it.each(['ssn', 'ssnNumber', 'social_security_number', 'socialSecurity'])('rejects the Social Security Number name "%s"', name => {
    expect(isNotCredentialField(field({ name }))).toBe(true);
  });

  it.each([
    'cvv', 'cvv2', 'cvc', 'csc', 'cvn', 'cvd', 'ccv', 'cid', 'cccid', 'cvvNumber', 'card_code', 'cardCode', 'securityCode',
    'security-code', 'securityValue', 'cardVerification', 'card-identification', 'cardPin', 'c-v-v'
  ])('rejects the card security code name "%s"', name => {
    expect(isNotCredentialField(field({ name }))).toBe(true);
  });

  it('checks the id as well as the name', () => {
    expect(isNotCredentialField(field({ name: 'field1', id: 'otp-input' }))).toBe(true);
  });

  it.each([
    'username', 'email', 'login', 'user', 'password', 'pass', 'passwordVerification', 'password_confirmation', 'confirmPassword',
    'emailVerification', 'phone', 'mobile', 'smsNumber', 'accessCode', 'className', 'addressName', 'business', 'description',
    'lucid', 'potpourri', 'hotpink', 'customerId'
  ])('keeps the credential-looking name "%s"', name => {
    expect(isNotCredentialField(field({ name, autocomplete: 'off' }))).toBe(false);
  });

  it.each(['username', 'email', 'current-password', 'new-password', 'webauthn'])('keeps the autocomplete token "%s"', autocomplete => {
    expect(isNotCredentialField(field({ autocomplete }))).toBe(false);
  });

  describe('customer ID named "cid"', () => {
    it('keeps a username field named cid when checked as a username', () => {
      expect(isNotCredentialField(field({ name: 'cid' }), { username: true })).toBe(false);
    });

    it('still rejects a masked field named cid (the American Express code) as a password', () => {
      expect(isNotCredentialField(field({ name: 'cid', type: 'password' }))).toBe(true);
    });

    it('still rejects other card security code names as a username', () => {
      expect(isNotCredentialField(field({ name: 'cvv' }), { username: true })).toBe(true);
    });
  });
});
