// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: a password field whose "show password" button flipped it to type="text"
// must still be recognised as the password field, while ordinary text fields (username,
// password hint, one-time code, search) must not be.

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { isRevealedPasswordInput, rememberPasswordInputs } from './revealedPasswordInputs';

beforeAll(() => {
  if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
    globalThis.CSS = globalThis.CSS || {};
    globalThis.CSS.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
  }
});

const mountInput = html => {
  document.body.innerHTML = html;

  return document.body.querySelector('input[data-target]') || document.body.querySelector('input');
};

describe('isRevealedPasswordInput', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('revealed password fields', () => {
    it('recognises a text field carrying autocomplete="current-password"', () => {
      const input = mountInput('<input type="text" name="field1" autocomplete="current-password" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises a text field carrying autocomplete="new-password"', () => {
      const input = mountInput('<input type="text" name="field1" autocomplete="section-a new-password" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises a text field named "password"', () => {
      const input = mountInput('<input type="text" name="password" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises the common short identifiers pass / pwd', () => {
      expect(isRevealedPasswordInput(mountInput('<input type="text" id="edit-pass" name="pass" />'))).toBe(true);
      expect(isRevealedPasswordInput(mountInput('<input type="text" name="user_pwd" />'))).toBe(true);
    });

    it('recognises a localized identifier (Polish "haslo")', () => {
      const input = mountInput('<input type="text" name="haslo" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises a field through its associated label text', () => {
      const input = mountInput('<label for="f1">Hasło</label><input type="text" id="f1" name="f1" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises a field through its placeholder', () => {
      const input = mountInput('<input type="text" name="pw" placeholder="Your login password" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises a field through its aria-label', () => {
      const input = mountInput('<input type="text" name="f1" aria-label="Passwort" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('recognises a field previously seen as type="password" even without any keyword', () => {
      const input = mountInput('<input type="password" name="f1" />');

      rememberPasswordInputs([input]);
      input.type = 'text';

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('treats a text input without a type attribute like type="text"', () => {
      const input = mountInput('<input name="password" />');

      expect(isRevealedPasswordInput(input)).toBe(true);
    });
  });

  describe('fields that are not a revealed password', () => {
    it('rejects a still-masked type="password" field (it is a password field, not a revealed one)', () => {
      const input = mountInput('<input type="password" name="password" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a plain username field', () => {
      const input = mountInput('<label for="u">Username</label><input type="text" id="u" name="username" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a username-named field whose free text mentions a password', () => {
      const input = mountInput('<input type="text" name="username" placeholder="Username (not your password)" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a login field labelled by a shared form caption mentioning the password', () => {
      const input = mountInput(`
        <div class="form-label">Enter your login and password</div>
        <div><input type="text" name="login" /></div>
      `);

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a free-text match when the same form still has a masked password field', () => {
      const input = mountInput(`
        <form>
          <label for="x">Password</label>
          <input type="text" id="x" name="x" data-target />
          <input type="password" name="password" />
        </form>
      `);

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a free-text match on a form-less page that still has a masked password field', () => {
      const input = mountInput(`
        <input type="text" name="x" placeholder="Password" data-target />
        <input type="password" name="password" />
      `);

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('still accepts a name/id match next to a masked password field (revealed current + masked new)', () => {
      const input = mountInput(`
        <form>
          <input type="text" name="current_password" data-target />
          <input type="password" name="new_password" />
        </form>
      `);

      expect(isRevealedPasswordInput(input)).toBe(true);
    });

    it('rejects an email field even if it mentions a password', () => {
      const input = mountInput('<input type="email" name="email" placeholder="Email for password reset" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a field whose autocomplete marks it as the username', () => {
      const input = mountInput('<input type="text" name="login" autocomplete="username" placeholder="Login (not your password)" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a password hint field', () => {
      const input = mountInput('<label for="h">Password hint</label><input type="text" id="h" name="password_hint" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a one-time password field', () => {
      const input = mountInput('<input type="text" name="otp" placeholder="One-time password" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a field with autocomplete="one-time-code"', () => {
      const input = mountInput('<input type="text" name="password_code" autocomplete="one-time-code" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('does not read the short "pass" keyword from free text such as a boarding-pass label', () => {
      const input = mountInput('<label for="b">Boarding pass number</label><input type="text" id="b" name="booking" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('does not match "pass" inside a longer word such as passenger', () => {
      const input = mountInput('<input type="text" name="passenger" />');

      expect(isRevealedPasswordInput(input)).toBe(false);
    });

    it('rejects a missing element', () => {
      expect(isRevealedPasswordInput(null)).toBe(false);
    });
  });
});
