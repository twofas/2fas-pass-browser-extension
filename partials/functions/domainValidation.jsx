// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import URIMatcher from '@/partials/URIMatcher';

/** 
* Validates a domain name by checking if it is empty, normalizes it, and checks
* @param {string} value - The domain name to validate.
* @return {JSX.Element} The validation result.
*/
const domainValidation = value => {
  if (!value) {
    return <p className={pI.empty}>{browser.i18n.getMessage('no_valid_domain')}</p>;
  }

  let normalizedUrl;

  try {
    normalizedUrl = URIMatcher.normalizeUrl(value, true);
  } catch {
    return <p>{browser.i18n.getMessage('no_valid_domain')}</p>;
  }

  if (!URIMatcher.isUrl(normalizedUrl, true)) {
    return <p>{browser.i18n.getMessage('no_valid_domain')}</p>;
  }

  return <p className={pI.empty}>{browser.i18n.getMessage('no_valid_domain')}</p>;
};

export default domainValidation;
