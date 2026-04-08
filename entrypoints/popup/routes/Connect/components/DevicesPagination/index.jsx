// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Connect.module.scss';
import { memo, useCallback } from 'react';

/**
* Pagination dots for the ready devices slider.
* @param {Object} props - Component props.
* @param {Array} props.devices - Array of ready devices.
* @param {number} props.currentIndex - Index of the currently selected device.
* @param {Function} props.onPageClick - Callback invoked with the clicked page index.
* @return {JSX.Element|null} Pagination list or null when there is one or zero devices.
*/
function DevicesPagination (props) {
  const { devices, currentIndex, onPageClick } = props;

  const handleClick = useCallback(e => {
    const index = Number(e.currentTarget.dataset.index);
    onPageClick(index);
  }, [onPageClick]);

  if (!devices || devices.length <= 1) {
    return null;
  }

  return (
    <ul
      className={S.deviceSelectContainerListPagination}
      role='tablist'
    >
      {devices.map((_, index) => (
        <li key={index} role='presentation'>
          <button
            className={`splide__pagination__page ${currentIndex === index ? 'is-active' : ''}`}
            type='button'
            role='tab'
            data-index={index}
            onClick={handleClick}
          ></button>
        </li>
      ))}
    </ul>
  );
}

export default memo(DevicesPagination);
