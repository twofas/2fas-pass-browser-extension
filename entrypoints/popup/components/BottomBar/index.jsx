// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './BottomBar.module.scss';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import { PULL_REQUEST_TYPES, CONNECT_VIEWS } from '@/constants';
import { useAuthState } from '@/hooks/useAuth';
import useConnectView from '../../hooks/useConnectView';
import tryWindowClose from '@/partials/browserInfo/tryWindowClose';
import NewWindowIcon from '@/assets/popup-window/new-window.svg?react';
import SettingsIcon from '@/assets/popup-window/settings.svg?react';
import FullSyncIcon from '@/assets/popup-window/full-sync.svg?react';
import ClearLink from '../ClearLink';
import { useI18n } from '@/partials/context/I18nContext';

/**
 * Resolves the effective theme (light/dark) based on storage value and system preference.
 * @param {string} themeValue - The theme value from storage ('light', 'dark', or 'unset').
 * @return {string} The effective theme ('light' or 'dark').
 */
const resolveEffectiveTheme = themeValue => {
  if (themeValue === 'unset' || !themeValue) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return themeValue;
};

/**
 * Applies theme colors to the security icon SVG template.
 * @param {object} secIcon - The security icon object with icon template and colors.
 * @param {string} theme - The theme to apply ('light' or 'dark').
 * @return {string|null} The themed SVG string or null if invalid.
 */
const applyThemeToSecIcon = (secIcon, theme) => {
  if (!secIcon?.icon || !secIcon?.colors) {
    return null;
  }

  return secIcon.icon
    .replaceAll('fill="SEC_COLOR_1"', `fill="${secIcon.colors[0][theme]}"`)
    .replaceAll('fill="SEC_COLOR_2"', `fill="${secIcon.colors[1][theme]}"`)
    .replaceAll('fill="SEC_COLOR_3"', `fill="${secIcon.colors[2]?.[theme] || secIcon.colors[0][theme]}"`);
};

