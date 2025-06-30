// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get domain information.
* @return {Object} The domain information object.
*/
const getDomainInfo = () => {
  const domainInfo = {
    minLength: null,
    maxLength: null,
    pattern: null
  };

  if (!document) {
    return domainInfo;
  }

  let passwordInput = document?.activeElement;

  if (passwordInput?.type !== 'password') {
    passwordInput = document.querySelector('input[type="password"]');
  }

  if (passwordInput && passwordInput?.getAttribute) {
    domainInfo.minLength = passwordInput.getAttribute('minlength') || passwordInput.getAttribute('data-minlength') || null;
    domainInfo.maxLength = passwordInput.getAttribute('maxlength') || passwordInput.getAttribute('data-maxlength') || null;
    domainInfo.pattern = passwordInput.getAttribute('pattern') || passwordInput.getAttribute('data-pattern') || null;
  }

  return domainInfo;
};

export default getDomainInfo;
