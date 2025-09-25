// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './BottomBar.module.scss';
import { useState, useEffect, lazy, useCallback, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import popupIsInSeparateWindow from '@/partials/functions/popupIsInSeparateWindow';
import { PULL_REQUEST_TYPES } from '@/constants';

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
    // @TODO: Current data
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
  
      if (window && typeof window?.close === 'function' && import.meta.env.BROWSER !== 'safari') {
        window.close();
      } else {
        navigate('/blocked', { replace: true });
      }
    } catch (e) {
      CatchError(e);
    } finally {
      setNewWindowDisabled(false);
    }
  }, [location, navigate]);

  const newWindowButtonClass = useMemo(() =>
    separateWindow ? S.hiddenPermanent : '',
    [separateWindow]
  );

  const settingsLinkClass = useMemo(() => {
    const path = location?.pathname;

    if (!path || path === '/connect' || path === '/blocked') {
      return '';
    }

    return path === '/settings' ? `${S.visible} ${S.disabled}` : S.visible;
  }, [location.pathname]);

  const fetchLinkClass = useMemo(() => {
    const path = location?.pathname;
    return path && path !== '/connect' && path !== '/blocked' ? S.visible : '';
  }, [location.pathname]);

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
        <div className={S.bottombarStatic}>
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

        <div className={`${S.bottombarFetch} ${fetchLinkClass}`}>
          <Link
            to='/fetch'
            state={{ action: PULL_REQUEST_TYPES.FULL_SYNC, from: 'bottomBar' }}
            title={browser.i18n.getMessage('sync_title')}
            prefetch='intent'
          >
            <FullSyncIcon />
            <span>{browser.i18n.getMessage('sync')}</span>
          </Link>
        </div>

        <p className={S.bottombarSecIconTooltip}>
          <span>{tooltipHeader}</span>
          <span>{tooltipText}</span>
        </p>
      </footer>
    </>
  );
}

export default memo(BottomBar);
