// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// A submit counts as a login only when the control belongs to the form (or the form-less block) of a tracked password
// field, so a click on a cookie banner or a search box never vouches for a request.

import { describe, it, expect } from 'vitest';
import isInLoginForm from './isInLoginForm';

const make = html => {
  document.body.innerHTML = html;
};

const tracked = () => Array.from(document.querySelectorAll('input[type="password"], input[data-tracked]'));

describe('isInLoginForm', () => {
  it('matches a button of the form with a tracked password (Facebook role=button)', () => {
    make('<form><input name="email" data-tracked><input type="password"><div role="button" id="b"><span id="s">Log in</span></div></form>');

    expect(isInLoginForm(document.getElementById('b'), tracked())).toBe(true);
    expect(isInLoginForm(document.getElementById('s'), tracked())).toBe(true);
  });

  it('matches the form itself and any of its fields', () => {
    make('<form id="f"><input id="u" data-tracked><input type="password"></form>');

    expect(isInLoginForm(document.getElementById('f'), tracked())).toBe(true);
    expect(isInLoginForm(document.getElementById('u'), tracked())).toBe(true);
  });

  it('matches a button linked to the form with the form attribute', () => {
    make('<form id="f"><input type="password"></form><button form="f" id="b">Sign in</button>');

    expect(isInLoginForm(document.getElementById('b'), tracked())).toBe(true);
  });

  it('matches a form-less button close to the password field', () => {
    make('<div><div><input type="password"></div><div><button id="b">Sign in</button></div></div>');

    expect(isInLoginForm(document.getElementById('b'), tracked())).toBe(true);
  });

  it('ignores a button of another form', () => {
    make('<form><input type="password"></form><form><input type="search"><button id="b">Search</button></form>');

    expect(isInLoginForm(document.getElementById('b'), tracked())).toBe(false);
  });

  it('ignores a form-less button far from the password field (cookie banner)', () => {
    make('<div><div><div><div><div><div><div><button id="b">Accept</button></div></div></div></div></div></div></div><div><input type="password"></div>');

    expect(isInLoginForm(document.getElementById('b'), tracked())).toBe(false);
  });

  it('ignores everything when no password field is tracked', () => {
    make('<form><input data-tracked><button id="b">Next</button></form>');

    expect(isInLoginForm(document.getElementById('b'), tracked())).toBe(false);
  });

  it('ignores a password field removed from the page', () => {
    make('<form><input type="password"><button id="b">Sign in</button></form>');
    const inputs = tracked();
    document.querySelector('input').remove();

    expect(isInLoginForm(document.getElementById('b'), inputs)).toBe(false);
  });

  it('does not throw without an element', () => {
    expect(isInLoginForm(null, [])).toBe(false);
  });
});
