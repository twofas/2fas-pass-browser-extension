// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Checks if the current window is the top-level frame.
* @return {boolean} True if the current window is the top frame.
*/
const isTopFrame = () => window.self === window.top;

export default isTopFrame;
