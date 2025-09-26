// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Popup.module.scss';
import { HashRouter, Route, Routes, Navigate } from 'react-router';
import { useEffect, useState, useMemo, memo, useRef } from 'react';
import { AuthProvider, useAuthState } from '@/hooks/useAuth';
import popupOnMessage from './events/popupOnMessage';
import lockShortcuts from './utils/lockShortcuts';
import lockRMB from './utils/lockRMB';
import setTheme from './utils/setTheme';
import isPopupInSeparateWindowExists from './utils/isPopupInSeparateWindowExists';
import { safariBlankLinks, storageAutoClearActions } from '@/partials/functions';
import ToastsContent from './components/ToastsContent';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';

// ROUTES
import ThisTab from './routes/ThisTab';
import Connect from './routes/Connect';
import AddNew from './routes/AddNew';
import Settings from './routes/Settings';
import SettingsAbout from './routes/Settings/SettingsAbout';
import SettingsPreferences from './routes/Settings/SettingsPreferences';
import SettingsSecurity from './routes/Settings/SettingsSecurity';
import SettingsReset from './routes/Settings/SettingsReset';
import SettingsSaveLoginExcludedDomains from './routes/Settings/SettingsSaveLoginExcludedDomains';
import Fetch from './routes/Fetch';
import FetchExternal from './routes/FetchExternal';
import Details from './routes/Details';
import PasswordGenerator from './routes/PasswordGenerator';
import NotFound from './routes/NotFound';
import Blocked from './routes/Blocked';

const emptyFunc = () => {};

const routeConfig = [
  { path: '/connect', component: Connect, isConnectRoute: true },
  { path: '/', component: ThisTab },
  { path: '/add-new', component: AddNew },
  { path: '/settings', component: Settings },
  { path: '/settings/about', component: SettingsAbout },
  { path: '/settings/preferences', component: SettingsPreferences },
  { path: '/settings/security', component: SettingsSecurity },
  { path: '/settings/reset', component: SettingsReset },
  { path: '/settings/save-login-excluded-domains', component: SettingsSaveLoginExcludedDomains },
  { path: '/fetch', component: Fetch },
  { path: '/fetch/:data', component: FetchExternal, noClassName: true },
  { path: '/details/:id', component: Details },
  { path: '/password-generator', component: PasswordGenerator },
  { path: '/blocked', component: Blocked, noGuard: true },
  { path: '*', component: NotFound }
];

/**
* RouteGuard component to handle access control based on authentication and block status.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The rendered component or null.
*/
const RouteGuard = memo(({ configured, blocked, isConnectRoute, children }) => {
  if (blocked) {
    return <Navigate replace to='/blocked' />;
  }

  if (isConnectRoute) {
    return configured ? <Navigate replace to='/' /> : children;
  }

  return configured ? children : <Navigate replace to='/connect' />;
});

/**
* AuthRoutes component that provides configured state to all routes.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered routes.
*/
const AuthRoutes = memo(({ blocked, configured }) => {
  const routeElements = useMemo(() => {
    return routeConfig.map(route => {
      const Component = route.component;
      const element = route.noGuard ? (
        <Component className={S.passScreen} />
      ) : (
        <RouteGuard
          configured={configured}
          blocked={blocked}
          isConnectRoute={route.isConnectRoute}
        >
          {route.noClassName ? <Component /> : <Component className={S.passScreen} />}
        </RouteGuard>
      );

      return (
        <Route
          key={route.path}
          path={route.path}
          element={element}
        />
      );
    });
  }, [configured, blocked]);

  return (
    <Routes>
      {routeElements}
    </Routes>
  );
});

/**
* AppContent component that contains the main app UI.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered content.
*/
const AppContent = memo(({ blocked }) => {
  const { configured } = useAuthState();

  return (
    <>
      <TopBar />
      <AuthRoutes blocked={blocked} configured={configured} />
      <BottomBar />
    </>
  );
});

/**
* Main app content - without AuthProvider since it's now in main.jsx
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered app.
*/
const MainApp = memo(({ blockedValue, mainSectionClassName }) => {
  return (
    <section className={mainSectionClassName}>
      <AppContent blocked={blockedValue} />
      <ToastsContent />
    </section>
  );
});

