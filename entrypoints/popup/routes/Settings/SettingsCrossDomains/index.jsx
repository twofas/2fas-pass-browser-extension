// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { useState, useEffect, useMemo } from 'react';
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

/**
* Function to render the Settings Cross Domains component.
* Manages trusted domains for cross-domain autofill prompts.
* For these domains, cross-domain confirmation prompts will be skipped.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsCrossDomains (props) {
  const { getMessage } = useI18n();
  const { data, setData, setBatchData } = usePopupState();

  const [loading, setLoading] = useState(true);
  const [trustedDomains, setTrustedDomains] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState(null);

  const isTrustedDomainInvalid = useMemo(() => {
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

    if (trustedDomains.includes(domain)) {
      return true;
    }

    return false;
  }, [data?.inputValue, trustedDomains]);

  const removeTrustedDomain = async domain => {
    const updatedDomains = trustedDomains.filter((d) => d !== domain);
    setTrustedDomains(updatedDomains);
    await storage.setItem('local:crossDomainTrustedDomains', updatedDomains);
    showToast(getMessage('settings_cross_domains_remove_toast'), 'success');
  };

  const generateTrustedDomains = () => {
    if (trustedDomains.length === 0) {
      return (
        <div className={S.settingsExcludedDomainsEmpty}>
          <p>{getMessage('settings_cross_domains_empty')}</p>
        </div>
      );
    } else {
      return (
        <div className={S.settingsExcludedDomainsContent}>
          <h4>{getMessage('settings_cross_domains_description')}</h4>

          {trustedDomains.map((domain, index) => {
            return (
              <div
                key={index}
                className={S.settingsExcludedDomainsItem}
              >
                <p>{domain}</p>
                <button
                  title={getMessage('settings_cross_domains_remove')}
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
      await removeTrustedDomain(domainToRemove);
    }

    setDialogOpen(false);
    setTimeout(() => { setDomainToRemove(null); }, 201);
  };

  const validate = values => {
    const errors = {};

    if (!values['trusted-domain']) {
      errors['trusted-domain'] = getMessage('settings_cross_domains_add_required');
    } else if (!URIMatcher.isUrl(values['trusted-domain'], true)) {
      errors['trusted-domain'] = getMessage('settings_cross_domains_add_invalid');
    }

    let domain;

    try {
      domain = getDomain(values['trusted-domain']);
    } catch {
      errors['trusted-domain'] = getMessage('settings_cross_domains_add_invalid');
    }

    const trustedDomainsSet = new Set(trustedDomains);
    if (trustedDomainsSet.has(domain)) {
      errors['trusted-domain'] = getMessage('settings_cross_domains_add_already_trusted');
    }

    if (errors['trusted-domain']) {
      showToast(errors['trusted-domain'], 'error');
      return false;
    }

    return true;
  };

  const onSubmit = async (e, form) => {
    if (!validate(e)) {
      return false;
    }

    const updatedDomains = [...trustedDomains, getDomain(e['trusted-domain'])];
    await storage.setItem('local:crossDomainTrustedDomains', updatedDomains);
    setTrustedDomains(updatedDomains);
    setBatchData({
      newDomainForm: false,
      inputValue: ''
    });
    form.reset();
    showToast(getMessage('settings_cross_domains_add_success'), 'success');
  };

  useEffect(() => {
    const getTrustedDomains = async () => {
      {
        let storageTrustedDomains = await storage.getItem('local:crossDomainTrustedDomains');

        if (!storageTrustedDomains) {
          storageTrustedDomains = [];
          await storage.setItem('local:crossDomainTrustedDomains', storageTrustedDomains);
        }

        setTrustedDomains(storageTrustedDomains);
      }

      setLoading(false);
    };

    try {
      getTrustedDomains();
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
                  <h3>{getMessage('settings_cross_domain_trusted_domains')}</h3>
                </div>

                <div className={`${S.settingsSubmenuBody} ${S.smallMargin}`}>
                  <div className={S.settingsExcludedDomains}>
                    {generateTrustedDomains()}
                  </div>

                  <div className={`${S.settingsExcludedDomainsAdd} ${data?.newDomainForm ? S.hidden : ''} ${trustedDomains.length > 0 ? S.settingsExcludedDomainsAddAnother : ''}`}>
                    <button className={S.settingsExcludedDomainsAddButton} onClick={() => {
                      setData('newDomainForm', true);
                    }}>
                      <AddNewIcon />
                      <span>{trustedDomains.length > 0 ? getMessage('settings_cross_domains_add_another_domain_text') : getMessage('settings_cross_domains_add_domain_text')}</span>
                    </button>
                  </div>

                  <div className={`${S.settingsExcludedDomainsNew} ${data?.newDomainForm ? '' : S.hidden}`}>
                    <Form onSubmit={onSubmit} initialValues={{ 'trusted-domain': data?.inputValue }} render={({ handleSubmit, submitting, form }) => (
                        <form className={S.settingsExcludedDomainsNewForm} onSubmit={handleSubmit} onChange={() => {
                          const values = form.getState().values;
                          setData('inputValue', values['trusted-domain'] || '');
                        }}>
                          <Field name='trusted-domain'>
                            {({ input }) => (
                              <div className={`${pI.passInput} ${pI.withoutMargin}`}>
                                <div className={pI.passInputBottom}>
                                  <input
                                    type='text'
                                    {...input}
                                    id='trusted-domain'
                                    className={isTrustedDomainInvalid ? pI.inputTextError : ''}
                                    placeholder={getMessage('settings_cross_domains_add_input_placeholder')}
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
                                      title={getMessage('settings_cross_domains_add_submit_title')}
                                    >
                                      <AddNewIcon className={S.iconNew} />
                                    </button>
                                    <button
                                      className={pI.iconButton}
                                      disabled={submitting ? 'disabled' : ''}
                                      type='button'
                                      title={getMessage('settings_cross_domains_add_cancel_title')}
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
        message={getMessage('settings_cross_domains_remove_dialog_message').replace('DOMAIN', domainToRemove || getMessage('settings_cross_domains_remove_dialog_message_replace_fallback'))}
        cancelText={getMessage('settings_cross_domains_remove_dialog_cancel_text')}
        confirmText={getMessage('settings_cross_domains_remove_dialog_confirm_text')}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
}

export default SettingsCrossDomains;
