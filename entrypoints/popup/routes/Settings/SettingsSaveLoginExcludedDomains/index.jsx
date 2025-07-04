// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { useState, useEffect, lazy } from 'react';

const TrashIcon = lazy(() => import('@/assets/popup-window/trash.svg?react'));
const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));

/**
* Function to render the Settings Save Login Excluded Domains component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsSaveLoginExcludedDomains (props) {
  const [loading, setLoading] = useState(true);
  const [excludedDomains, setExcludedDomains] = useState([]);

  useEffect(() => {
    const getExcludedDomains = async () => {
      let storageExcludedDomains = await storage.getItem('local:savePromptIgnoreDomains');

      if (!storageExcludedDomains) {
        storageExcludedDomains = [];
        await storage.setItem('local:savePromptIgnoreDomains', storageExcludedDomains);
      }

      setExcludedDomains(storageExcludedDomains);
      setLoading(false);
    };

    try {
      getExcludedDomains();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const removeExcludedDomain = async (domain) => {
    const updatedDomains = excludedDomains.filter((d) => d !== domain);
    setExcludedDomains(updatedDomains);
    await storage.setItem('local:savePromptIgnoreDomains', updatedDomains);
  };

  const generateExcludedDomains = () => {
    if (excludedDomains.length === 0) {
      return (
        <div className={S.settingsExcludedDomainsEmpty}>
          <p>{browser.i18n.getMessage('settings_excluded_domains_empty')}</p>
        </div>
      );
    } else {
      return (
        <div className={S.settingsExcludedDomainsContent}>
          <h4>{browser.i18n.getMessage('settings_excluded_domains_description')}</h4>

          {excludedDomains.map((domain, index) => {
            return (
              <div key={index} className={S.settingsExcludedDomainsItem}>
                <p>{domain}</p>
                <button title={browser.i18n.getMessage('settings_excluded_domains_remove')} onClick={() => removeExcludedDomain(domain)}>
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
      );
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.settings}>
          <NavigationButton type='back' />
          <NavigationButton type='cancel' />

          <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
            <div className={S.settingsSubmenu}>
              <div className={S.settingsSubmenuHeader}>
                <h3>{browser.i18n.getMessage('settings_excluded_domains')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <div className={S.settingsExcludedDomains}>
                  {generateExcludedDomains()}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsSaveLoginExcludedDomains;
