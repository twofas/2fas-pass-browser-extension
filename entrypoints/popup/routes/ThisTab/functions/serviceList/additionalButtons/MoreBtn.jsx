// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { lazy } from 'react';

const ServiceMoreIcon = lazy(() => import('@/assets/popup-window/service-more.svg?react'));

/** 
* Function to render the more actions button.
* @param {Object} props - The component props.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const MoreBtn = ({ more, setMore }) => {
  return (
    <button
      className={`${S.serviceMoreBtn} ${more ? S.active : ''}`}
      onClick={() => setMore(!more)}
      title={browser.i18n.getMessage('this_tab_more_actions')}
    >
      <ServiceMoreIcon className={S.serviceMore} />
    </button>
  );
};

export default MoreBtn;
