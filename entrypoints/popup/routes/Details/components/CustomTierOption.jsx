// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Details.module.scss';
import { components } from 'react-select';

/**
* Function to render a custom tier option in the select dropdown.
* @param {Object} option - The option data.
* @return {JSX.Element} The rendered option component.
*/
const CustomTierOption = option => {
  return (
    <components.Option {...option}>
      <div className={S.detailsSecurityTierOption}>
        <h3 className='tier-name'>{option.data.label}</h3>
        <p className='tier-description'>{option.data.description}</p>
      </div>
    </components.Option>
  );
};

export default CustomTierOption;
