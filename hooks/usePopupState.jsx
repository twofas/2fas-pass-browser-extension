// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'react-router';
import getLastActiveTab from '@/partials/functions/getLastActiveTab';
import createPopupStateObjectForTab from '@/partials/popupState/createPopupStateObjectForTab';
import getPopupStateObjectForTab from '@/partials/popupState/getPopupStateObjectForTab';
import getKey from '@/partials/sessionStorage/getKey';
import getCurrentDevice from '@/partials/functions/getCurrentDevice';

const PopupStateContext = createContext();
const ignoredRoutePrefixes = [
  '/blocked',
  '/connect',
  '/fetch'
];

const isIgnoredRoute = (pathname) => {
  return ignoredRoutePrefixes.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
};

/** 
* Function to provide popup state context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element} The context provider.
*/
export const PopupStateProvider = ({ children }) => {
  const { pathname } = useLocation();
  const [popupState, setPopupState] = useState({});
  const [popupStateData, setPopupStateData] = useState(null);
  const previousTabRef = useRef(null);
  const scrollElementRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const storageDebounceTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastPathnameRef = useRef(pathname);
  const popupStateKeyRef = useRef(null);

  const getTab = useCallback(async () => {
    try {
      return await getLastActiveTab();
    } catch {
      return null;
    }
  }, []);

  const getPopupStateKey = useCallback(async () => {
    if (popupStateKeyRef.current) {
      return popupStateKeyRef.current;
    }

    try {
      const device = await getCurrentDevice();

      if (!device?.uuid) {
        return null;
      }

      const key = await getKey('popup_state', { uuid: device.uuid });
      popupStateKeyRef.current = key;

      return key;
    } catch (error) {
      CatchError(error);
      return null;
    }
  }, []);

  const getPopupState = useCallback(async () => {
    try {
      const extURL = browser.runtime.getURL('/popup.html');
      const isPopupTab = tab => tab.url === extURL;

      const targetTab = await getLastActiveTab(
        null,
        tab => !isPopupTab(tab)
      );

      if (!targetTab || !targetTab.id) {
        return null;
      }

      const storageKey = await getPopupStateKey();

      if (!storageKey) {
        return null;
      }

      const allPopupStates = await storage.getItem(`session:${storageKey}`);
      const tabPopupState = allPopupStates?.[targetTab.id];

      return tabPopupState || null;
    } catch (error) {
      CatchError(error);
      return null;
    }
  }, [getPopupStateKey]);

  const onScroll = useCallback(e => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPopupState(prev => {
        if (prev.scrollPosition === e.target.scrollTop) {
          return prev;
        }

        return {
          ...prev,
          scrollPosition: e.target.scrollTop
        };
      });
    }, 200);
  }, []);

  useEffect(() => {
    if (isIgnoredRoute(pathname)) {
      setPopupState({ scrollPosition: 0, data: {}, href: '/' });
      setPopupStateData({ scrollPosition: 0, data: {}, href: '/' });
      return;
    }

    const shouldUpdate = !isInitializedRef.current || lastPathnameRef.current !== pathname;
    
    if (!shouldUpdate) {
      return;
    }

    lastPathnameRef.current = pathname;
    
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      getTab()
        .then(tab => {
          if (!tab) {
            return;
          }

          const tabChanged = previousTabRef?.current?.id !== tab.id;
          
          if (tabChanged) {
            previousTabRef.current = tab;
            createPopupStateObjectForTab(tab.id);
          }

          getPopupStateObjectForTab(tab.id)
            .then(state => {
              if (state) {
                setPopupState(state);
              }
            });
        });
    } else {
      getTab()
        .then(tab => {
          if (!tab) {
            return;
          }

          const tabChanged = previousTabRef?.current?.id !== tab.id;
          
          if (tabChanged) {
            previousTabRef.current = tab;
            getPopupStateObjectForTab(tab.id)
              .then(state => {
                if (state) {
                  setPopupState(state);
                }
              });
          }
        });
    }
  }, [pathname, getTab]);

  useEffect(() => {
    getPopupState().then(state => {
      if (state) {
        setPopupStateData(state);
      }
    });
  }, [getPopupState]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hasPopupState = popupState && Object.keys(popupState).length > 0;
    
    if (!previousTabRef.current || !hasPopupState) {
      return;
    }

    if (storageDebounceTimerRef.current) {
      clearTimeout(storageDebounceTimerRef.current);
    }

    storageDebounceTimerRef.current = setTimeout(async () => {
      const tabId = previousTabRef.current?.id;

      if (!tabId) {
        return;
      }

      const storageKey = await getPopupStateKey();

      if (!storageKey) {
        return;
      }

      const sessionPopupState = await storage.getItem(`session:${storageKey}`) || {};

      if (JSON.stringify(sessionPopupState[tabId]) !== JSON.stringify(popupState)) {
        sessionPopupState[tabId] = popupState;
        await storage.setItem(`session:${storageKey}`, sessionPopupState);
      }
    }, 300);

    return () => {
      if (storageDebounceTimerRef.current) {
        clearTimeout(storageDebounceTimerRef.current);
      }
    };
  }, [popupState, getPopupStateKey]);

  const setScrollElementRef = useCallback((element) => {
    const prevElement = scrollElementRef.current;
    
    if (prevElement && prevElement._scrollHandler) {
      prevElement.removeEventListener('scroll', prevElement._scrollHandler);
      delete prevElement._scrollHandler;
    }
    
    scrollElementRef.current = element;
    
    if (element && element !== prevElement) {
      element._scrollHandler = onScroll;
      element.addEventListener('scroll', onScroll, { passive: true });
    }
  }, [onScroll]);

  const setHref = useCallback(href => {
    setPopupState(prev => {
      if (prev.href === href) {
        return prev;
      }

      return {
        ...prev,
        href,
        scrollPosition: 0,
        data: {}
      };
    });

    setPopupStateData(prev => {
      const shouldKeepScroll = prev?.href === href;

      if (!prev) {
        return { href, scrollPosition: 0, data: {} };
      }

      return {
        ...prev,
        href,
        scrollPosition: shouldKeepScroll ? prev.scrollPosition : 0,
        data: shouldKeepScroll ? prev.data : {}
      };
    });
  }, []);

  const shouldRestoreScroll = useMemo(() => popupStateData?.href === pathname, [popupStateData?.href, pathname]);

  const setData = useCallback((data) => {
    setPopupState(prev => {
      const newData = typeof data === 'function' ? data(prev.data || {}) : data;

      if (JSON.stringify(prev.data) === JSON.stringify(newData)) {
        return prev;
      }

      return {
        ...prev,
        data: newData
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      setScrollElementRef,
      scrollElementRef,
      getPopupState,
      popupStateData,
      setPopupStateData,
      setHref,
      shouldRestoreScroll,
      setData,
      popupState
    }),
    [setScrollElementRef, getPopupState, popupStateData, setHref, shouldRestoreScroll, setData, popupState]
  );

  return <PopupStateContext.Provider value={value}>{children}</PopupStateContext.Provider>;
};

export const usePopupState = () => {
  return useContext(PopupStateContext);
};
