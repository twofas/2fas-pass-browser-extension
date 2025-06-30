// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Checks if a service is T3 or T2 with a password.
* @param {Object} service - The service object to check.
* @return {boolean} True if the service is T3 or T2 with a password, false otherwise.
*/
const isT3orT2WithPassword = service => {
  if (
    !service?.securityType ||
    !Number.isInteger(service.securityType) ||
    service.securityType < 0 ||
    service.securityType > 2
  ) {
    throw new TwoFasError(TwoFasError.internalErrors.isT3orT2WithPasswordWrongSecurityTypeError);
  }
  
  return service.securityType === 2 || (service.securityType === 1 && service?.password && service?.password?.length > 0);
};

export default isT3orT2WithPassword;
