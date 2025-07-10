// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import additionalProtocols from './additionalProtocols';

/** 
* Generates a regular expression to match browser protocols.
* @return {RegExp} A regular expression to match browser protocols.
*/
const generateProtocolRegex = () => {
  const internalProtocolsArray = additionalProtocols();
  const internalProtocols = internalProtocolsArray.map(protocol => protocol.replaceAll(':', '')).join('|');
  return new RegExp(`^(ftp|http|https|${internalProtocols})?\://`, 'i');
};

export default generateProtocolRegex;
