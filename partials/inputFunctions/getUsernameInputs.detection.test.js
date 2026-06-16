// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests for the username DETECTION path against a real DOM and the
// real keyword/selector constants (the companion getUsernameInputs.test.js
// covers the password-form fallback with hand-built fakes). These describe how
// username detection should behave on real login forms: email/username/login
// fields and labels are found, phone-number logins (type=tel) are allowed, and
// search/url/newsletter/password-named fields are rejected.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getUsernameInputs from './getUsernameInputs';

describe('getUsernameInputs detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('positive detection', () => {
    it('detects an email-type input', () => {
      document.body.innerHTML = '<input type="email" name="email" />';

      const result = getUsernameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('email');
    });

    it('detects an input flagged autocomplete="username"', () => {
      document.body.innerHTML = '<input type="text" autocomplete="username" name="acct" />';

      expect(getUsernameInputs()).toHaveLength(1);
    });

    it('detects an input whose name carries a username keyword (login)', () => {
      document.body.innerHTML = '<input type="text" name="login" />';

      expect(getUsernameInputs()).toHaveLength(1);
    });

    it('detects an input via its associated <label> text', () => {
      document.body.innerHTML = `
        <label for="u">Username</label>
        <input id="u" type="text" name="account" />
      `;

      const result = getUsernameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u');
    });

    it('detects a username input inside an open shadow root', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input type="email" name="email" />';

      expect(getUsernameInputs()).toHaveLength(1);
    });

    // Regression (review #2): aria-labelledby holds an IDREF, not literal text.
    // The accessible name is the referenced element's text and must be resolved.
    it('detects an input whose accessible name comes from aria-labelledby', () => {
      document.body.innerHTML = `
        <span id="lbl">Username</span>
        <input type="text" aria-labelledby="lbl" name="acct" />
      `;

      expect(getUsernameInputs()).toHaveLength(1);
    });
  });

  describe('denied keywords must match whole words (review #1)', () => {
    it('detects "passport" / "compass" / "researcher" username fields (no substring false-negatives)', () => {
      document.body.innerHTML = '<input type="text" autocomplete="username" name="passport" />';
      expect(getUsernameInputs()).toHaveLength(1);

      document.body.innerHTML = '<input type="email" id="compass-login" name="acct" />';
      expect(getUsernameInputs()).toHaveLength(1);

      document.body.innerHTML = '<input type="email" name="researcher-email" />';
      expect(getUsernameInputs()).toHaveLength(1);
    });

    it('still rejects a field whose name contains "password"/"search" as a whole word', () => {
      document.body.innerHTML = '<input type="email" name="user-password" />';
      expect(getUsernameInputs()).toEqual([]);

      document.body.innerHTML = '<input type="text" name="site-search" autocomplete="username" />';
      expect(getUsernameInputs()).toEqual([]);
    });

    it('still rejects a fused personal-data field name (userfirstname) as a username', () => {
      // long personal-info keywords (firstname) keep substring matching even when glued.
      document.body.innerHTML = '<input type="text" name="userfirstname" autocomplete="username" />';
      expect(getUsernameInputs()).toEqual([]);
    });
  });

  describe('phone-number logins (finding #15 regression)', () => {
    it('detects a type="tel" field flagged as the username', () => {
      document.body.innerHTML = '<input type="tel" autocomplete="username" name="phoneLogin" />';

      const result = getUsernameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('phoneLogin');
    });
  });

  describe('rejections', () => {
    it('does not treat a search box as a username, even if named "login"', () => {
      document.body.innerHTML = '<input type="search" name="login" />';

      expect(getUsernameInputs()).toEqual([]);
    });

    it('does not treat a url field as a username', () => {
      document.body.innerHTML = '<input type="url" autocomplete="username" name="site" />';

      expect(getUsernameInputs()).toEqual([]);
    });

    it('rejects a field whose name contains a denied keyword (password)', () => {
      document.body.innerHTML = '<input type="email" name="user-password" />';

      expect(getUsernameInputs()).toEqual([]);
    });

    it('rejects an email field that lives inside a newsletter widget', () => {
      document.body.innerHTML = `
        <div class="newsletter">
          <input type="email" name="email" />
        </div>
      `;

      expect(getUsernameInputs()).toEqual([]);
    });
  });

  describe('prioritisation', () => {
    it('returns only the username input that shares a form with the password field', () => {
      document.body.innerHTML = `
        <form id="login"><input type="email" name="inside" /><input type="password" name="pw" /></form>
        <form id="other"><input type="email" name="outside" /></form>
      `;
      const passwordForm = document.getElementById('login');

      const result = getUsernameInputs([passwordForm]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('inside');
    });
  });
});
