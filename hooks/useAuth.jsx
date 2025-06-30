// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import setConfigured from '@/partials/sessionStorage/configured/setConfigured';
import cleanupDevices from '@/partials/functions/cleanupDevices';

const AuthContext = createContext();

/** 
* Function to provide authentication context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element} The context provider.
*/
export const AuthProvider = ({ children }) => {
  const [configured, setStateConfigured] = useState(undefined);
  const navigate = useNavigate();

  const getData = async () => {
    const dateStorage = await getConfiguredBoolean();
    await setStateConfigured(dateStorage);
  };

  useEffect(() => {
    getData();
  }, []);

  const login = async () => {
    await setConfigured(new Date().valueOf());
    await setStateConfigured(true);
    navigate('/', { replace: true });
  };

  const logout = async (clear = true) => {
    await cleanupDevices();

    if (clear) {
      await browser.storage.session.clear();
    }
    
    await setStateConfigured(false);
    navigate('/connect', { replace: true });
  };

  const value = useMemo(
    () => ({
      configured,
      login,
      logout,
    }),
    [configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};