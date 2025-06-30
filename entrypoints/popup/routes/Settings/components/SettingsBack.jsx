// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Link, useNavigate } from 'react-router';
import { lazy } from 'react';

const BackIcon = lazy(() => import('@/assets/popup-window/back.svg?react'));

/**
* Function to render the Settings Back component.
* @return {JSX.Element} The rendered component.
*/
function SettingsBack () {
  const navigate = useNavigate();

  return (
    <Link className='back' to='..'onClick={e => { e.preventDefault(); navigate(-1); }}>
      <BackIcon />
    </Link>
  );
}

export default SettingsBack;
