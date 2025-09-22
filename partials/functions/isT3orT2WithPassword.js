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
    !Number.isInteger(service.securityType) ||
    service.securityType < SECURITY_TIER.TOP_SECRET ||
    service.securityType > SECURITY_TIER.SECRET
  ) {
    throw new TwoFasError(TwoFasError.internalErrors.isT3orT2WithPasswordWrongSecurityTypeError);
  }
  
  return service.securityType === SECURITY_TIER.SECRET || (service.securityType === SECURITY_TIER.HIGHLY_SECRET && service?.password && service?.password?.length > 0);
};

export default isT3orT2WithPassword;
