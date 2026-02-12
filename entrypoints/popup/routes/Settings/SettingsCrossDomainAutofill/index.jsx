// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { Form, Field } from 'react-final-form';
import URIMatcher from '@/partials/URIMatcher';
import getDomain from '@/partials/functions/getDomain';
import usePopupState from '../../../store/popupState/usePopupState';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ConfirmDialog from '@/entrypoints/popup/components/ConfirmDialog';
import TrashIcon from '@/assets/popup-window/trash.svg?react';
import AddNewIcon from '@/assets/popup-window/add-new-2.svg?react';
import CancelIcon from '@/assets/popup-window/close.svg?react';

const TABS = {
  TRUSTED: 'trusted',
  UNTRUSTED: 'untrusted'
};

/**
* Function to render the Settings Cross Domain Autofill component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsCrossDomainAutofill (props) {
  const { getMessage } = useI18n();
  const { data, setData, setBatchData } = usePopupState();

  const [loading, setLoading] = useState(true);
  const [trustedDomains, setTrustedDomains] = useState([]);
  const [untrustedDomains, setUntrustedDomains] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.TRUSTED);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState(null);

  const currentDomains = activeTab === TABS.TRUSTED ? trustedDomains : untrustedDomains;
  const otherDomains = activeTab === TABS.TRUSTED ? untrustedDomains : trustedDomains;
  const otherListName = activeTab === TABS.TRUSTED
    ? getMessage('settings_cross_domain_tab_never_autofill')
    : getMessage('settings_cross_domain_tab_always_autofill');

  const isInputInvalid = useMemo(() => {
    const value = data?.inputValue;

    if (!value || value.length === 0) {
      return false;
    }

    if (!URIMatcher.isUrl(value, true)) {
      return true;
    }

    let domain;

    try {
      domain = getDomain(value);
    } catch {
      return true;
    }

    if (currentDomains.includes(domain) || otherDomains.includes(domain)) {
      return true;
    }

    return false;
  }, [data?.inputValue, currentDomains, otherDomains]);

  const removeDomain = useCallback(async domain => {
    if (activeTab === TABS.TRUSTED) {
      const updated = trustedDomains.filter(d => d !== domain);
      setTrustedDomains(updated);
      await storage.setItem('local:crossDomainTrustedDomains', updated);
      showToast(getMessage('settings_cross_domains_remove_toast'), 'success');
    } else {
      const updated = untrustedDomains.filter(d => d !== domain);
      setUntrustedDomains(updated);
      await storage.setItem('local:crossDomainUntrustedDomains', updated);
      showToast(getMessage('settings_cross_domains_untrusted_remove_toast'), 'success');
    }
  }, [activeTab, trustedDomains, untrustedDomains, getMessage]);

  const generateDomainList = useCallback(() => {
    if (currentDomains.length === 0) {
      return null;
    }

    return (
      <div className={S.settingsExcludedDomainsContent}>
        {currentDomains.map((domain, index) => {
          return (
            <div
              key={index}
              className={S.settingsExcludedDomainsItem}
            >
              <p>{domain}</p>
              <button
                title={activeTab === TABS.TRUSTED
                  ? getMessage('settings_cross_domains_remove')
                  : getMessage('settings_cross_domains_untrusted_remove')}
                onClick={() => showConfirmDialog(domain)}
              >
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>
    );
  }, [currentDomains, activeTab, getMessage]);

  const showConfirmDialog = domain => {
    setDomainToRemove(domain);
    setDialogOpen(true);
  };

  const handleDialogCancel = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => { setDomainToRemove(null); }, 201);
  }, []);

  const handleDialogConfirm = useCallback(async () => {
    if (domainToRemove) {
      await removeDomain(domainToRemove);
    }

    setDialogOpen(false);
    setTimeout(() => { setDomainToRemove(null); }, 201);
  }, [domainToRemove, removeDomain]);

  const handleTabChange = useCallback(tab => {
    setActiveTab(tab);
    setBatchData({
      newDomainForm: false,
      inputValue: ''
    });
  }, [setBatchData]);

  const validate = values => {
    const errors = {};

    if (!values['cross-domain']) {
      errors['cross-domain'] = getMessage('settings_cross_domains_add_required');
    } else if (!URIMatcher.isUrl(values['cross-domain'], true)) {
      errors['cross-domain'] = getMessage('settings_cross_domains_add_invalid');
    }

    let domain;

    try {
      domain = getDomain(values['cross-domain']);
    } catch {
      errors['cross-domain'] = getMessage('settings_cross_domains_add_invalid');
    }

    if (!errors['cross-domain']) {
      if (currentDomains.includes(domain)) {
        errors['cross-domain'] = activeTab === TABS.TRUSTED
          ? getMessage('settings_cross_domains_add_already_trusted')
          : getMessage('settings_cross_domains_untrusted_add_already_blocked');
      } else if (otherDomains.includes(domain)) {
        errors['cross-domain'] = getMessage('settings_cross_domains_add_already_in_other_list')
          .replace('OTHER_LIST', otherListName);
      }
    }

    if (errors['cross-domain']) {
      showToast(errors['cross-domain'], 'error');
      return false;
    }

    return true;
  };

  const onSubmit = async (e, form) => {
    if (!validate(e)) {
      return false;
    }

    const domain = getDomain(e['cross-domain']);

    if (activeTab === TABS.TRUSTED) {
      const updated = [...trustedDomains, domain];
      await storage.setItem('local:crossDomainTrustedDomains', updated);
      setTrustedDomains(updated);
      showToast(getMessage('settings_cross_domains_add_success'), 'success');
    } else {
      const updated = [...untrustedDomains, domain];
      await storage.setItem('local:crossDomainUntrustedDomains', updated);
      setUntrustedDomains(updated);
      showToast(getMessage('settings_cross_domains_untrusted_add_success'), 'success');
    }

    setBatchData({
      newDomainForm: false,
      inputValue: ''
    });
    form.reset();
  };

  useEffect(() => {
    const loadDomains = async () => {
      let trusted = await storage.getItem('local:crossDomainTrustedDomains');
      let untrusted = await storage.getItem('local:crossDomainUntrustedDomains');

      if (!trusted) {
        trusted = [];
        await storage.setItem('local:crossDomainTrustedDomains', trusted);
      }

      if (!untrusted) {
        untrusted = [];
        await storage.setItem('local:crossDomainUntrustedDomains', untrusted);
      }

      setTrustedDomains(trusted);
      setUntrustedDomains(untrusted);
      setLoading(false);
    };

    try {
      loadDomains();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const getDialogMessage = useCallback(() => {
    const messageKey = activeTab === TABS.TRUSTED
      ? 'settings_cross_domains_remove_dialog_message'
      : 'settings_cross_domains_untrusted_remove_dialog_message';
    const fallbackKey = activeTab === TABS.TRUSTED
      ? 'settings_cross_domains_remove_dialog_message_replace_fallback'
      : 'settings_cross_domains_untrusted_remove_dialog_message_replace_fallback';

    return getMessage(messageKey).replace('DOMAIN', domainToRemove || getMessage(fallbackKey));
  }, [activeTab, domainToRemove, getMessage]);

  if (loading) {
    return null;
  }

  return (
    <>
      <div className={`${props.className ? props.className : ''}`}>
        <div>
          <section className={S.settings}>
            <NavigationButton type='back' />
            <NavigationButton type='cancel' />

            <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
              <div className={S.settingsSubmenu}>
                <div className={S.settingsSubmenuHeader}>
                  <h3>{getMessage('settings_cross_domain_autofill_domains')}</h3>
                  <p className={S.settingsSubmenuSubtitle}>{getMessage('settings_cross_domain_autofill_domains_subtitle')}</p>
                </div>

                <div className={S.settingsCrossDomainTabs}>
                  <button
                    className={`${S.settingsCrossDomainTab} ${activeTab === TABS.TRUSTED ? S.settingsCrossDomainTabActive : ''}`}
                    onClick={() => handleTabChange(TABS.TRUSTED)}
                    title={getMessage('settings_cross_domains_description')}
                  >
                    {getMessage('settings_cross_domain_tab_always_autofill')}
                  </button>
                  <button
                    className={`${S.settingsCrossDomainTab} ${activeTab === TABS.UNTRUSTED ? S.settingsCrossDomainTabActive : ''}`}
                    onClick={() => handleTabChange(TABS.UNTRUSTED)}
                    title={getMessage('settings_cross_domains_untrusted_description')}
                  >
                    {getMessage('settings_cross_domain_tab_never_autofill')}
                  </button>
                </div>

                <div className={`${S.settingsSubmenuBody} ${S.smallMargin}`}>
                  <div className={S.settingsExcludedDomains}>
                    {generateDomainList()}
                  </div>

                  <div className={`${S.settingsExcludedDomainsAdd} ${data?.newDomainForm ? S.hidden : ''} ${currentDomains.length > 0 ? S.settingsExcludedDomainsAddAnother : ''}`}>
                    <button className={S.settingsExcludedDomainsAddButton} onClick={() => {
                      setData('newDomainForm', true);
                    }}>
                      <AddNewIcon />
                      <span>
                        {currentDomains.length > 0
                          ? (activeTab === TABS.TRUSTED
                            ? getMessage('settings_cross_domains_add_another_domain_text')
                            : getMessage('settings_cross_domains_untrusted_add_another_domain_text'))
                          : (activeTab === TABS.TRUSTED
                            ? getMessage('settings_cross_domains_add_domain_text')
                            : getMessage('settings_cross_domains_untrusted_add_domain_text'))}
                      </span>
                    </button>
                  </div>

                  <div className={`${S.settingsExcludedDomainsNew} ${data?.newDomainForm ? '' : S.hidden}`}>
                    <Form onSubmit={onSubmit} initialValues={{ 'cross-domain': data?.inputValue }} render={({ handleSubmit, submitting, form }) => (
                        <form className={S.settingsExcludedDomainsNewForm} onSubmit={handleSubmit} onChange={() => {
                          const values = form.getState().values;
                          setData('inputValue', values['cross-domain'] || '');
                        }}>
                          <Field name='cross-domain'>
                            {({ input }) => (
                              <div className={`${pI.passInput} ${pI.withoutMargin}`}>
                                <div className={pI.passInputBottom}>
                                  <input
                                    type='text'
                                    {...input}
                                    id='cross-domain'
                                    className={isInputInvalid ? pI.inputTextError : ''}
                                    placeholder={activeTab === TABS.TRUSTED
                                      ? getMessage('settings_cross_domains_add_input_placeholder')
                                      : getMessage('settings_cross_domains_untrusted_add_input_placeholder')}
                                    dir='ltr'
                                    spellCheck='true'
                                    autoCorrect='on'
                                    autoComplete='on'
                                  />
                                  <div className={pI.passInputBottomButtons}>
                                    <button
                                      className={pI.iconButton}
                                      disabled={submitting ? 'disabled' : ''}
                                      type='submit'
                                      title={activeTab === TABS.TRUSTED
                                        ? getMessage('settings_cross_domains_add_submit_title')
                                        : getMessage('settings_cross_domains_untrusted_add_submit_title')}
                                    >
                                      <AddNewIcon className={S.iconNew} />
                                    </button>
                                    <button
                                      className={pI.iconButton}
                                      disabled={submitting ? 'disabled' : ''}
                                      type='button'
                                      title={activeTab === TABS.TRUSTED
                                        ? getMessage('settings_cross_domains_add_cancel_title')
                                        : getMessage('settings_cross_domains_untrusted_add_cancel_title')}
                                      onClick={() => {
                                        setBatchData({
                                          newDomainForm: false,
                                          inputValue: ''
                                        });
                                        form.reset();
                                      }}
                                    >
                                      <CancelIcon className={S.iconCancel} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Field>
                        </form>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        message={getDialogMessage()}
        cancelText={activeTab === TABS.TRUSTED
          ? getMessage('settings_cross_domains_remove_dialog_cancel_text')
          : getMessage('settings_cross_domains_untrusted_remove_dialog_cancel_text')}
        confirmText={activeTab === TABS.TRUSTED
          ? getMessage('settings_cross_domains_remove_dialog_confirm_text')
          : getMessage('settings_cross_domains_untrusted_remove_dialog_confirm_text')}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}

export default SettingsCrossDomainAutofill;
