// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: these describe how autofill SHOULD choose which password fields to
// fill, distinguishing fillable password fields from the new/confirm fields on multi-field
// registration and change-password layouts (never filled). The DOM is a real jsdom tree
// built from realistic login, registration and change-password layouts. No production logic
// is reimplemented here.

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

// jsdom does not implement the CSS object; getAssociatedLabelText needs CSS.escape.
beforeAll(() => {
  if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
    globalThis.CSS = globalThis.CSS || {};
    globalThis.CSS.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
  }
});

import getAutofillPasswordInputs, { classifyPasswordInput } from './getAutofillPasswordInputs';

const mount = html => {
  document.body.innerHTML = html;
};

const passwordEls = () => Array.from(document.querySelectorAll('input[type="password"]'));
const usernameEls = () => Array.from(document.querySelectorAll('input[type="text"], input[type="email"]'));
const namesOf = inputs => inputs.map(input => input.name);

// Convenience: run the function the way autofill does, deriving the input lists from the DOM.
const resolve = () => getAutofillPasswordInputs(passwordEls(), usernameEls());

describe('classifyPasswordInput', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('classifies autocomplete="current-password" as current', () => {
    mount('<input type="password" autocomplete="current-password" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('current');
  });

  it('does not classify autocomplete="new-password" as new (autocomplete only marks current)', () => {
    mount('<input type="password" autocomplete="new-password" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('unknown');
  });

  it('reads the trailing field token of a grouped autocomplete value', () => {
    mount('<input type="password" autocomplete="section-blue current-password" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('current');
  });

  it('classifies by name: oldPassword / currentPassword are current', () => {
    mount('<input type="password" name="oldPassword" /><input type="password" name="currentPassword" />');

    const [oldInput, currentInput] = passwordEls();

    expect(classifyPasswordInput(oldInput)).toBe('current');
    expect(classifyPasswordInput(currentInput)).toBe('current');
  });

  it('classifies by name: newPassword / confirmPassword are new', () => {
    mount('<input type="password" name="newPassword" /><input type="password" name="confirmPassword" />');

    const [newInput, confirmInput] = passwordEls();

    expect(classifyPasswordInput(newInput)).toBe('new');
    expect(classifyPasswordInput(confirmInput)).toBe('new');
  });

  it('classifies a bare password field as unknown', () => {
    mount('<input type="password" name="password" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('unknown');
  });

  it('classifies by associated label text', () => {
    mount(`
      <label for="a">Current password</label><input id="a" type="password" name="a" />
      <label for="b">New password</label><input id="b" type="password" name="b" />
    `);

    const [a, b] = passwordEls();

    expect(classifyPasswordInput(a)).toBe('current');
    expect(classifyPasswordInput(b)).toBe('new');
  });

  it('classifies by placeholder text', () => {
    mount('<input type="password" placeholder="Repeat password" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('new');
  });

  it('classifies by aria-label text', () => {
    mount('<input type="password" aria-label="Current password" /><input type="password" aria-label="New password" />');

    const [current, next] = passwordEls();

    expect(classifyPasswordInput(current)).toBe('current');
    expect(classifyPasswordInput(next)).toBe('new');
  });

  it('classifies underscore-separated re-enter / re-type confirm fields as new', () => {
    mount('<input type="password" name="re_enter_password" /><input type="password" name="re_type_password" />');

    const [reEnter, reType] = passwordEls();

    expect(classifyPasswordInput(reEnter)).toBe('new');
    expect(classifyPasswordInput(reType)).toBe('new');
  });

  it('does not misclassify a login field whose label says "Enter password"', () => {
    mount('<input type="password" name="password" placeholder="Enter your password" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('unknown');
  });

  it('classifies localized Italian new and German old keywords', () => {
    mount('<input type="password" name="altePassword" /><input type="password" name="nuovaPassword" />');

    const [german, italian] = passwordEls();

    expect(classifyPasswordInput(german)).toBe('current');
    expect(classifyPasswordInput(italian)).toBe('new');
  });

  it('classifies localized (Polish) names', () => {
    mount('<input type="password" name="stare_haslo" /><input type="password" name="nowe_haslo" />');

    const [oldInput, newInput] = passwordEls();

    expect(classifyPasswordInput(oldInput)).toBe('current');
    expect(classifyPasswordInput(newInput)).toBe('new');
  });

  it('lets the standardized current-password autocomplete win over a conflicting name keyword', () => {
    mount('<input type="password" autocomplete="current-password" name="newPassword" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('current');
  });

  it('treats a confirmation of a new password as new', () => {
    mount('<input type="password" name="confirmNewPassword" />');

    expect(classifyPasswordInput(passwordEls()[0])).toBe('new');
  });
});

describe('getAutofillPasswordInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an empty array when there are no password inputs', () => {
    expect(getAutofillPasswordInputs([], [])).toEqual([]);
  });

  it('fills the password field on a standard login form', () => {
    mount(`
      <form>
        <input type="text" name="username" />
        <input type="password" name="password" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['password']);
  });

  it('fills a single password field even when there is no username field', () => {
    mount('<form><input type="password" name="password" /></form>');

    expect(namesOf(resolve())).toEqual(['password']);
  });

  it('fills only the first (old) field on a username-less 3-field change-password form', () => {
    mount(`
      <form>
        <input type="password" name="p1" />
        <input type="password" name="p2" />
        <input type="password" name="p3" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['p1']);
  });

  it('fills only the current-password field on a labelled change-password form', () => {
    mount(`
      <form>
        <input type="password" name="oldPassword" />
        <input type="password" name="newPassword" />
        <input type="password" name="confirmPassword" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['oldPassword']);
  });

  it('honours the explicit current-password field even when it is not the first one', () => {
    mount(`
      <form>
        <input type="password" name="p1" />
        <input type="password" name="p2" autocomplete="current-password" />
        <input type="password" name="p3" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['p2']);
  });

  it('fills nothing on a registration form (username + two new-password fields)', () => {
    mount(`
      <form>
        <input type="text" name="username" />
        <input type="password" name="p1" autocomplete="new-password" />
        <input type="password" name="p2" autocomplete="new-password" />
      </form>
    `);

    expect(resolve()).toEqual([]);
  });

  it('fills nothing on a username-less reset form with two new-password fields', () => {
    mount(`
      <form>
        <input type="password" name="p1" autocomplete="new-password" />
        <input type="password" name="p2" autocomplete="new-password" />
      </form>
    `);

    expect(resolve()).toEqual([]);
  });

  it('fills nothing on a username + two-field form with no current signal (registration shape)', () => {
    mount(`
      <form>
        <input type="text" name="username" />
        <input type="password" name="password1" />
        <input type="password" name="password2" />
      </form>
    `);

    expect(resolve()).toEqual([]);
  });

  it('fills the explicit current-password field even in a two-field group', () => {
    mount(`
      <form>
        <input type="password" name="p1" autocomplete="current-password" />
        <input type="password" name="p2" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['p1']);
  });

  it('fills the first non-new field on a username + 3-field change form (unlabeled old)', () => {
    mount(`
      <form>
        <input type="text" name="username" />
        <input type="password" name="p1" />
        <input type="password" name="p2" autocomplete="new-password" />
        <input type="password" name="p3" autocomplete="new-password" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['p1']);
  });

  it('does not fill a formless reset widget just because an unrelated formless email exists', () => {
    mount(`
      <input type="email" name="contactEmail" />
      <input type="password" name="p1" />
      <input type="password" name="p2" />
    `);

    expect(resolve()).toEqual([]);
  });

  it('fills nothing on an ambiguous username-less two-field form with no signals', () => {
    mount(`
      <form>
        <input type="password" name="p1" />
        <input type="password" name="p2" />
      </form>
    `);

    expect(resolve()).toEqual([]);
  });

  it('fills a single new-password field (autocomplete no longer skips a lone field)', () => {
    mount('<input type="password" name="password" autocomplete="new-password" />');

    expect(namesOf(resolve())).toEqual(['password']);
  });

  it('fills only the login password when a login and a registration form coexist', () => {
    mount(`
      <form id="login">
        <input type="text" name="loginUser" />
        <input type="password" name="loginPassword" />
      </form>
      <form id="register">
        <input type="text" name="regUser" />
        <input type="password" name="regPassword" autocomplete="new-password" />
        <input type="password" name="regConfirm" autocomplete="new-password" />
      </form>
    `);

    expect(namesOf(resolve())).toEqual(['loginPassword']);
  });

  it('fills the login password when an earlier registration form duplicates its id and carries a "Create password" label', () => {
    // Coexisting registration + login forms reuse id="Password"; a document-wide first-match
    // would give the login field the registration "Create password" label and wrongly skip it.
    mount(`
      <form id="register" action="/register">
        <input type="email" name="EmailAddress" id="EmailAddress" />
        <label for="Password">Create password</label>
        <input type="password" name="Password" id="Password" />
      </form>
      <form id="login" action="/login">
        <input type="email" name="Username" id="Username" />
        <label for="Password">Password</label>
        <input type="password" name="Password" id="Password" />
      </form>
    `);

    const loginPassword = passwordEls()[1];

    expect(classifyPasswordInput(loginPassword)).toBe('unknown');
    expect(resolve()).toEqual([loginPassword]);
  });

  it('fills the current field on a form-less change-password panel duplicated as a hidden responsive clone', () => {
    // Form-less panel duplicated as a hidden clone (same ids, identical label texts). The
    // label text is the only "current" signal, so identical-text duplicates must stay trusted.
    mount(`
      <section class="desktop-view">
        <div><div><label for="password">Current password</label></div><div><input type="password" id="password" name="password" /></div></div>
        <div><div><label for="password-new">New password</label></div><div><input type="password" id="password-new" name="passwordNew" /></div></div>
      </section>
      <section class="mobile-view" style="display:none">
        <div><div><label for="password">Current password</label></div><div><input type="password" id="password" name="password" /></div></div>
        <div><div><label for="password-new">New password</label></div><div><input type="password" id="password-new" name="passwordNew" /></div></div>
      </section>
    `);

    // The real pipeline passes only visible inputs — mirror that.
    const [visibleCurrent, visibleNew] = Array.from(document.querySelectorAll('.desktop-view input'));

    expect(classifyPasswordInput(visibleCurrent)).toBe('current');
    expect(getAutofillPasswordInputs([visibleCurrent, visibleNew], [])).toEqual([visibleCurrent]);
  });

  it('does not fill a form-less reset field whose "Create a new password" label has a differing hidden duplicate (misfill guard)', () => {
    // Visible reset field (first element with the id) plus a hidden login modal reusing it. The
    // reset field must keep its own label, stay "new", and never receive the stored password.
    mount(`
      <main>
        <div><label for="password">Create a new password</label></div>
        <div><input type="password" id="password" name="pwd1" /></div>
      </main>
      <div style="display:none">
        <form action="/login">
          <label for="password">Password</label>
          <input type="password" id="password" name="Password" />
        </form>
      </div>
    `);

    const resetInput = document.querySelector('main input');

    expect(classifyPasswordInput(resetInput)).toBe('new');
    expect(getAutofillPasswordInputs([resetInput], [])).toEqual([]);
  });

  it('keeps the current classification when a single control has an extra hidden error label (multi-label, no duplicate ids)', () => {
    // Multi-label markup: a visible label plus a hidden error label on the same unique control.
    // The differing second label must not disqualify the association.
    mount(`
      <div><label for="cur-pass">Current password</label></div>
      <div><input type="password" id="cur-pass" name="fld_a" /></div>
      <div><label for="cur-pass" hidden>Current password is required</label></div>
      <div><label for="new-pass">New password</label></div>
      <div><input type="password" id="new-pass" name="fld_b" /></div>
    `);

    const [current, next] = passwordEls();

    expect(classifyPasswordInput(current)).toBe('current');
    expect(namesOf(getAutofillPasswordInputs([current, next], []))).toEqual(['fld_a']);
  });

  it('fills only the first field on a formless username-less 3-field change widget', () => {
    mount(`
      <input type="password" name="p1" />
      <input type="password" name="p2" />
      <input type="password" name="p3" />
    `);

    expect(namesOf(resolve())).toEqual(['p1']);
  });

  it('preserves document order in the returned list', () => {
    mount(`
      <form id="a"><input type="text" name="ua" /><input type="password" name="pa" /></form>
      <form id="b"><input type="text" name="ub" /><input type="password" name="pb" autocomplete="current-password" /></form>
    `);

    expect(namesOf(resolve())).toEqual(['pa', 'pb']);
  });
});
