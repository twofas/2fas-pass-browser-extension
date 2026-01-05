// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link } from 'react-router';
import { useCallback } from 'react';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';

/**
 * Link component that clears popup state data for the target route before navigation.
 * @param {Object} props - Component props.
 * @param {string} props.to - The target route path.
 * @param {React.ReactNode} props.children - Child elements to render inside the link.
 * @param {Function} props.onClick - Optional click handler to call after clearing data.
 * @return {JSX.Element} The rendered Link component with data clearing functionality.
 */
const ClearLink = ({ to, children, onClick, ...props }) => {
  const clearData = usePopupStateStore(state => state.clearData);

  const handleClick = useCallback(e => {
    clearData(to);

    if (onClick) {
      onClick(e);
    }
  }, [clearData, to, onClick]);

  return (
    <Link to={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
};

export default ClearLink;
