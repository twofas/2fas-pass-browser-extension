// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';

/**
* Function to render the Not Found component.
* Logs the invalid route and redirects to home.
* @return {JSX.Element} The rendered component.
*/
function NotFound () {
  const location = useLocation();

  useEffect(() => {
    try {
      throw new TwoFasError(TwoFasError.internalErrors.notFoundRoute, {
        additional: { pathname: location.pathname }
      });
    } catch (e) {
      CatchError(e);
    }
  }, [location.pathname]);

  return <Navigate to='/' replace />;
}

export default NotFound;
