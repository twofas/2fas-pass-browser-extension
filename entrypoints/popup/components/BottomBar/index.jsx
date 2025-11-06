// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './BottomBar.module.scss';
import { useState, useEffect, lazy, useCallback, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import { PULL_REQUEST_TYPES, CONNECT_VIEWS } from '@/constants';
import { useAuthState } from '@/hooks/useAuth';
import useConnectView from '../../hooks/useConnectView';
import tryWindowClose from '@/partials/browserInfo/tryWindowClose';

const NewWindowIcon = lazy(() => import('@/assets/popup-window/new-window.svg?react'));
const SettingsIcon = lazy(() => import('@/assets/popup-window/settings.svg?react'));
const FullSyncIcon = lazy(() => import('@/assets/popup-window/full-sync.svg?react'));

/** 
* Function to get the security icon.
* @async
* @return {Promise<string>} The SVG content of the security icon.
*/
const getSecIcon = async () => {
  const secIcon = await storage.getItem('local:securityIcon');
  let t = await storage.getItem('local:theme');

  if (t === 'unset') {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    t = isDarkMode ? 'dark' : 'light';
  }

  // FUTURE - theme change proofing
  return secIcon.icon
    .replaceAll('fill="SEC_COLOR_1"', `fill="${secIcon.colors[0][t]}"`)
    .replaceAll('fill="SEC_COLOR_2"', `fill="${secIcon.colors[1][t]}"`)
    .replaceAll('fill="SEC_COLOR_3"', `fill="${secIcon.colors[2][t]}"`);
};

/** 
* Function component for the BottomBar.
* @return {JSX.Element} The rendered component.
*/
function BottomBar () {
  const [securityIcon, setSecurityIcon] = useState('');
  const [separateWindow, setSeparateWindow] = useState(false);
  const [newWindowDisabled, setNewWindowDisabled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { wsActive } = useWS();
  const { configured } = useAuthState();
  const { connectView } = useConnectView();

  const setSecIcon = useCallback(async () => {
    const svgContent = await getSecIcon();

    setTimeout(() => {
      setSecurityIcon(svgContent);
    }, 310);
  }, []);

  const popupCheck = useCallback(async () => {
    const isInSeparateWindow = await popupIsInSeparateWindow();
    setSeparateWindow(isInSeparateWindow);
  }, []);

  const handleNewWindow = useCallback(async () => {
    setNewWindowDisabled(true);
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
          showToast(browser.i18n.getMessage('error_feature_wrong_data'), 'error');
        }
      } else if (location.pathname === '/blocked') {
        const res = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW,
          target: REQUEST_TARGETS.BACKGROUND,
          pathname: '/'
        });

        if (res.status === 'error') {
          showToast(browser.i18n.getMessage('error_feature_wrong_data'), 'error');
        }
      } else {
        const res = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.OPEN_POPUP_WINDOW_IN_NEW_WINDOW,
          target: REQUEST_TARGETS.BACKGROUND,
          pathname: location.pathname
        });

        if (res.status === 'error') {
          showToast(browser.i18n.getMessage('error_feature_wrong_data'), 'error');
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
    separateWindow ? S.hiddenPermanent : '',
    [separateWindow]
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
    `${S.bottombarSecIcon} ${securityIcon ? S.active : ''} ${wsActive ? S.wsActive : ''}`,
    [securityIcon, wsActive]
  );

  const newWindowTitle = useMemo(() => browser.i18n.getMessage('open_in_new_window'), []);
  const settingsTitle = useMemo(() => browser.i18n.getMessage('go_to_settings'), []);
  const tooltipHeader = useMemo(() => browser.i18n.getMessage('bottom_bar_security_icon_tooltip_header'), []);
  const tooltipText = useMemo(() => browser.i18n.getMessage('bottom_bar_security_icon_tooltip_text'), []);

  useEffect(() => {
    try {
      popupCheck()
        .then(setSecIcon);
    } catch (e) {
      CatchError(e);
    }
  }, [popupCheck, setSecIcon]);

  return (
    <>
      <footer className={S.bottombar}>
        <div className={staticButtonsClass}>
          <button
            className={newWindowButtonClass}
            onClick={handleNewWindow}
            title={newWindowTitle}
            disabled={newWindowDisabled}
          >
            <NewWindowIcon />
          </button>
          <Link
            to='/settings'
            className={settingsLinkClass}
            title={settingsTitle}
            prefetch='intent'
          >
            <SettingsIcon />
          </Link>
        </div>

        <div className={secIconClass}>
          <div className={S.bottombarSecIconContent} dangerouslySetInnerHTML={{ __html: securityIcon }} />
        </div>

        <p className={S.bottombarSecIconTooltip}>
          <span>{tooltipHeader}</span>
          <span>{tooltipText}</span>
        </p>

        <div className={`${S.bottombarFetch} ${fetchLinkClass}`}>
          <Link
            to='/fetch'
            state={{ action: PULL_REQUEST_TYPES.FULL_SYNC, from: 'bottomBar', data: {} }}
            title={browser.i18n.getMessage('sync_title')}
            prefetch='intent'
          >
            <FullSyncIcon />
            <span>{browser.i18n.getMessage('sync')}</span>
          </Link>
        </div>
      </footer>
    </>
  );
}

export default memo(BottomBar);
