// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const I18nContext = createContext(null);

/**
 * Provider component that manages i18n state and triggers re-renders on language change.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - Child components.
 * @return {JSX.Element} The provider wrapper.
 */
export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(getI18nState().lang || 'default');
  const [isLoading, setIsLoading] = useState(!getI18nState().isInitialized);

  const reloadI18n = useCallback(async () => {
    setIsLoading(true);
    resetI18nCache();
    await initI18n();
    setLang(getI18nState().lang || 'default');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const initializeI18n = async () => {
      if (!getI18nState().isInitialized) {
        await initI18n();
        setLang(getI18nState().lang || 'default');
        setIsLoading(false);
      }
    };

    initializeI18n();
  }, []);

  useEffect(() => {
    const unwatch = storage.watch('local:lang', async newValue => {
      if (newValue !== lang) {
        await reloadI18n();
      }
    });

    return () => {
      if (unwatch) {
        unwatch();
      }
    };
  }, [lang, reloadI18n]);

  const value = {
    getMessage,
    lang,
    isLoading,
    reloadI18n
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to access i18n context with getMessage function and language state.
 * @return {Object} Object with getMessage function, lang, isLoading, and reloadI18n.
 */
export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    return {
      getMessage,
      lang: 'default',
      isLoading: false,
      reloadI18n: async () => {}
    };
  }

  return context;
};
