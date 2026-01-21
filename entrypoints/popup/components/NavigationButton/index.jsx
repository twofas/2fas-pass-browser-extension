// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link, useNavigate, useLocation } from 'react-router';
import { useCallback, useMemo, memo } from 'react';
import usePopupStateStore from '../../store/popupState';
import BackIcon from '@/assets/popup-window/back.svg?react';
import CancelIcon from '@/assets/popup-window/cancel.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

const IGNORED_PATHS = ['/password-generator'];

/**
* Function to render the Settings Back component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function NavigationButton({ type, className, state, onClick }) {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const hrefArray = usePopupStateStore(s => s.href);
  const popHref = usePopupStateStore(s => s.popHref);

  const { previousPath, popCount } = useMemo(() => {
    const currentPath = location.pathname;
    let prevPath = null;
    let count = 1;

    for (let i = hrefArray.length - 2; i >= 0; i--) {
      if (hrefArray[i] !== currentPath) {
        if (IGNORED_PATHS.includes(hrefArray[i])) {
          count++;
          continue;
        }

        prevPath = hrefArray[i];
        count = hrefArray.length - 1 - i;
        break;
      }
    }

    return { previousPath: prevPath, popCount: count };
  }, [hrefArray, location.pathname]);

  const handleClick = useCallback(e => {
    if (type === 'back') {
      e.preventDefault();

      for (let i = 0; i < popCount; i++) {
        popHref();
      }

      const navState = { ...state, isBackNavigation: true };

      if (previousPath) {
        navigate(previousPath, { state: navState });
      } else {
        const currentSegments = location.pathname.split('/').filter(segment => segment);

        if (currentSegments.length > 0) {
          currentSegments.pop();
          const parentPath = '/' + currentSegments.join('/') + (currentSegments.length > 0 ? '/' : '');
          navigate(parentPath, { state: navState });
        } else {
          navigate('/', { state: navState });
        }
      }
    } else if (onClick && typeof onClick === 'function') {
      e.preventDefault();
      onClick(e);
    }
  }, [type, popCount, popHref, state, previousPath, navigate, location.pathname, onClick]);

  const linkTo = type === 'cancel' ? '/' : '..';
  const linkClassName = `${type} ${className || ''}`;
  const linkTitle = type ? getMessage(type) : '';

  return (
    <Link
      className={linkClassName}
      to={linkTo}
      state={state}
      onClick={handleClick}
      title={linkTitle}
      prefetch='intent'
    >
      {type === 'cancel' ? <CancelIcon /> : <BackIcon />}
    </Link>
  );
}

export default memo(NavigationButton);