/**
* Function component for the BottomBar.
* @return {JSX.Element} The rendered component.
*/
function BottomBar () {
  const { getMessage } = useI18n();
  const [secIconData, setSecIconData] = useState(null);
  const [effectiveTheme, setEffectiveTheme] = useState('light');
  const [separateWindow, setSeparateWindow] = useState(false);
  const [newWindowDisabled, setNewWindowDisabled] = useState(false);

  const svgContainerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { wsActive } = useWS();
  const { configured } = useAuthState();
  const { connectView } = useConnectView();

  const themedSvg = useMemo(
    () => applyThemeToSecIcon(secIconData, effectiveTheme),
    [secIconData, effectiveTheme]
  );

  const loadSecurityIconData = useCallback(async () => {
    try {
      const [secIcon, themeValue] = await Promise.all([
        storage.getItem('local:securityIcon'),
        storage.getItem('local:theme')
      ]);

      if (secIcon) {
        setSecIconData(secIcon);
      }

      setEffectiveTheme(resolveEffectiveTheme(themeValue));
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const popupCheck = useCallback(async () => {
    const isInSeparateWindow = await popupIsInSeparateWindow();
    setSeparateWindow(isInSeparateWindow);
  }, []);

  const handleNewWindow = useCallback(async () => {
    const { state } = location;

    try {
      if (location.pathname === '/fetch') {
        const data = encodeURIComponent(JSON.stringify({ ...state }));
        const res = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW,
          target: REQUEST_TARGETS.BACKGROUND,
          pathname: `/fetch/${data}`
        });

        if (res.status === 'error') {
          showToast(getMessage('error_feature_wrong_data'), 'error');
        }
      } else if (location.pathname === '/blocked') {
        const res = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW,
          target: REQUEST_TARGETS.BACKGROUND,
          pathname: '/'
        });

        if (res.status === 'error') {
          showToast(getMessage('error_feature_wrong_data'), 'error');
        }
      } else {
        const res = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW,
          target: REQUEST_TARGETS.BACKGROUND,
          pathname: location.pathname
        });

        if (res.status === 'error') {
          showToast(getMessage('error_feature_wrong_data'), 'error');
        }
      }

      const windowCloseTest = tryWindowClose();

      if (!windowCloseTest) {
        navigate('/blocked', { replace: true });
      }
    } catch (e) {
      CatchError(e);
    } finally {
      setNewWindowDisabled(false);
    }
  }, [location, navigate]);

  const staticButtonsClass = useMemo(() => {
    const path = location?.pathname;

    if (
      path === '/fetch' ||
      path.startsWith('/fetch/') ||
      path === '/fetch-external' ||
      path.startsWith('/fetch-external/') ||
      path === '/connect' && (connectView === CONNECT_VIEWS.Progress || connectView === CONNECT_VIEWS.PushSent)
    ) {
      return `${S.bottombarStatic} ${S.disabled}`;
    }

    return S.bottombarStatic;
  }, [location.pathname, connectView]);

  const newWindowButtonClass = useMemo(() =>
    separateWindow || location.pathname === '/blocked' ? S.hiddenPermanent : '',
    [separateWindow, location.pathname]
  );

  const settingsLinkClass = useMemo(() => {
    const path = location?.pathname;

    if (!path || path === '/blocked') {
      return '';
    }

    return path === '/settings' ? `${S.visible} ${S.disabled}` : S.visible;
  }, [location.pathname]);

  const fetchLinkClass = useMemo(() => {
    const path = location?.pathname;

    if (!configured || path === '/blocked') {
      return '';
    }

    if (path === '/fetch' || path.startsWith('/fetch/') || path === '/fetch-external' || path.startsWith('/fetch-external/')) {
      return `${S.visible} ${S.disabled}`;
    }

    return S.visible;
  }, [configured, location.pathname]);

  const secIconClass = useMemo(() =>
    `${S.bottombarSecIcon} ${themedSvg ? S.active : ''} ${wsActive ? S.wsActive : ''}`,
    [themedSvg, wsActive]
  );

  const newWindowTitle = useMemo(() => getMessage('open_in_new_window'), []);
  const settingsTitle = useMemo(() => getMessage('go_to_settings'), []);
  const tooltipHeader = useMemo(() => getMessage('bottom_bar_security_icon_tooltip_header'), []);
  const tooltipText = useMemo(() => getMessage('bottom_bar_security_icon_tooltip_text'), []);

  useEffect(() => {
    popupCheck()
      .then(loadSecurityIconData)
      .catch(CatchError);
  }, [popupCheck, loadSecurityIconData]);

  useEffect(() => {
    const handleThemeChange = async newThemeValue => {
      setEffectiveTheme(resolveEffectiveTheme(newThemeValue));
    };

    const unwatchTheme = storage.watch('local:theme', handleThemeChange);

    return () => {
      unwatchTheme();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = async () => {
      const currentTheme = await storage.getItem('local:theme');

      if (currentTheme === 'unset' || !currentTheme) {
        setEffectiveTheme(resolveEffectiveTheme(currentTheme));
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    if (!svgContainerRef.current || !themedSvg) {
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(themedSvg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    const parseError = doc.querySelector('parsererror');

    if (svgElement && !parseError) {
      svgContainerRef.current.innerHTML = '';
      svgContainerRef.current.appendChild(svgElement.cloneNode(true));
    }
  }, [themedSvg]);

  return (
    <>
      <footer className={S.bottombar}>
        <div className={staticButtonsClass}>
          <button
            className={newWindowButtonClass}
            onClick={async () => {
              setNewWindowDisabled(true);
              await handleNewWindow();
            }}
            title={newWindowTitle}
            disabled={newWindowDisabled}
          >
            <NewWindowIcon />
          </button>
          <ClearLink
            to='/settings'
            className={settingsLinkClass}
            title={settingsTitle}
            prefetch='intent'
          >
            <SettingsIcon />
          </ClearLink>
        </div>

        <div className={secIconClass}>
          <div className={S.bottombarSecIconContent} ref={svgContainerRef} />
        </div>

        <p className={S.bottombarSecIconTooltip}>
          <span>{tooltipHeader}</span>
          <span>{tooltipText}</span>
        </p>

        <div className={`${S.bottombarFetch} ${fetchLinkClass}`}>
          <ClearLink
            to='/fetch'
            state={{ action: PULL_REQUEST_TYPES.FULL_SYNC, from: 'bottomBar', data: {} }}
            title={getMessage('sync_title')}
            prefetch='intent'
          >
            <FullSyncIcon />
            <span>{getMessage('sync')}</span>
          </ClearLink>
        </div>
      </footer>
    </>
  );
}

export default memo(BottomBar);
