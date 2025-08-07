// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link, useNavigate, useLocation } from 'react-router';
import { lazy } from 'react';

const BackIcon = lazy(() => import('@/assets/popup-window/back.svg?react'));
const CancelIcon = lazy(() => import('@/assets/popup-window/cancel.svg?react'));

/**
* Function to render the Settings Back component.
* @return {JSX.Element} The rendered component.
*/
function NavigationButton (props) {
  const navigate = useNavigate();
  const location = useLocation();
  const doesAnyHistoryEntryExist = location.key !== 'default';

  return (
    <Link
      className={`${props.type} ${props.className || ''}`}
      to={props.type === 'cancel' ? '/' : '..'}
      onClick={e => {
        if (props.type === 'back') {
          e.preventDefault();

          if (doesAnyHistoryEntryExist) {
            navigate(-1);
          } else {
            navigate('/');
          }
        } else {
          if (props.onClick && typeof props.onClick === 'function') {
            props.onClick(e);
          }
        }
      }}
      title={browser.i18n.getMessage(props.type)}
    >
      {props.type === 'cancel' ? <CancelIcon /> : <BackIcon />}
    </Link>
  );
}

export default NavigationButton;
