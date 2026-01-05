// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Tooltip.module.scss';
import LearnMoreIcon from '@/assets/popup-window/learn-more.svg?react';

/** 
* Function component for the Tooltip.
* @return {JSX.Element} The rendered component.
*/
function Tooltip (props) {
  return (
    <>
      <div className={`${S.tooltip} ${props.type === 'bottom' ? S.bottom : ''} ${props.className || ''}`}>
        <button type='button'>
          <LearnMoreIcon />
          <span>{browser.i18n.getMessage('learn_more')}</span>

          <span className={S.tooltipContent}>
            {props.children}
          </span>
        </button>
      </div>
    </>
  );
}

export default Tooltip;
