// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/constants', async () => {
  const realIgnoredTypes = (await vi.importActual('@/constants/ignoredTypes.js')).default;

  return {
    ignoredTypes: realIgnoredTypes,
    userNameSelectors: () => ['input[autocomplete="username"]'],
    userNameAttributes: ['name', 'id', 'autocomplete'],
    userNameWords: ['user', 'login', 'email'],
    userNameDeniedKeywords: ['password', 'pass', 'pwd'],
    personalInfoDeniedKeywords: [],
    personalInfoDeniedAutocompleteValues: []
  };
});

vi.mock('../functions/isVisible', () => ({ default: () => true }));
vi.mock('../functions/hasParentContextDeniedKeyword', () => ({ default: () => false }));
vi.mock('@/partials/functions/uniqueElementOnly', () => ({ default: () => true }));
vi.mock('../../entrypoints/content/functions/autofillFunctions/getShadowRoots', () => ({ default: () => [] }));

import getUsernameInputs from './getUsernameInputs';

class FakeHTMLFormElement {}

class FakeNode {
  static DOCUMENT_POSITION_FOLLOWING = 4;
}

const makeInput = ({ type = 'text', name = '', id = '', order = 0 }) => ({
  type,
  name,
  id,
  order,
  getAttribute: () => null,
  compareDocumentPosition: other => (other.order > order ? 4 : 2),
  closest: () => null
});

const makeForm = orderedInputs => {
  const form = Object.create(FakeHTMLFormElement.prototype);

  form.querySelectorAll = selector => {
    if (selector.includes(':not([type="password"])')) {
      return orderedInputs.filter(input => input.type !== 'password');
    }

    return orderedInputs.slice();
  };
  form.querySelector = selector => {
    if (selector === 'input[type="password"]') {
      return orderedInputs.find(input => input.type === 'password') || null;
    }

    return null;
  };

  orderedInputs.forEach(input => {
    input.closest = sel => (sel === 'form' ? form : null);
  });

  return form;
};

describe('getUsernameInputs fallback (password forms with no heuristic username match)', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { querySelectorAll: () => [] });
    vi.stubGlobal('HTMLFormElement', FakeHTMLFormElement);
    vi.stubGlobal('Node', FakeNode);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never returns a password field, even one with a non-English name', () => {
    const username = makeInput({ type: 'text', name: 'login', order: 0 });
    const password = makeInput({ type: 'password', name: 'haslo', order: 1 });
    const form = makeForm([username, password]);

    const result = getUsernameInputs([form]);

    expect(result.some(input => input.type === 'password')).toBe(false);
    expect(result).toContain(username);
  });

  it('returns a single username candidate for multi-field forms instead of every input', () => {
    const companyId = makeInput({ type: 'text', name: 'company', order: 0 });
    const username = makeInput({ type: 'text', name: 'username', order: 1 });
    const password = makeInput({ type: 'password', name: 'haslo', order: 2 });
    const captcha = makeInput({ type: 'text', name: 'captcha', order: 3 });
    const form = makeForm([companyId, username, password, captcha]);

    const result = getUsernameInputs([form]);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(username);
  });
});

describe('getUsernameInputs prioritizes inputs sharing a form with password inputs', () => {
  beforeEach(() => {
    vi.stubGlobal('HTMLFormElement', FakeHTMLFormElement);
    vi.stubGlobal('Node', FakeNode);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns only the username inputs inside the provided password forms', () => {
    const passwordForm = Object.create(FakeHTMLFormElement.prototype);
    const otherForm = Object.create(FakeHTMLFormElement.prototype);
    const insideUsername = makeInput({ name: 'login', order: 0 });
    const outsideUsername = makeInput({ name: 'login', order: 1 });

    insideUsername.closest = selector => (selector === 'form' ? passwordForm : null);
    outsideUsername.closest = selector => (selector === 'form' ? otherForm : null);

    vi.stubGlobal('document', {
      querySelectorAll: selector =>
        (selector.includes('autocomplete="username"') ? [insideUsername, outsideUsername] : [])
    });

    const result = getUsernameInputs([passwordForm]);

    expect(result).toEqual([insideUsername]);
  });
});
