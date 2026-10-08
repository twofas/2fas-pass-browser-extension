// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: these describe how password-field detection SHOULD behave
// (real-world login/registration forms, shadow DOM, hidden/disabled inputs),
// not how the current implementation is written. The DOM is a real jsdom tree;
// the only mocked dependency is visibility, which has no layout engine in jsdom.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// isVisible relies on getBoundingClientRect/getComputedStyle, which jsdom cannot
// compute (no layout). Treat every element as visible unless it is explicitly
// tagged data-invisible="true", so visibility filtering can still be asserted.
vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getPasswordInputs from './getPasswordInputs';

const mount = html => {
  document.body.innerHTML = html;
};

const attachShadow = (hostHtml, shadowHtml) => {
  document.body.innerHTML = hostHtml;
  const host = document.body.firstElementChild;
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = shadowHtml;

  return root;
};

describe('getPasswordInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('detection', () => {
    it('finds a standard password field on a login form', () => {
      mount(`
        <form>
          <input type="text" name="username" />
          <input type="password" name="password" />
        </form>
      `);

      const result = getPasswordInputs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('password');
    });

    it('finds every password field on a change-password form', () => {
      mount(`
        <form>
          <input type="password" name="current" />
          <input type="password" name="next" />
          <input type="password" name="confirm" />
        </form>
      `);

      const result = getPasswordInputs();

      expect(result).toHaveLength(3);
      expect(result.map(input => input.name)).toEqual(['current', 'next', 'confirm']);
    });

    it('finds password fields regardless of how deeply they are nested', () => {
      mount(`
        <div class="page">
          <section>
            <div class="card"><input type="password" id="deep" /></div>
          </section>
        </div>
      `);

      const result = getPasswordInputs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('deep');
    });
  });

  describe('non-password inputs', () => {
    it('returns an empty array when the page has no password field', () => {
      mount(`
        <form>
          <input type="text" name="username" />
          <input type="email" name="email" />
        </form>
      `);

      expect(getPasswordInputs()).toEqual([]);
    });

    it('never returns text or email inputs even when they sit next to a password field', () => {
      mount(`
        <form>
          <input type="text" name="username" />
          <input type="email" name="email" />
          <input type="password" name="password" />
        </form>
      `);

      const result = getPasswordInputs();

      expect(result).toHaveLength(1);
      expect(result.every(input => input.type === 'password')).toBe(true);
    });
  });

  describe('excluded states', () => {
    it('ignores a disabled password field (cannot be autofilled)', () => {
      mount(`
        <form>
          <input type="password" name="active" />
          <input type="password" name="frozen" disabled />
        </form>
      `);

      const result = getPasswordInputs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('active');
    });

    it('ignores a readonly password field', () => {
      mount(`
        <form>
          <input type="password" name="active" />
          <input type="password" name="locked" readonly />
        </form>
      `);

      const result = getPasswordInputs();

      expect(result.map(input => input.name)).toEqual(['active']);
    });

    it('ignores a password field that is not visible', () => {
      mount(`
        <form>
          <input type="password" name="shown" />
          <input type="password" name="hidden" data-invisible="true" />
        </form>
      `);

      const result = getPasswordInputs();

      expect(result.map(input => input.name)).toEqual(['shown']);
    });
  });

  describe('shadow DOM', () => {
    it('finds a password field rendered inside an open shadow root', () => {
      attachShadow('<div id="host"></div>', `
        <input type="text" name="username" />
        <input type="password" name="shadow-password" />
      `);

      const result = getPasswordInputs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('shadow-password');
    });

    it('finds password fields in both the light DOM and a shadow root in one pass', () => {
      document.body.innerHTML = `
        <input type="password" name="light" />
        <div id="host"></div>
      `;
      const host = document.getElementById('host');
      const root = host.attachShadow({ mode: 'open' });

      root.innerHTML = '<input type="password" name="shadow" />';

      const names = getPasswordInputs().map(input => input.name);

      expect(names).toContain('light');
      expect(names).toContain('shadow');
      expect(names).toHaveLength(2);
    });
  });

  describe('shadow-root reuse', () => {
    it('uses caller-supplied shadow roots instead of rescanning the DOM', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const host = document.getElementById('host');
      const root = host.attachShadow({ mode: 'open' });

      root.innerHTML = '<input type="password" name="shadow" />';

      const result = getPasswordInputs([root]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('shadow');
    });
  });

  describe('revealed password fields (show-password toggle flipped type to text)', () => {
    it('ignores a revealed field by default', () => {
      mount(`
        <form>
          <input type="email" name="email" />
          <input type="text" name="password" autocomplete="current-password" />
        </form>
      `);

      expect(getPasswordInputs()).toEqual([]);
    });

    it('returns a revealed field when includeRevealed is set', () => {
      mount(`
        <form>
          <input type="email" name="email" />
          <input type="text" name="password" autocomplete="current-password" />
        </form>
      `);

      const result = getPasswordInputs(null, { includeRevealed: true });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('password');
    });

    it('keeps masked and revealed fields in document order', () => {
      mount(`
        <form>
          <input type="text" name="current_password" />
          <input type="password" name="new_password" />
          <input type="password" name="confirm_password" />
        </form>
      `);

      const result = getPasswordInputs(null, { includeRevealed: true });

      expect(result.map(input => input.name)).toEqual(['current_password', 'new_password', 'confirm_password']);
    });

    it('returns a field that was masked during an earlier scan and is revealed now', () => {
      mount('<form><input type="email" name="email" /><input type="password" name="f1" /></form>');

      const field = document.querySelector('input[name="f1"]');

      getPasswordInputs();
      field.type = 'text';

      expect(getPasswordInputs(null, { includeRevealed: true })).toEqual([field]);
    });

    it('never returns ordinary text fields when includeRevealed is set', () => {
      mount(`
        <form>
          <input type="text" name="username" />
          <input type="text" name="password_hint" />
          <input type="password" name="password" />
        </form>
      `);

      const result = getPasswordInputs(null, { includeRevealed: true });

      expect(result.map(input => input.name)).toEqual(['password']);
    });

    it('ignores a revealed field that is not visible', () => {
      mount('<form><input type="text" name="password" data-invisible="true" /></form>');

      expect(getPasswordInputs(null, { includeRevealed: true })).toEqual([]);
    });

    it('finds a revealed field inside an open shadow root', () => {
      attachShadow('<div id="host"></div>', '<input type="text" name="password" autocomplete="current-password" />');

      const result = getPasswordInputs(null, { includeRevealed: true });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('password');
    });
  });

  describe('non-credential fields (Chromium IsNotPasswordField)', () => {
    it('skips masked card security code and one-time code fields', () => {
      document.body.innerHTML = `
        <input type="password" name="cvv" />
        <input type="password" autocomplete="cc-csc" />
        <input type="password" autocomplete="one-time-code" />
        <input type="password" name="otpInput" />
        <input type="password" name="password" />
      `;

      expect(getPasswordInputs().map(input => input.name)).toEqual(['password']);
    });

    it('keeps a password confirmation field named with "verification"', () => {
      document.body.innerHTML = '<input type="password" name="password" /><input type="password" name="passwordVerification" />';

      expect(getPasswordInputs()).toHaveLength(2);
    });
  });
});
