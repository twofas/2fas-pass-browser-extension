// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link, useNavigate, useLocation } from 'react-router';
import usePopupStateStore from '../../store/popupState';
import BackIcon from '@/assets/popup-window/back.svg?react';
import CancelIcon from '@/assets/popup-window/cancel.svg?react';

/**
* Function to render the Settings Back component.
* @return {JSX.Element} The rendered component.
*/
function NavigationButton(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const hrefArray = usePopupStateStore(state => state.href);
  const popHref = usePopupStateStore(state => state.popHref);

  const currentPath = location.pathname;
  let previousPath = null;
  let popCount = 1;

  for (let i = hrefArray.length - 2; i >= 0; i--) {
    if (hrefArray[i] !== currentPath) {
      if (hrefArray[i] === '/' && i === 0) {
        continue;
      }

      previousPath = hrefArray[i];
      popCount = hrefArray.length - 1 - i;
      break;
    }
  }

  return (
    <Link
      className={`${props.type} ${props.className || ''}`}
      to={props?.type === 'cancel' ? '/' : '..'}
      state={props.state}
      onClick={e => {
        if (props?.type === 'back') {
          e.preventDefault();

          for (let i = 0; i < popCount; i++) {
            popHref();
          }

          const navState = { ...props.state, isBackNavigation: true };

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
        } else if (props?.onClick && typeof props?.onClick === 'function') {
          e.preventDefault();
          props.onClick(e);
        }
      }}
      title={props?.type ? browser.i18n.getMessage(props.type) : ''}
      prefetch='intent'
    >
      {props?.type === 'cancel' ? <CancelIcon /> : <BackIcon />}
    </Link>
  );
}

export default NavigationButton;
