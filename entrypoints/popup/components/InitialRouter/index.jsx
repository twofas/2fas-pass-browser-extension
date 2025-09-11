// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

/**
 * Component to handle initial routing based on saved route
 * @param {Object} props - The component props
 * @param {string} props.initialRoute - The initial route to navigate to
 * @param {ReactNode} props.children - Child components
 * @return {JSX.Element} The rendered children
 */
function InitialRouter({ initialRoute, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { configured } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current || !initialRoute || configured === null) {
      return;
    }

    const currentPath = location.pathname;
    
    if (initialRoute !== '/' && currentPath === '/') {
      const protectedRoutes = [
        '/add-new',
        '/settings',
        '/settings-about',
        '/settings-preferences',
        '/settings-security',
        '/settings-reset',
        '/settings-save-login-excluded-domains',
        '/fetch',
        '/details',
        '/password-generator'
      ];

      const isProtectedRoute = protectedRoutes.some(route => 
        initialRoute.startsWith(route)
      );

      if (isProtectedRoute && configured === false) {
        hasRedirected.current = true;
        return;
      }

      if (initialRoute === '/connect' && configured === true) {
        hasRedirected.current = true;
        return;
      }

      navigate(initialRoute, { replace: true });
    }
    
    hasRedirected.current = true;
  }, [initialRoute, navigate, configured]);

  return children;
}

export default InitialRouter;