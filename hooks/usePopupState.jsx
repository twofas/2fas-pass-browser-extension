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

const PopupStateContext = createContext();
const ignoredRoutes = [
  '/blocked',
  '/connect',
  '/fetch',
  '/fetch-external'
];

/** 
* Function to provide popup state context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element} The context provider.
*/
export const PopupStateProvider = ({ children }) => {
  const { pathname, state } = useLocation();
  const [popupState, setPopupState] = useState({});
  const [scrollElement, setScrollElement] = useState(null);
  const previousTabRef = useRef(null);
  const scrollElementRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const storageDebounceTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  const getTab = useCallback(async () => {
    try {
      return await getLastActiveTab();
    } catch {
      return null;
    }
  }, []);

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
    if (ignoredRoutes.includes(pathname)) {
      return;
    }

    const shouldUpdate = !isInitializedRef.current || lastPathnameRef.current !== pathname;
    
    if (!shouldUpdate) {
      return;
    }

    lastPathnameRef.current = pathname;
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
  }, [pathname, getTab]);

  useEffect(() => {
    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', onScroll);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [scrollElement, onScroll]);

  useEffect(() => {
    if (scrollElementRef.current && scrollElementRef.current !== scrollElement) {
      setScrollElement(scrollElementRef.current);
    }
  });

  useEffect(() => {
    if (!previousTabRef.current || !popupState || Object.keys(popupState).length === 0) {
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
      
      let sessionPopupState = await storage.getItem('session:popupState');
      
      if (!sessionPopupState || typeof sessionPopupState !== 'object') {
        sessionPopupState = {};
      }
      
      if (JSON.stringify(sessionPopupState[tabId]) !== JSON.stringify(popupState)) {
        sessionPopupState[tabId] = popupState;
        await storage.setItem('session:popupState', sessionPopupState);
      }
    }, 300);

    return () => {
      if (storageDebounceTimerRef.current) {
        clearTimeout(storageDebounceTimerRef.current);
      }
    };
  }, [popupState]);

  const value = useMemo(
    () => ({
      scrollElementRef,
      setScrollElement
    }),
    [setScrollElement]
  );

  return <PopupStateContext.Provider value={value}>{children}</PopupStateContext.Provider>;
};

export const usePopupState = () => {
  return useContext(PopupStateContext);
};
