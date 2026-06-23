// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const SUBMIT_BUTTON_SELECTOR = 'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]';

/**
* Determines whether a click event represents a form "commit" interaction — the
* user activated a button-like control that, in single-page-app login flows,
* confirms a step without firing a native submit/Enter/unload event.
* Used to harvest pending input values (finding #9: multi-step logins where the
* step-1 username field is skip-tagged and therefore only captured on a commit
* event). Resolves the deepest target via composedPath() so shadow-DOM clicks
* are handled, walks up with closest() to tolerate clicks on inner content, and
* excludes reset controls (which never commit credentials).
* @param {Event} e - The click event.
* @return {boolean} True when the click targets a non-reset button-like element.
*/
const isSubmitButtonClick = e => {
  const path = typeof e?.composedPath === 'function' ? e.composedPath() : null;
  const target = (path && path[0]) || e?.target;

  if (!target || typeof target.closest !== 'function') {
    return false;
  }

  const button = target.closest(SUBMIT_BUTTON_SELECTOR);

  if (!button) {
    return false;
  }

  const type = typeof button.type === 'string' ? button.type.toLowerCase() : '';

  if (type === 'reset') {
    return false;
  }

  return true;
};

export default isSubmitButtonClick;
