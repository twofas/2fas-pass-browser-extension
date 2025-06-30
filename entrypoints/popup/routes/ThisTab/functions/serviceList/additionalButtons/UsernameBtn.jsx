// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import handleUsername from '../handleUsername';
import { lazy } from 'react';

const ServiceUsernameIcon = lazy(() => import('@/assets/popup-window/service-username.svg?react'));

/** 
* Function to render the username button.
* @param {Object} props - The component props.
* @param {number} props.loginId - The ID of the login.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const UsernameBtn = ({ loginId, more, setMore }) => {
  return (
    <button
      onClick={async () => await handleUsername(loginId, more, setMore)}
      title={browser.i18n.getMessage('this_tab_copy_username')}
    >
      <ServiceUsernameIcon className={S.serviceUsername} />
    </button>
  );
};

export default UsernameBtn;
