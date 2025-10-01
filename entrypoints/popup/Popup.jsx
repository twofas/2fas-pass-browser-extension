// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Popup.module.scss';
import { HashRouter, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router';
import { useEffect, useState, useMemo, memo, useRef, lazy, Suspense } from 'react';
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
import usePopupStateStore from './store/popupState';
import useHref from './hooks/useHref';
import { addToNavigationHistory } from './utils/navigationHistory';
import Blocked from './routes/Blocked';

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

const emptyFunc = () => {};

const routeConfig = [
  { path: '/connect', component: Connect },
  { path: '/', component: ThisTab, isProtectedRoute: true },
  { path: '/add-new', component: AddNew, isProtectedRoute: true },
  { path: '/settings', component: Settings, isProtectedRoute: false },
  { path: '/settings/about', component: SettingsAbout, isProtectedRoute: false },
  { path: '/settings/preferences', component: SettingsPreferences, isProtectedRoute: false },
  { path: '/settings/security', component: SettingsSecurity, isProtectedRoute: false },
  { path: '/settings/preferences/reset', component: SettingsReset, isProtectedRoute: false },
  { path: '/settings/preferences/save-login-excluded-domains', component: SettingsSaveLoginExcludedDomains, isProtectedRoute: false },
  { path: '/fetch', component: Fetch, isProtectedRoute: true },
  { path: '/fetch/:data', component: FetchExternal, noClassName: true, isProtectedRoute: true },
  { path: '/details/:id', component: Details, isProtectedRoute: true },
  { path: '/password-generator', component: PasswordGenerator, isProtectedRoute: true },
  { path: '/blocked', component: Blocked },
  { path: '*', component: NotFound }
];

/**
* RouteGuard component to handle access control based on authentication and block status.
* @param {Object} props - The component props.
* @return {JSX.Element|null} The rendered component or null.
*/
const RouteGuard = memo(({ configured, blocked, isProtectedRoute, children }) => {
  if (blocked) {
    return <Navigate replace to='/blocked' />;
  }

  if (isProtectedRoute) {
    return configured ? children : <Navigate replace to='/connect' />;
  }

  return configured ? <Navigate replace to='/' /> : children;
});

/**
* AuthRoutes component that provides configured state to all routes.
* Handles initial navigation based on stored href before rendering routes.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered routes.
*/
const AuthRoutes = memo(({ blocked, configured }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedHref = usePopupStateStore(state => state.href);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const hasNavigated = useRef(false);

  useHref();
  
  useEffect(() => {
    addToNavigationHistory(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (hasNavigated.current || !configured) {
      setInitialCheckDone(true);
      return;
    }

    const excludedRoutes = ['/connect', '/', '/fetch', '/blocked'];

    if (storedHref && location.pathname === '/' && !excludedRoutes.includes(storedHref)) {
      if (!storedHref.startsWith('/fetch/')) {
        hasNavigated.current = true;
        navigate(storedHref, { replace: true });
      }
    }

    setInitialCheckDone(true);
  }, [navigate, storedHref, location.pathname, configured]);

  const routeElements = useMemo(() => {
    return routeConfig.map(route => {
      const Component = route.component;
      const element = route.isProtectedRoute ? (
        <RouteGuard
          configured={configured}
          blocked={blocked}
          isProtectedRoute={route.isProtectedRoute}
        >
          {route.noClassName ? <Component /> : <Component className={S.passScreen} />}
        </RouteGuard>
      ) : (
        <Component className={S.passScreen} />
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

  if (!initialCheckDone) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Routes>
        {routeElements}
      </Routes>
    </Suspense>
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
    window.addEventListener('focus', storageAutoClearActions);

    if (import.meta.env.BROWSER === 'safari') {
      document.addEventListener('click', safariBlankLinks);
    }

    requestAnimationFrame(() => {
      window.addEventListener('error', emptyFunc);
      window.addEventListener('unhandledrejection', emptyFunc);
    });

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
