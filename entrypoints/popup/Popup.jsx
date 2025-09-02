// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Popup.module.scss';
import { Route, Routes, Navigate, useLocation } from 'react-router';
import { useEffect, lazy, useState, useMemo, useCallback, memo } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { MatchingLoginsProvider } from '@/hooks/useMatchingLogins';
import { WSProvider } from '@/hooks/useWS';
import { PopupStateProvider } from '@/hooks/usePopupState';
import popupOnMessage from './events/popupOnMessage';
import Blocked from './routes/Blocked';
import safariBlankLinks from '@/partials/functions/safariBlankLinks';
import lockShortcuts from './utils/lockShortcuts';
import lockRMB from './utils/lockRMB';
import setTheme from './utils/setTheme';
import isPopupInSeparateWindowExists from './utils/isPopupInSeparateWindowExists';
import storageAutoClearActions from '@/partials/functions/storageAutoClearActions';

const TopBar = lazy(() => import('./components/TopBar'));
const BottomBar = lazy(() => import('./components/BottomBar'));
const ThisTab = lazy(() => import('./routes/ThisTab'));
const Connect = lazy(() => import('./routes/Connect'));
const AddNew = lazy(() => import('./routes/AddNew'));
const Settings = lazy(() => import('./routes/Settings'));
const SettingsAbout = lazy(() => import('./routes/Settings/SettingsAbout'));
const SettingsPreferences = lazy(() => import('./routes/Settings/SettingsPreferences'));
const SettingsSecurity = lazy(() => import('./routes/Settings/SettingsSecurity'));
const SettingsReset = lazy(() => import('./routes/Settings/SettingsReset'));
const SettingsSaveLoginExcludedDomains = lazy(() => import('./routes/Settings/SettingsSaveLoginExcludedDomains'));
const Fetch = lazy(() => import('./routes/Fetch'));
const FetchExternal = lazy(() => import('./routes/FetchExternal'));
const Details = lazy(() => import('./routes/Details'));
const PasswordGenerator = lazy(() => import('./routes/PasswordGenerator'));
const NotFound = lazy(() => import('./routes/NotFound'));
const ToastsContent = lazy(() => import('./components/ToastsContent'));

/** 
* ProtectedRoute component to handle access control based on authentication status.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The rendered component or null.
*/
const ProtectedRoute = memo(props => {
  const { blockedRoute, children } = props;
  const { configured } = useAuth();

  if (configured === null || configured === undefined) {
    return null;
  }

  if (blockedRoute) {
    return <Navigate to='/blocked' />;
  }

  if (configured === false) {
    return <Navigate to='/connect' />;
  }

  return children;
});

/** 
* ConnectProtectedRoute component to handle access control for the Connect route.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The rendered component or null.
*/
const ConnectProtectedRoute = memo(props => {
  const { blockedRoute, children } = props;
  const { configured } = useAuth();

  if (configured === null || configured === undefined) {
    return null;
  }

  if (blockedRoute) {
    return <Navigate to='/blocked' />;
  }

  if (configured === true) {
    return <Navigate to='/' />;
  }

  return children;
});

