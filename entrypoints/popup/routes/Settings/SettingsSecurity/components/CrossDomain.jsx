// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import ClearLink from '@/entrypoints/popup/components/ClearLink';
import MenuArrowIcon from '@/assets/popup-window/menu-arrow.svg?react';

/**
* Function to render the Cross Domain component.
* @return {JSX.Element} The rendered component.
*/
function CrossDomain () {
  const { getMessage } = useI18n();

  return (
    <div className={S.settingsCrossDomain}>
      <h4>{getMessage('settings_cross_domain_header')}</h4>
      <p>{getMessage('settings_cross_domain_description')}</p>

      <ClearLink
        to='/settings/security/cross-domain'
        className={S.settingsCrossDomainLink}
        prefetch='intent'
      >
        <span>{getMessage('settings_cross_domain_trusted_domains')}</span>
        <MenuArrowIcon />
      </ClearLink>
    </div>
  );
}

export default CrossDomain;
