// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to detect if the user is using the Brave browser.
* @return {boolean} True if the user is using Brave, false otherwise.
*/
const isBrave = () => {
  if (navigator?.userAgentData?.brands) {
    return navigator.userAgentData.brands.filter(item => item?.brand?.includes('Brave')).length > 0;
  } else if (navigator.brave !== undefined) {
    return navigator.brave.isBrave.name === 'isBrave';
  } else {
    return false;
  }
};

export default isBrave;
