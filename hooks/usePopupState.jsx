// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useEffect, useRef, useState } from 'react';
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
  const previousTabRef = useRef(null);
  const [scrollElement, setScrollElement] = useState(null);
  const scrollElementRef = useRef(null);

  const getTab = async () => {
    let tab;

    try {
      tab = await getLastActiveTab();
    } catch {}

    return tab;
  };

  const onScroll = e => {
    console.dir(popupState);
  };

  useEffect(() => {
    console.log('PopupStateProvider useEffect triggered', pathname, state, scrollElementRef.current);

    if (ignoredRoutes.includes(pathname)) {
      return;
    }

    getTab()
      .then(tab => {
        if (previousTabRef?.current?.id !== tab.id) {
          createPopupStateObjectForTab(tab.id);
        }

        previousTabRef.current = tab;

        getPopupStateObjectForTab(tab.id)
          .then(state => {
            setPopupState(state);
          });
      });
  }, [pathname, state]);

  useEffect(() => {
    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener('scroll', onScroll);

    return () => {
      scrollElement.removeEventListener('scroll', onScroll);
    };
  }, [scrollElement]);

  useEffect(() => {
    if (scrollElementRef.current && scrollElementRef.current !== scrollElement) {
      setScrollElement(scrollElementRef.current);
    }
  });

  const value = useMemo(
    () => ({
      location,
      popupState,
      scrollElementRef,
      setScrollElement
    }),
    [location, popupState, scrollElementRef, setScrollElement]
  );

  return <PopupStateContext.Provider value={value}>{children}</PopupStateContext.Provider>;
};

export const usePopupState = () => {
  return useContext(PopupStateContext);
};
