// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, memo } from 'react';
import { addLocale, locale } from 'primereact/api';
import { useI18n } from './I18nContext';
import buildPrimeReactLocale from '@/constants/primereact/index.js';

const PRIMEREACT_LOCALE_NAME = 'app';

/**
 * Provider component that synchronizes PrimeReact locale with the extension's i18n settings.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - Child components.
 * @return {JSX.Element} The children wrapped in locale management.
 */
const PrimeReactLocaleProvider = memo(({ children }) => {
  const { getMessage, lang, isLoading } = useI18n();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const localeConfig = buildPrimeReactLocale(getMessage);

    addLocale(PRIMEREACT_LOCALE_NAME, localeConfig);
    locale(PRIMEREACT_LOCALE_NAME);
    initializedRef.current = true;
  }, [getMessage, lang, isLoading]);

  return children;
});

export default PrimeReactLocaleProvider;
