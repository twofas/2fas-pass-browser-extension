// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useEffect, useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import setConfigured from '@/partials/sessionStorage/configured/setConfigured';
import cleanupDevices from '@/partials/functions/cleanupDevices';

const AuthStateContext = createContext();
const AuthActionsContext = createContext();

const LoadingSkeleton = memo(() => <div style={{ opacity: 0 }} />);

/**
* AuthProviderInner - The actual provider that renders after loading
* @param {ReactNode} children - The child components.
* @param {boolean} configured - The configured state.
* @param {Object} actions - The auth actions.
* @return {JSX.Element} The context provider.
*/
const AuthProviderInner = memo(({ children, configured, actions }) => {
  const stateValue = useMemo(
    () => ({ configured }),
    [configured]
  );

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={stateValue}>
        {children}
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  );
});

/**
* Function to provide authentication context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element|null} The context provider or null while loading.
*/
export const AuthProvider = memo(({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setStateConfigured] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(async () => {
    await setConfigured(Date.now());
    setStateConfigured(true);
    navigate('/', { replace: true });
  }, [navigate]);

  const logout = useCallback(async (clear = true) => {
    console.log('Logout! Clear:', clear);
    await cleanupDevices();

    if (clear) {
      await browser.storage.session.clear();
    }

    setStateConfigured(false);
    navigate('/connect', { replace: true });
  }, [navigate]);

  const actions = useMemo(() => ({ login, logout }), [login, logout]);

  useEffect(() => {
    const getData = async () => {
      const dateStorage = await getConfiguredBoolean();
      setStateConfigured(dateStorage);
      setIsLoading(false);
    };

    getData();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <AuthProviderInner
      configured={configured}
      actions={actions}
    >
      {children}
    </AuthProviderInner>
  );
});

export const useAuthState = () => {
  const context = useContext(AuthStateContext);

  if (context === undefined) {
    return { configured: false };
  }

  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);

  if (context === undefined) {
    return { login: () => {}, logout: () => {} };
  }

  return context;
};
