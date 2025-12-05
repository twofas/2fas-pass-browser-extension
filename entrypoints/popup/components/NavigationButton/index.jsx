// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link, useNavigate, useLocation } from 'react-router';
import { getPreviousPath } from '../../utils/navigationHistory';
import BackIcon from '@/assets/popup-window/back.svg?react';
import CancelIcon from '@/assets/popup-window/cancel.svg?react';

/**
* Function to render the Settings Back component.
* @return {JSX.Element} The rendered component.
*/
function NavigationButton(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const previousPath = getPreviousPath();

  return (
    <Link
      className={`${props.type} ${props.className || ''}`}
      to={props?.type === 'cancel' ? '/' : '..'}
      state={props.state}
      onClick={e => {
        if (props?.type === 'back') {
          e.preventDefault();

          try {
            const currentPath = location.pathname;
            const currentSegments = currentPath.split('/').filter(segment => segment);

            if (window.history.length > 1 && location.key !== 'default') {
              if (previousPath && previousPath !== currentPath) {
                const previousSegments = previousPath.split('/').filter(segment => segment);

                if (previousSegments[0] === 'details' || previousSegments[0] === 'add-new') {
                  navigate(previousPath, { state: props.state });
                  return;
                }

                if (previousSegments.length > currentSegments.length) {
                  if (currentSegments.length > 0) {
                    currentSegments.pop();
                    const parentPath = '/' + currentSegments.join('/') + (currentSegments.length > 0 ? '/' : '');
                    navigate(parentPath, { state: props.state });
                  } else {
                    navigate('/', { state: props.state });
                  }

                  return;
                }
              }

              navigate(-1, { state: props.state });
            } else {
              if (currentSegments.length > 0) {
                currentSegments.pop();
                const parentPath = '/' + currentSegments.join('/') + (currentSegments.length > 0 ? '/' : '');
                navigate(parentPath, { state: props.state });
              } else {
                navigate('/', { state: props.state });
              }
            }
          } catch {
            navigate('/', { state: props.state });
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