/**
* PopupContent wrapper that handles blocking logic
* @return {JSX.Element} The rendered component.
*/
const PopupContent = memo(({ loaded, blocked, blockedSectionClassName, mainSectionClassName }) => {
  if (!loaded) {
    return null;
  }

  if (blocked) {
    return (
      <section className={blockedSectionClassName}>
        <Blocked className={S.passScreen} />
      </section>
    );
  }

  return <MainApp blockedValue={blocked} mainSectionClassName={mainSectionClassName} />;
});

let initializationPromise = null;
let initializationResult = null;

const initializePopupOnce = async () => {
  if (initializationResult) {
    return initializationResult;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const [tab, otherPopupExists, ] = await Promise.all([
        browser?.tabs?.getCurrent().catch(() => null),
        isPopupInSeparateWindowExists(),
        setTheme()
      ]);

      const extUrl = browser.runtime.getURL('/popup.html');
      const isSeparateWindow = tab?.url?.includes(extUrl) || false;
      const blocked = !isSeparateWindow && otherPopupExists;

      initializationResult = {
        loaded: true,
        blocked,
        isSeparateWindow
      };

      return initializationResult;
    } catch (e) {
      CatchError(e);
      initializationResult = {
        loaded: true,
        blocked: false,
        isSeparateWindow: false
      };
      return initializationResult;
    }
  })();

  return initializationPromise;
};

/**
* PopupMain component that handles initialization and state
* @return {JSX.Element|null} The rendered component.
*/
const PopupMain = memo(() => {
  const [state, setState] = useState(() => {
    if (initializationResult) {
      return {
        loaded: initializationResult.loaded,
        blocked: initializationResult.blocked,
        isSeparateWindow: initializationResult.isSeparateWindow
      };
    }

    return {
      loaded: false,
      blocked: false,
      isSeparateWindow: false
    };
  });

  const initialized = useRef(false);
  const stateUpdated = useRef(false);

  const classNames = useMemo(() => {
    const baseClass = `${S.pass} ${!state.isSeparateWindow ? S.passNonSeparateWindow: ''} ${import.meta.env.BROWSER}`;
    return {
      blocked: `${baseClass} ${S.passBlocked}`,
      main: baseClass
    };
  }, [state.isSeparateWindow]);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    if (history?.scrollRestoration && history.scrollRestoration !== 'manual') {
      history.scrollRestoration = 'manual';
    }

    if (!initializationResult && !stateUpdated.current) {
      initializePopupOnce().then(result => {
        if (!stateUpdated.current) {
          stateUpdated.current = true;
          setState(prev => {
            if (prev.loaded === result.loaded &&
                prev.blocked === result.blocked &&
                prev.isSeparateWindow === result.isSeparateWindow) {
              return prev;
            }

            return {
              loaded: result.loaded,
              blocked: result.blocked,
              isSeparateWindow: result.isSeparateWindow
            };
          });
        }
      });
    }

    browser.runtime.onMessage.addListener(popupOnMessage);
    document.addEventListener('keydown', lockShortcuts);
    document.addEventListener('contextmenu', lockRMB);
    window.addEventListener('error', emptyFunc);
    window.addEventListener('unhandledrejection', emptyFunc);
    window.addEventListener('focus', storageAutoClearActions);

    if (import.meta.env.BROWSER === 'safari') {
      document.addEventListener('click', safariBlankLinks);
    }

    return () => {
      browser.runtime.onMessage.removeListener(popupOnMessage);
      document.removeEventListener('keydown', lockShortcuts);
      document.removeEventListener('contextmenu', lockRMB);
      window.removeEventListener('error', emptyFunc);
      window.removeEventListener('unhandledrejection', emptyFunc);
      window.removeEventListener('focus', storageAutoClearActions);

      if (import.meta.env.BROWSER === 'safari') {
        document.removeEventListener('click', safariBlankLinks);
      }
    };
  }, []);

  return (
    <PopupContent
      loaded={state.loaded}
      blocked={state.blocked}
      blockedSectionClassName={classNames.blocked}
      mainSectionClassName={classNames.main}
    />
  );
});

/**
* Popup component to render the main popup UI with HashRouter.
* @return {JSX.Element} The rendered component.
*/
function Popup () {
  return (
    <HashRouter>
      <AuthProvider>
        <PopupMain />
      </AuthProvider>
    </HashRouter>
  );
}

export default Popup;
