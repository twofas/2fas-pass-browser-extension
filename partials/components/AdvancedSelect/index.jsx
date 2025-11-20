// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Select from 'react-select';
import { useRef, useCallback, useEffect } from 'react';

/**
* Function component for an advanced select dropdown that closes when clicking outside and positions menu smartly.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AdvancedSelect (props) {
  const selectContainerRef = useRef(null);

  const handleClickOutside = useCallback(event => {
    if (
      props &&
      props?.onMenuClose &&
      typeof props?.onMenuClose === 'function' &&
      props?.menuIsOpen &&
      selectContainerRef?.current &&
      !selectContainerRef?.current?.contains(event.target) &&
      !props?.triggerRef?.current?.contains(event.target)
    ) {
      props.onMenuClose(false);
    }
  }, [props]);

  const calculateMenuPosition = useCallback(() => {
    let triggerElement = props?.triggerRef?.current;

    if (!triggerElement && selectContainerRef?.current) {
      triggerElement = selectContainerRef.current.querySelector('[class*="__control"]');
    }

    if (!triggerElement && selectContainerRef?.current) {
      triggerElement = selectContainerRef.current.querySelector('[class*="control"]');
    }

    if (!triggerElement && selectContainerRef?.current) {
      const selectElement = selectContainerRef.current.querySelector('[class*="__value-container"]');

      if (selectElement) {
        triggerElement = selectElement.closest('[class*="__select"]') || selectElement.closest('div') || selectElement.parentElement;
      }
    }

    if (!triggerElement && selectContainerRef?.current) {
      const children = selectContainerRef.current.children;

      if (children.length > 0) {
        triggerElement = children[0];
      }
    }

    if (!triggerElement) {
      return;
    }

    const rect = triggerElement.getBoundingClientRect();
    const menuPortalElement = document.getElementById('select-menu-portal');

    if (!menuPortalElement) {
      return;
    }

    menuPortalElement.style.opacity = '0';
    menuPortalElement.style.pointerEvents = 'none';

    const classNamePrefix = props?.classNamePrefix || 'react-select';
    const menuListSelector = `.${classNamePrefix}__menu-list`;

    const performPositioning = () => {
      let menuList = menuPortalElement.querySelector(menuListSelector);

      if (!menuList) {
        menuList = menuPortalElement.querySelector('[class*="__menu-list"]');
      }

      const realMenuHeight = menuList ? menuList.scrollHeight : 0;

      const bottomBarHeight = 72;
      const minSpaceRequired = 10;
      const spaceBelow = window.innerHeight - rect.bottom - bottomBarHeight;
      const spaceAbove = rect.top;

      const shouldPlaceOnTop = realMenuHeight > 0 && spaceBelow < (realMenuHeight + minSpaceRequired) && spaceAbove > (realMenuHeight + minSpaceRequired);
      const determinedPlacement = shouldPlaceOnTop ? 'top' : 'bottom';

      menuPortalElement.style.cssText = `position: fixed !important; left: ${rect.left}px !important; width: ${rect.width}px !important; z-index: 9999 !important;`;

      if (determinedPlacement === 'bottom') {
        menuPortalElement.style.cssText += ` top: ${rect.bottom}px !important; bottom: auto !important;`;
      } else {
        const topValue = rect.top - realMenuHeight;
        menuPortalElement.style.cssText += ` top: ${topValue}px !important; bottom: auto !important;`;
      }

      const menuElement = menuPortalElement.querySelector('[class*="__menu"]:not([class*="__menu-portal"]):not([class*="__menu-list"])');
      if (menuElement) {
        menuElement.style.cssText = `margin-top: 0 !important; margin-bottom: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; top: 0 !important; bottom: auto !important; z-index: 9999 !important;`;
      }

      const menuPortal = menuPortalElement.querySelector('[class*="__menu-portal"]');
      if (menuPortal) {
        menuPortal.style.cssText = `position: absolute !important; top: 0 !important; left: 0 !important; right: auto !important; bottom: auto !important; width: 100% !important; margin: 0 !important; z-index: 9999 !important;`;
      }

      requestAnimationFrame(() => {
        menuPortalElement.style.opacity = '1';
        menuPortalElement.style.pointerEvents = 'auto';
      });
    };

    requestAnimationFrame(performPositioning);
  }, [props?.triggerRef, props?.classNamePrefix]);

  const handleMenuOpen = useCallback(() => {
    calculateMenuPosition();

    if (props?.onMenuOpen && typeof props?.onMenuOpen === 'function') {
      props.onMenuOpen();
    }
  }, [calculateMenuPosition, props]);

  const handleMenuClose = useCallback(() => {
    if (props?.onMenuClose && typeof props?.onMenuClose === 'function') {
      props.onMenuClose();
    }
  }, [props]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    if (props?.menuIsOpen) {
      calculateMenuPosition();

      const handleResize = () => {
        calculateMenuPosition();
      };

      const handleScroll = () => {
        calculateMenuPosition();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [props?.menuIsOpen, calculateMenuPosition]);

  const menuPortalTarget = document.getElementById('select-menu-portal');

  return (
    <div ref={selectContainerRef}>
      <Select
        {...props}
        triggerRef={undefined}
        menuPlacement='auto'
        menuPortalTarget={menuPortalTarget}
        menuPosition='fixed'
        onMenuOpen={handleMenuOpen}
        onMenuClose={handleMenuClose}
      />
    </div>
  );
}

export default AdvancedSelect;
