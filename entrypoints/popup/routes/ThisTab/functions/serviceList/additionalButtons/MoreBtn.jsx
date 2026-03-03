// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../components/Item/styles/Item.module.scss';
import { useRef, useCallback, useMemo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import ItemMoreIcon from '@/assets/popup-window/service-more.svg?react';

const stopPropagation = event => { event.stopPropagation(); };

const MoreBtn = ({ more, setMore, ref }) => {
  const { getMessage } = useI18n();
  const moreRef = useRef(more);
  moreRef.current = more;

  const handleClick = useCallback(event => {
    event.stopPropagation();
    setMore(!moreRef.current);
  }, [setMore]);

  const className = useMemo(() =>
    `${S.itemMoreBtn} ${more ? S.active : ''}`,
    [more]
  );

  return (
    <button
      className={className}
      onClick={handleClick}
      onMouseDown={stopPropagation}
      title={getMessage('this_tab_more_actions')}
      ref={ref}
    >
      <ItemMoreIcon className={S.itemMore} />
    </button>
  );
};

export default MoreBtn;
