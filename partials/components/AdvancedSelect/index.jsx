// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Select from 'react-select';
import { useRef, useCallback, useEffect, useState } from 'react';

let activeMenuCloseCallback = null;

/**
* Function component for an advanced select dropdown that closes when clicking outside and positions menu smartly.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AdvancedSelect (props) {
  const selectContainerRef = useRef(null);
  const selectRef = useRef(null);
  const closeCallbackRef = useRef(null);
  const [internalMenuIsOpen, setInternalMenuIsOpen] = useState(false);

  const handleClickOutside = useCallback(event => {
    if (!props?.menuIsOpen) {
      return;
    }

    const triggerContains = props?.triggerRef?.current?.contains(event.target);
    const selectContains = selectContainerRef?.current?.contains(event.target);
    const isClickOnTrigger = triggerContains || selectContains;

    if (isClickOnTrigger) {
      return;
    }

    const menuPortalElement = document.getElementById('select-menu-portal');
    const containsTarget = menuPortalElement?.contains(event.target);

    if (
      activeMenuCloseCallback === closeCallbackRef.current &&
      !containsTarget
    ) {
      activeMenuCloseCallback();
      activeMenuCloseCallback = null;
    }
  }, [props?.triggerRef, props?.menuIsOpen, props?.classNamePrefix]);

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

      if (!menuList) {
        requestAnimationFrame(performPositioning);
        return;
      }

      const menuElement = menuPortalElement.querySelector('[class*="__menu"]:not([class*="__menu-portal"]):not([class*="__menu-list"])');

      if (!menuElement) {
        return;
      }

      const menuElementRect = menuElement.getBoundingClientRect();
      const realMenuHeight = menuElementRect.height || (menuList ? menuList.scrollHeight : 0);

      const menuStyles = getComputedStyle(menuElement);
      const cssTopOffsetRaw = menuStyles.top;
      let cssTopOffset = cssTopOffsetRaw.includes('%') ? 0 : (parseFloat(cssTopOffsetRaw) || 0);

      if (cssTopOffset > 50) {
        cssTopOffset = 8;
      }

      const cssRightRaw = menuStyles.right;
      const cssRightValue = parseFloat(cssRightRaw) || 0;
      const hasRightZeroPositioning = cssRightValue === 0 && cssRightRaw !== 'auto';

      const cssTransform = menuStyles.transform;
      let hasCenteredPositioning = false;

      if (cssTransform && cssTransform !== 'none') {
        if (cssTransform.includes('translateX(-50%)')) {
          hasCenteredPositioning = true;
        } else if (cssTransform.startsWith('matrix(')) {
          const matrixMatch = cssTransform.match(/matrix\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^,]+),/);

          if (matrixMatch) {
            const translateX = parseFloat(matrixMatch[1]);
            hasCenteredPositioning = translateX < 0;
          }
        }
      }

      const bottomBarHeight = 72;
      const minSpaceRequired = 10;
      const spaceBelow = window.innerHeight - rect.bottom - bottomBarHeight;
      const spaceAbove = rect.top;

      const shouldPlaceOnTop = realMenuHeight > 0 && spaceBelow < (realMenuHeight + minSpaceRequired + cssTopOffset) && spaceAbove > (realMenuHeight + minSpaceRequired + cssTopOffset);

      const menuWidth = menuElementRect.width || rect.width;

      if (hasCenteredPositioning) {
        const triggerCenterX = rect.left + (rect.width / 2);
        menuPortalElement.style.cssText = `position: fixed !important; left: ${triggerCenterX}px !important; transform: translateX(-50%) !important; z-index: 9999 !important;`;
      } else if (hasRightZeroPositioning) {
        const rightValue = window.innerWidth - rect.right;
        menuPortalElement.style.cssText = `position: fixed !important; right: ${rightValue}px !important; width: ${menuWidth}px !important; z-index: 9999 !important;`;
      } else {
        menuPortalElement.style.cssText = `position: fixed !important; left: ${rect.left}px !important; width: ${rect.width}px !important; z-index: 9999 !important;`;
      }

      if (shouldPlaceOnTop) {
        const topValue = rect.top - realMenuHeight - cssTopOffset;
        menuPortalElement.style.cssText += ` top: ${topValue}px !important; bottom: auto !important;`;
      } else {
        const topValue = rect.bottom + cssTopOffset;
        menuPortalElement.style.cssText += ` top: ${topValue}px !important; bottom: auto !important;`;
      }

      menuElement.style.cssText = `margin-top: 0 !important; margin-bottom: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; top: 0 !important; left: 0 !important; right: auto !important; bottom: auto !important; z-index: 9999 !important; position: relative !important; transform: none !important;`;

      const menuPortal = menuPortalElement.querySelector('[class*="__menu-portal"]');

      if (menuPortal) {
        menuPortal.style.cssText = `position: static !important; top: auto !important; left: auto !important; right: auto !important; bottom: auto !important; width: 100% !important; margin: 0 !important; z-index: 9999 !important; transform: none !important;`;
      }

      requestAnimationFrame(() => {
        menuPortalElement.style.opacity = '1';
        menuPortalElement.style.pointerEvents = 'auto';
      });
    };

    requestAnimationFrame(performPositioning);
  }, [props?.triggerRef, props?.classNamePrefix]);

  const handleMenuOpen = useCallback(() => {
    if (activeMenuCloseCallback && activeMenuCloseCallback !== closeCallbackRef.current) {
      activeMenuCloseCallback();
    }

    closeCallbackRef.current = () => {
      if (selectRef.current) {
        if (selectRef.current.inputRef) {
          selectRef.current.inputRef.blur();
        } else if (typeof selectRef.current.blur === 'function') {
          selectRef.current.blur();
        }
      }

      if (props?.onMenuClose && typeof props?.onMenuClose === 'function') {
        props.onMenuClose();
      }

      setInternalMenuIsOpen(false);
    };

    activeMenuCloseCallback = closeCallbackRef.current;
    setInternalMenuIsOpen(true);

    calculateMenuPosition();

    if (props?.onMenuOpen && typeof props?.onMenuOpen === 'function') {
      props.onMenuOpen();
    }
  }, [calculateMenuPosition, props]);

  const handleMenuClose = useCallback(() => {
    const menuPortalElement = document.getElementById('select-menu-portal');

    if (menuPortalElement) {
      menuPortalElement.style.opacity = '0';
      menuPortalElement.style.pointerEvents = 'none';
    }

    if (activeMenuCloseCallback === closeCallbackRef.current) {
      activeMenuCloseCallback = null;
    }

    setInternalMenuIsOpen(false);

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
    const isMenuOpen = props?.menuIsOpen || internalMenuIsOpen;

    if (isMenuOpen) {
      if (props?.menuIsOpen) {
        if (activeMenuCloseCallback && activeMenuCloseCallback !== closeCallbackRef.current) {
          activeMenuCloseCallback();
        }

        closeCallbackRef.current = () => {
          if (props?.onMenuClose && typeof props?.onMenuClose === 'function') {
            props.onMenuClose();
          }
        };

        activeMenuCloseCallback = closeCallbackRef.current;

        calculateMenuPosition();
      }

      const handleResize = () => {
        calculateMenuPosition();
      };

      const handleScroll = event => {
        const scrollTarget = event.target;

        if (scrollTarget === document || scrollTarget === document.documentElement || scrollTarget === document.body) {
          if (activeMenuCloseCallback === closeCallbackRef.current) {
            activeMenuCloseCallback();
            activeMenuCloseCallback = null;
          }

          return;
        }

        const menuPortalElement = document.getElementById('select-menu-portal');
        const isSelectContainerScroll = selectContainerRef.current?.contains(scrollTarget);
        const isMenuPortalScroll = menuPortalElement?.contains(scrollTarget);

        if (isSelectContainerScroll || isMenuPortalScroll) {
          return;
        }

        if (activeMenuCloseCallback === closeCallbackRef.current) {
          activeMenuCloseCallback();
          activeMenuCloseCallback = null;
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [props?.menuIsOpen, internalMenuIsOpen, calculateMenuPosition, props]);

  const menuPortalTarget = document.getElementById('select-menu-portal');

  return (
    <div ref={selectContainerRef}>
      <Select
        {...props}
        ref={selectRef}
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