/** 
* Popup component to render the main popup UI.
* @return {JSX.Element|null} The rendered component or null.
*/
function Popup () {
  const [blockedRoute, setBlockedRoute] = useState(false);
  const [separateWindow, setSeparateWindow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const location = useLocation();

  const isThisPopupIsInSeparateWindow = useCallback(async () => {
    let tab;

    try {
      tab = await browser?.tabs?.getCurrent();
    } catch {}

    if (!tab) {
      setSeparateWindow(false);
      return false;
    } else {
      const extUrl = browser.runtime.getURL('/popup.html');

      if (tab?.url?.includes(extUrl)) {
        setSeparateWindow(true);
        return true;
      } else {
        setSeparateWindow(false);
        return false;
      }
    }
  }, []);

  const checkBlockedRoute = useCallback(async () => {
    const popupInNewWindow = await isPopupInSeparateWindowExists();

    if (popupInNewWindow) {
      const thisPopupInNewWindow = await isThisPopupIsInSeparateWindow();

      if (thisPopupInNewWindow) {
        return setBlockedRoute(false);
      } else {
        return setBlockedRoute(true);
      }
    } else {
      return setBlockedRoute(false);
    }
  }, [isThisPopupIsInSeparateWindow]);

  const blockedSectionClassName = useMemo(() => 
    `${S.pass} ${S.passBlocked} ${!separateWindow ? S.passNonSeparateWindow: ''} ${import.meta.env.BROWSER}`,
    [separateWindow]
  );

  const mainSectionClassName = useMemo(() => 
    `${S.pass} ${!separateWindow ? S.passNonSeparateWindow: ''} ${import.meta.env.BROWSER}`,
    [separateWindow]
  );

  useEffect(() => {
    if (blockedRoute) {
      return;
    }

    if (history?.scrollRestoration && history.scrollRestoration !== 'manual') {
      history.scrollRestoration = 'manual';
    }

    Promise.all([
      setTheme(),
      checkBlockedRoute()
    ]).then(() => {
      setLoaded(true);
      
      browser.runtime.onMessage.addListener(popupOnMessage);

      document.addEventListener('keydown', lockShortcuts);
      document.addEventListener('contextmenu', lockRMB);

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleError);

      if (import.meta.env.BROWSER === 'safari') {
        document.addEventListener('click', safariBlankLinks);
      }
    }).catch(e => {
      CatchError(e);
    });

    return () => {
      browser.runtime.onMessage.removeListener(popupOnMessage);

      document.removeEventListener('keydown', lockShortcuts);
      document.removeEventListener('contextmenu', lockRMB);

      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);

      if (import.meta.env.BROWSER === 'safari') {
        document.removeEventListener('click', safariBlankLinks);
      }
    };
  }, [checkBlockedRoute]);

  useEffect(() => {
    window.addEventListener('focus', storageAutoClearActions);

    return () => {
      window.removeEventListener('focus', storageAutoClearActions);
    };
  }, []);

  if (!loaded) {
    return null;
  } else if (blockedRoute || location.pathname === '/blocked') {
    return (
      <section className={blockedSectionClassName}>
        <Blocked className={S.passScreen} />
      </section>
    );
  }

  return (
    <section className={mainSectionClassName}>
      <PopupStateProvider>
        <AuthProvider>
          <WSProvider>
            <MatchingLoginsProvider>
              <TopBar />
              <Routes>
                <Route path='/connect' element={<ConnectProtectedRoute blockedRoute={blockedRoute}><Connect className={S.passScreen} /></ConnectProtectedRoute>} />
                <Route path='/' element={<ProtectedRoute blockedRoute={blockedRoute}><ThisTab className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/add-new' element={<ProtectedRoute blockedRoute={blockedRoute}><AddNew className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/settings' element={<ProtectedRoute blockedRoute={blockedRoute}><Settings className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/settings-about' element={<ProtectedRoute blockedRoute={blockedRoute}><SettingsAbout className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/settings-preferences' element={<ProtectedRoute blockedRoute={blockedRoute}><SettingsPreferences className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/settings-security' element={<ProtectedRoute blockedRoute={blockedRoute}><SettingsSecurity className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/settings-reset' element={<ProtectedRoute blockedRoute={blockedRoute}><SettingsReset className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/settings-save-login-excluded-domains' element={<ProtectedRoute blockedRoute={blockedRoute}><SettingsSaveLoginExcludedDomains className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/fetch' element={<ProtectedRoute blockedRoute={blockedRoute}><Fetch className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/fetch/:data' element={<ProtectedRoute blockedRoute={blockedRoute}><FetchExternal /></ProtectedRoute>} />
                <Route path='/details/:id' element={<ProtectedRoute blockedRoute={blockedRoute}><Details className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/password-generator' element={<ProtectedRoute blockedRoute={blockedRoute}><PasswordGenerator className={S.passScreen} /></ProtectedRoute>} />
                <Route path='/blocked' element={<Blocked className={S.passScreen} />} />
                <Route path='*' element={<ProtectedRoute blockedRoute={blockedRoute}><NotFound className={S.passScreen} /></ProtectedRoute>} />
              </Routes>
            </MatchingLoginsProvider>
            <BottomBar />
          </WSProvider>
        </AuthProvider>
      </PopupStateProvider>
      
      <ToastsContent />
    </section>
  );
}

export default memo(Popup);
