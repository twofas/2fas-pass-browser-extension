// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Tooltip.module.scss';
import LearnMoreIcon from '@/assets/popup-window/learn-more.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

/** 
* Function component for the Tooltip.
* @return {JSX.Element} The rendered component.
*/
function Tooltip (props) {
  const { getMessage } = useI18n();

  return (
    <>
      <div className={`${S.tooltip} ${props.type === 'bottom' ? S.bottom : ''} ${props.className || ''}`}>
        <button type='button'>
          <LearnMoreIcon />
          <span>{getMessage('learn_more')}</span>

          <span className={S.tooltipContent}>
            {props.children}
          </span>
        </button>
      </div>
    </>
  );
}

export default Tooltip;
