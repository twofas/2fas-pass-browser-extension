// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { memo, useCallback } from 'react';

/**
* Custom option component for sort dropdown with radio-style selection indicator.
* @param {Object} props - React-select option props including data, selectOption, and isSelected.
* @return {JSX.Element} The rendered option element.
*/
function SortCustomOption (props) {
  const { data, selectOption, isSelected } = props;

  const handleClick = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    selectOption(data);
  }, [selectOption, data]);

  if (data.isDisabled) {
    return (
      <div className='react-select-tags__option react-select-tags__option_disabled'>
        <span
          className={data.value === null ? 'react-select-tags__option_clear' : ''}
          title={data.label}
        >
          {data.label}
        </span>
      </div>
    );
  }

  return (
    <div className='react-select-tags__option' onClick={handleClick}>
      <span
        className={data.value === null ? 'react-select-tags__option_clear' : ''}
        title={data.label}
      >
        {data.label}
      </span>
      {data.value === null ? null : (
        <span className={`react-select-tags__option-circle ${isSelected ? 'selected' : ''}`}>
          <span></span>
        </span>
      )}
    </div>
  );
}

export default memo(SortCustomOption);
