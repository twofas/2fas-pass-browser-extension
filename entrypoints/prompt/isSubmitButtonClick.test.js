// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Regression coverage for finding #9: multi-step logins where step 1 is a
// username-only form (no password input anywhere) and the user confirms the
// step by clicking a NON-submit button. The step-1 username carries
// twofas-pass-skip='true', so live capture is suppressed; the value is only
// harvested when a "commit" event flushes pending inputs. Native submit and
// Enter already trigger a flush — this helper detects the missing third commit
// signal: a click on a button-like control. It must match real SPA "Next"/
// "Continue" controls (<button type="button">, [role="button"], submit/button/
// image inputs) and ignore everything else, including reset buttons (which
// never commit credentials).

import { describe, it, expect } from 'vitest';
import isSubmitButtonClick from './isSubmitButtonClick';

const make = (html, selector = '*') => {
  document.body.innerHTML = html;

  return document.querySelector(selector);
};

const clickOn = el => ({ target: el });
const composedClickOn = (...path) => ({ composedPath: () => path, target: path[0] });

describe('isSubmitButtonClick — commit-click detection (finding #9)', () => {
  it('matches a non-submit <button type="button"> (the classic SPA "Next" control)', () => {
    const el = make('<button type="button">Next</button>', 'button');

    expect(isSubmitButtonClick(clickOn(el))).toBe(true);
  });

  it('matches a default <button> (implicit type=submit)', () => {
    const el = make('<button>Continue</button>', 'button');

    expect(isSubmitButtonClick(clickOn(el))).toBe(true);
  });

  it('matches an explicit <button type="submit">', () => {
    const el = make('<button type="submit">Sign in</button>', 'button');

    expect(isSubmitButtonClick(clickOn(el))).toBe(true);
  });

  it('matches <input type="submit">, <input type="button"> and <input type="image">', () => {
    expect(isSubmitButtonClick(clickOn(make('<input type="submit">', 'input')))).toBe(true);
    expect(isSubmitButtonClick(clickOn(make('<input type="button">', 'input')))).toBe(true);
    expect(isSubmitButtonClick(clickOn(make('<input type="image">', 'input')))).toBe(true);
  });

  it('matches a custom [role="button"] element (div/anchor styled as a button)', () => {
    expect(isSubmitButtonClick(clickOn(make('<div role="button">Log in</div>', 'div')))).toBe(true);
    expect(isSubmitButtonClick(clickOn(make('<a role="button" href="#">Log in</a>', 'a')))).toBe(true);
  });

  it('walks up to the button when the click lands on an inner element', () => {
    const span = make('<button type="button"><span class="i">Next</span></button>', 'span.i');

    expect(isSubmitButtonClick(clickOn(span))).toBe(true);
  });

  it('ignores <button type="reset"> — a reset never commits credentials', () => {
    const el = make('<button type="reset">Clear</button>', 'button');

    expect(isSubmitButtonClick(clickOn(el))).toBe(false);
  });

  it('ignores <input type="reset"> and <input type="text">', () => {
    expect(isSubmitButtonClick(clickOn(make('<input type="reset">', 'input')))).toBe(false);
    expect(isSubmitButtonClick(clickOn(make('<input type="text">', 'input')))).toBe(false);
  });

  it('ignores plain non-button elements (anchor without role, bare div)', () => {
    expect(isSubmitButtonClick(clickOn(make('<a href="#">link</a>', 'a')))).toBe(false);
    expect(isSubmitButtonClick(clickOn(make('<div>panel</div>', 'div')))).toBe(false);
  });

  it('prefers composedPath()[0] so shadow-DOM clicks resolve to the real target', () => {
    const span = make('<button type="button"><span class="i">Next</span></button>', 'span.i');
    const button = span.closest('button');

    expect(isSubmitButtonClick(composedClickOn(span, button))).toBe(true);
  });

  it('falls back to e.target when composedPath() is empty', () => {
    const el = make('<button type="button">Next</button>', 'button');

    expect(isSubmitButtonClick({ composedPath: () => [], target: el })).toBe(true);
  });

  it('never throws on malformed events (null, missing target, non-element target)', () => {
    expect(isSubmitButtonClick(null)).toBe(false);
    expect(isSubmitButtonClick(undefined)).toBe(false);
    expect(isSubmitButtonClick({})).toBe(false);
    expect(isSubmitButtonClick({ target: null })).toBe(false);
    expect(isSubmitButtonClick({ target: document })).toBe(false);
  });
});
