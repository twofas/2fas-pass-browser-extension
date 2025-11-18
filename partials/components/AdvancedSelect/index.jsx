// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Select from 'react-select';
import { useRef, useCallback, useEffect, useState } from 'react';

/**
* Function component for an advanced select dropdown that closes when clicking outside and positions menu smartly.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AdvancedSelect (props) {
  const [menuPlacement, setMenuPlacement] = useState('bottom');
  const selectContainerRef = useRef(null);

  const handleClickOutside = useCallback(event => {
    if (
      props &&
      props?.onMenuClose &&
      typeof props?.onMenuClose === 'function' &&
      props?.menuIsOpen &&
      selectContainerRef?.current &&
      !selectContainerRef?.current?.contains(event.target) &&
      !(props?.additionalButtonRefs && Array.isArray(props?.additionalButtonRefs) && props?.additionalButtonRefs.some(ref => ref?.current && ref?.current.contains(event.target)))
    ) {
      props.onMenuClose(false);
    }
  }, [props]);

  const calculateMenuPosition = useCallback(() => {
    const triggerElement = props?.triggerRef?.current;

    if (!triggerElement) {
      return;
    }

    const rect = triggerElement.getBoundingClientRect();
    const menuPortalElement = document.getElementById('select-menu-portal');

    if (!menuPortalElement) {
      return;
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = 200;

    if (spaceBelow < estimatedMenuHeight && spaceAbove > estimatedMenuHeight) {
      setMenuPlacement('top');
    } else {
      setMenuPlacement('bottom');
    }

    menuPortalElement.style.position = 'fixed';
    menuPortalElement.style.left = `${rect.left}px`;
    menuPortalElement.style.top = menuPlacement === 'bottom' ? `${rect.bottom}px` : 'auto';
    menuPortalElement.style.bottom = menuPlacement === 'top' ? `${window.innerHeight - rect.top}px` : 'auto';
    menuPortalElement.style.width = `${rect.width}px`;
    menuPortalElement.style.pointerEvents = 'auto';
  }, [props?.triggerRef, menuPlacement]);

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
        additionalButtonRefs={undefined}
        triggerRef={undefined}
        menuPlacement={menuPlacement}
        menuPortalTarget={menuPortalTarget}
        menuPosition='fixed'
        onMenuOpen={handleMenuOpen}
        onMenuClose={handleMenuClose}
      />
    </div>
  );
}

export default AdvancedSelect;
