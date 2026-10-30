// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to tell whether a form submit comes from the user. form.requestSubmit() called by the page fires a trusted
* submit event too, so the page must also have a transient user activation (a click or key press moments before).
* Browsers without the user activation API rely on isTrusted alone.
* @param {SubmitEvent} e - The submit event.
* @return {boolean} True when the user submitted the form.
*/
const isUserFormSubmit = e => e?.isTrusted !== false && globalThis.navigator?.userActivation?.isActive !== false;

export default isUserFormSubmit;
