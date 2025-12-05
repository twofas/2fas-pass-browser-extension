// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';

const ItemListContext = createContext(null);

/**
* Provider component for managing item list events via event delegation.
* @param {Object} props - The component props.
* @param {React.ReactNode} props.children - Child components.
* @return {JSX.Element} The provider component.
*/
export function ItemListProvider ({ children }) {
  const [openItemId, setOpenItemId] = useState(null);
  const openItemIdRef = useRef(null);
  const isClosingRef = useRef(false);

  const openMenu = useCallback(itemId => {
    openItemIdRef.current = itemId;
    isClosingRef.current = false;
    setOpenItemId(itemId);
  }, []);

  const closeMenu = useCallback(() => {
    openItemIdRef.current = null;
    setOpenItemId(null);
  }, []);

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
    openItemId,
    openMenu,
    closeMenu
  }), [openItemId, openMenu, closeMenu]);

  return (
    <ItemListContext.Provider value={value}>
      {children}
    </ItemListContext.Provider>
  );
}

const noOpOpen = () => {};
const noOpClose = () => {};
const fallbackContext = {
  openItemId: null,
  openMenu: noOpOpen,
  closeMenu: noOpClose
};

/**
* Hook to access the item list context.
* @return {Object} The context value with openItemId, openMenu, and closeMenu.
*/
export function useItemList () {
  const context = useContext(ItemListContext);
  return context || fallbackContext;
}

export default ItemListContext;
