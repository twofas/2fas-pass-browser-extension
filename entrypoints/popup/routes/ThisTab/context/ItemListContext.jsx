// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useRef, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

const ItemListContext = createContext(null);

/**
* Provider component for managing item list events via event delegation.
* @param {Object} props - The component props.
* @param {React.ReactNode} props.children - Child components.
* @return {JSX.Element} The provider component.
*/
export function ItemListProvider ({ children }) {
  const openItemIdRef = useRef(null);
  const listenersRef = useRef(new Set());
  const isClosingRef = useRef(false);

  const notify = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

  const subscribe = useCallback(callback => {
    listenersRef.current.add(callback);
    return () => listenersRef.current.delete(callback);
  }, []);

  const getOpenItemId = useCallback(() => openItemIdRef.current, []);

  const openMenu = useCallback(itemId => {
    openItemIdRef.current = itemId;
    isClosingRef.current = false;
    notify();
  }, [notify]);

  const closeMenu = useCallback(() => {
    openItemIdRef.current = null;
    notify();
  }, [notify]);

  const handleScroll = useCallback(event => {
    if (!openItemIdRef.current || isClosingRef.current) {
      return;
    }

    const selectMenuListElement = document.querySelector('.react-select-dropdown__menu-list');

    if (selectMenuListElement && (event.target === selectMenuListElement || selectMenuListElement.contains(event.target))) {
      return;
    }

    isClosingRef.current = true;
    closeMenu();
  }, [closeMenu]);

  const handleClickOutside = useCallback(event => {
    if (!openItemIdRef.current) {
      return;
    }

    const itemElement = event.target.closest('[data-item-id]');

    if (itemElement && itemElement.dataset.itemId === openItemIdRef.current) {
      return;
    }

    const selectMenu = document.querySelector('.react-select-dropdown__menu');

    if (selectMenu && selectMenu.contains(event.target)) {
      return;
    }

    closeMenu();
  }, [closeMenu]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [handleScroll, handleClickOutside]);

  const value = useMemo(() => ({
    subscribe,
    getOpenItemId,
    openMenu,
    closeMenu
  }), [subscribe, getOpenItemId, openMenu, closeMenu]);

  return (
    <ItemListContext.Provider value={value}>
      {children}
    </ItemListContext.Provider>
  );
}

const noOpOpen = () => {};
const noOpClose = () => {};
const noOpSubscribe = () => () => {};
const noOpGetOpenItemId = () => null;
const fallbackContext = {
  subscribe: noOpSubscribe,
  getOpenItemId: noOpGetOpenItemId,
  openMenu: noOpOpen,
  closeMenu: noOpClose
};

/**
* Hook to access the item list context.
* @return {Object} The context value.
*/
function useItemList () {
  const context = useContext(ItemListContext);
  return context || fallbackContext;
}

/**
* Hook to check if a specific item's menu is open. Only re-renders when this item's state changes.
* @param {string} itemId - The item ID to check.
* @return {boolean} True if this item's menu is open.
*/
export function useIsItemOpen (itemId) {
  const { subscribe, getOpenItemId } = useItemList();
  const getSnapshot = useCallback(() => getOpenItemId() === itemId, [getOpenItemId, itemId]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
* Hook to get menu actions without subscribing to openItemId changes.
* @return {Object} Object with openMenu and closeMenu functions.
*/
export function useItemMenuActions () {
  const { openMenu, closeMenu } = useItemList();
  return useMemo(() => ({ openMenu, closeMenu }), [openMenu, closeMenu]);
}

export default ItemListContext;
