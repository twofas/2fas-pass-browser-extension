// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle the URI click event.
* @param {Event} e - The click event.
* @param {Object} props - The props object.
* @return {void}
*/
const handleUriClick = (e, props) => {
  if (props.data.value === 'details') {
    e.preventDefault();
    e.stopPropagation();
  }

  props.toggleMenu(!props.more);

  if (import.meta.env.BROWSER === 'firefox') {
    setTimeout(() => {
      if (window && typeof window?.close === 'function') {
        window.close();
      }
    }, 10);
  }
};

export default handleUriClick;
