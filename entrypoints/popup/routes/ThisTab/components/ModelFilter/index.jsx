// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';

/** 
* Function to render the ModelFilter component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ModelFilter = () => {
  return (
    <>
      <div>
        <h3>{browser.i18n.getMessage('this_tab_all_logins_header')}</h3>
      </div>
    </>
  );
};

export default ModelFilter;
