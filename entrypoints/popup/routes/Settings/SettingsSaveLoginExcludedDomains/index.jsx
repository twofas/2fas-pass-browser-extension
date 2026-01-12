// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { useState, useEffect } from 'react';
import { Form, Field } from 'react-final-form';
import URIMatcher from '@/partials/URIMatcher';
import getDomain from '@/partials/functions/getDomain';
import usePopupState from '../../../store/popupState/usePopupState';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ConfirmDialog from '@/entrypoints/popup/components/ConfirmDialog';
import TrashIcon from '@/assets/popup-window/trash.svg?react';
import AddNewIcon from '@/assets/popup-window/add-new-2.svg?react';
import CancelIcon from '@/assets/popup-window/close.svg?react';

/**
* Function to render the Settings Save Login Excluded Domains component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsSaveLoginExcludedDomains (props) {
  const { data, setData, setBatchData } = usePopupState();

  const [loading, setLoading] = useState(true);
  const [excludedDomains, setExcludedDomains] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState(null);

  const removeExcludedDomain = async domain => {
    const updatedDomains = excludedDomains.filter((d) => d !== domain);
    setExcludedDomains(updatedDomains);
    await storage.setItem('local:savePromptIgnoreDomains', updatedDomains);
    showToast(browser.i18n.getMessage('settings_excluded_domains_remove_toast'), 'success');
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
              <div
                key={index}
                className={S.settingsExcludedDomainsItem}
              >
                <p>{domain}</p>
                <button
                  title={browser.i18n.getMessage('settings_excluded_domains_remove')}
                  onClick={() => showConfirmDialog(domain)}
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
      );
    }
  };

  const showConfirmDialog = domain => {
    setDomainToRemove(domain);
    setDialogOpen(true);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setTimeout(() => { setDomainToRemove(null); }, 201);
  };

  const handleDialogConfirm = async () => {
    if (domainToRemove) {
      await removeExcludedDomain(domainToRemove);
    }

    setDialogOpen(false);
    setTimeout(() => { setDomainToRemove(null); }, 201);
  };

  const validate = values => {
    const errors = {};

    if (!values['ignored-domain']) {
      errors['ignored-domain'] = browser.i18n.getMessage('settings_excluded_domains_add_required');
    } else if (!URIMatcher.isUrl(values['ignored-domain'], true)) {
      errors['ignored-domain'] = browser.i18n.getMessage('settings_excluded_domains_add_invalid');
    }

    let domain;

    try {
      domain = getDomain(values['ignored-domain']);
    } catch {
      errors['ignored-domain'] = browser.i18n.getMessage('settings_excluded_domains_add_invalid');
    }

    const excludedDomainsSet = new Set(excludedDomains);
    if (excludedDomainsSet.has(domain)) {
      errors['ignored-domain'] = browser.i18n.getMessage('settings_excluded_domains_add_already_ignored');
    }

    if (errors['ignored-domain']) {
      showToast(errors['ignored-domain'], 'error');
      return false;
    }

    return true;
  };

  const onSubmit = async (e, form) => {
    if (!validate(e)) {
      return false;
    }

    const updatedDomains = [...excludedDomains, getDomain(e['ignored-domain'])];
    await storage.setItem('local:savePromptIgnoreDomains', updatedDomains);
    setExcludedDomains(updatedDomains);
    setBatchData({
      newDomainForm: false,
      inputValue: ''
    });
    form.reset();
    showToast(browser.i18n.getMessage('settings_excluded_domains_add_success'), 'success');
  };

  useEffect(() => {
    const getExcludedDomains = async () => {
      {
        let storageExcludedDomains = await storage.getItem('local:savePromptIgnoreDomains');

        if (!storageExcludedDomains) {
          storageExcludedDomains = [];
          await storage.setItem('local:savePromptIgnoreDomains', storageExcludedDomains);
        }

        setExcludedDomains(storageExcludedDomains);
      }

      setLoading(false);
    };

    try {
      getExcludedDomains();
    } catch (e) {
      CatchError(e);
    }
  }, []);

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
                  <h3>{browser.i18n.getMessage('settings_excluded_domains')}</h3>
                </div>

                <div className={`${S.settingsSubmenuBody} ${S.smallMargin}`}>
                  <div className={S.settingsExcludedDomains}>
                    {generateExcludedDomains()}
                  </div>

                  <div className={`${S.settingsExcludedDomainsAdd} ${data?.newDomainForm ? S.hidden : ''} ${excludedDomains.length > 0 ? S.settingsExcludedDomainsAddAnother : ''}`}>
                    <button className={S.settingsExcludedDomainsAddButton} onClick={() => {
                      setData('newDomainForm', true);
                    }}>
                      <AddNewIcon />
                      <span>{excludedDomains.length > 0 ? browser.i18n.getMessage('settings_excluded_domains_add_another_domain_text') : browser.i18n.getMessage('settings_excluded_domains_add_domain_text')}</span>
                    </button>
                  </div>
                  
                  <div className={`${S.settingsExcludedDomainsNew} ${data?.newDomainForm ? '' : S.hidden}`}>
                    <Form onSubmit={onSubmit} initialValues={{ 'ignored-domain': data?.inputValue }} render={({ handleSubmit, submitting, form }) => ( // form, pristine, values
                        <form className={S.settingsExcludedDomainsNewForm} onSubmit={handleSubmit} onChange={() => {
                          const values = form.getState().values;
                          setData('inputValue', values['ignored-domain'] || '');
                        }}>
                          <Field name='ignored-domain'>
                            {({ input }) => (
                              <div className={`${pI.passInput} ${pI.withoutMargin}`}>
                                <div className={pI.passInputBottom}>
                                  <input
                                    type='text'
                                    {...input}
                                    id='ignored-domain'
                                    placeholder={browser.i18n.getMessage('settings_excluded_domains_add_input_placeholder')}
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
                                      title={browser.i18n.getMessage('settings_excluded_domains_add_submit_title')}
                                    >
                                      <AddNewIcon className={S.iconNew} />
                                    </button>
                                    <button
                                      className={pI.iconButton}
                                      disabled={submitting ? 'disabled' : ''}
                                      type='button'
                                      title={browser.i18n.getMessage('settings_excluded_domains_add_cancel_title')}
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
        message={browser.i18n.getMessage('settings_excluded_domains_remove_dialog_message').replace('DOMAIN', domainToRemove || browser.i18n.getMessage('settings_excluded_domains_remove_dialog_message_replace_fallback'))}
        cancelText={browser.i18n.getMessage('settings_excluded_domains_remove_dialog_cancel_text')}
        confirmText={browser.i18n.getMessage('settings_excluded_domains_remove_dialog_confirm_text')}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}

export default SettingsSaveLoginExcludedDomains;
