// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { memo } from 'react';
import { components } from 'react-select';

const handleNoOp = () => {};

/**
* Custom option component for the ModelFilter dropdown.
* @param {Object} option - The react-select option props.
* @return {JSX.Element} The rendered option component.
*/
const ModelFilterCustomOption = memo(function ModelFilterCustomOption (option) {
  const isSelected = option.isSelected || (!option?.selectProps?.itemModelFilter && option.data.value === null);
  const optionClassName = `react-select-model-filter__option ${isSelected ? 'react-select-model-filter__option--is-selected' : ''}`;

  return (
    <components.Option
      {...option}
      className={optionClassName}
      title={option.data.label}
      onClick={handleNoOp}
    >
      <span className={`react-select-model-filter__option-icon ${option.data.className}`}>{option.data.icon}</span>
      <span className='react-select-model-filter__option-label'>{option.data.label}</span>
    </components.Option>
  );
});

export default ModelFilterCustomOption;
