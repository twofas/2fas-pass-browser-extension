// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Gets a list of additional protocols based on the browser environment.
* @return {Array<string>} A list of additional protocols.
*/
const additionalProtocols = () => {
  const protocols = [
    'about:'
  ];

  if (
    import.meta.env.BROWSER === 'chrome' ||
    import.meta.env.BROWSER === 'chrome' ||
    import.meta.env.BROWSER === 'opera' ||
    import.meta.env.BROWSER === 'edge'
  ) {
    protocols.push('chrome-extension:');
    protocols.push('chrome:');
  }

  if (import.meta.env.BROWSER === 'firefox') {
    protocols.push('moz-extension:');
  }

  if (import.meta.env.BROWSER === 'opera') {
    protocols.push('opera:');
  }

  if (import.meta.env.BROWSER === 'edge') {
    protocols.push('edge:');
  }

  if (import.meta.env.BROWSER === 'safari') {
    protocols.push('safari-extension:');
  }

  return protocols;
};

export default additionalProtocols;
