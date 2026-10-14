// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect, afterEach } from 'vitest';
import hasParentContextDeniedKeyword from './hasParentContextDeniedKeyword.js';

describe('hasParentContextDeniedKeyword', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('finds a denied keyword in an ancestor class name', () => {
    document.body.innerHTML = '<div class="contact-form"><form><input id="i" /></form></div>';

    expect(hasParentContextDeniedKeyword(document.getElementById('i'))).toBe(true);
  });

  it('does not inspect the boundary element or anything above it', () => {
    document.body.innerHTML = '<div class="newsletter"><form id="f" class="search"><input id="i" /></form></div>';

    expect(hasParentContextDeniedKeyword(document.getElementById('i'), document.getElementById('f'))).toBe(false);
  });

  it('still inspects the ancestors below the boundary', () => {
    document.body.innerHTML = '<form id="f"><div class="footer-newsletter"><input id="i" /></div></form>';

    expect(hasParentContextDeniedKeyword(document.getElementById('i'), document.getElementById('f'))).toBe(true);
  });

  it('climbs past an element that is not an ancestor of the input', () => {
    document.body.innerHTML = '<div class="newsletter"><form><input id="i" /></form></div><form id="other"></form>';

    expect(hasParentContextDeniedKeyword(document.getElementById('i'), document.getElementById('other'))).toBe(true);
  });
});
