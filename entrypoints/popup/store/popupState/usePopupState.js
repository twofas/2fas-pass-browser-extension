// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router';
import usePopupStateStore from './index';

/**
* Custom hook that wraps usePopupStateStore with automatic pathname handling.
* @return {Object} Store methods with pathname pre-filled.
*/
const usePopupState = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const setDataToStore = usePopupStateStore(state => state.setData);
  const setBatchDataToStore = usePopupStateStore(state => state.setBatchData);
  const clearDataFromStore = usePopupStateStore(state => state.clearData);
  const clearAllDataFromStore = usePopupStateStore(state => state.clearAllData);
  const setScrollPositionToStore = usePopupStateStore(state => state.setScrollPosition);
  const setItemToStore = usePopupStateStore(state => state.setItem);
  const href = usePopupStateStore(state => state.href);
  const setHref = usePopupStateStore(state => state.setHref);
  const popHref = usePopupStateStore(state => state.popHref);
  const getLastHref = usePopupStateStore(state => state.getLastHref);
  const getPreviousHref = usePopupStateStore(state => state.getPreviousHref);
  const clearHref = usePopupStateStore(state => state.clearHref);

  const pathDataForPathname = usePopupStateStore(state => state.pathData[pathname]);

  const data = useMemo(() => pathDataForPathname?.data || {}, [pathname, pathDataForPathname]);

  const setData = useCallback((name, value) => {
    setDataToStore(pathname, name, value);
  }, [setDataToStore, pathname]);

  const setBatchData = useCallback(updates => {
    setBatchDataToStore(pathname, updates);
  }, [setBatchDataToStore, pathname]);

  const clearData = useCallback(() => {
    clearDataFromStore(pathname);
  }, [clearDataFromStore, pathname]);

  const scrollPosition = useMemo(() => pathDataForPathname?.scrollPosition || 0, [pathDataForPathname]);

  const setScrollPosition = useCallback(position => {
    setScrollPositionToStore(pathname, position);
  }, [setScrollPositionToStore, pathname]);

  const setItem = useCallback(item => {
    setItemToStore(pathname, item);
  }, [setItemToStore, pathname]);

  return {
    pathname,
    data,
    setData,
    setBatchData,
    clearData,
    clearAllData: clearAllDataFromStore,
    scrollPosition,
    setScrollPosition,
    setItem,
    href,
    setHref,
    popHref,
    getLastHref,
    getPreviousHref,
    clearHref
  };
};

export default usePopupState;
