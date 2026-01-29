// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import usePopupState from '../../../store/popupState/usePopupState';
import getDomainInfo from '../functions/getDomainInfo';
import { useEffect, useState } from 'react';
import { Form, Field } from 'react-final-form';
import onMessage from '../events/onMessage';
import { copyValue, getCurrentDevice } from '@/partials/functions';
import { filterXSS } from 'xss';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import Tooltip from '@/entrypoints/popup/components/Tooltip';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import RefreshIcon from '@/assets/popup-window/refresh.svg?react';
import { PULL_REQUEST_TYPES, REQUEST_STRING_ACTIONS } from '@/constants';
import Login from '@/models/itemModels/Login';
import { useI18n } from '@/partials/context/I18nContext';

const additionalVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '189px' }
};

/**
* AddNew component for creating a new login entry.
* @return {JSX.Element} The rendered component.
*/
function LoginAddNewView() {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, setData } = usePopupState();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const messageListener = async (request, sender, sendResponse) => onMessage(request, sender, sendResponse, value => setData('url', value));
    browser.runtime.onMessage.addListener(messageListener);

    const initializeData = async () => {
      try {
        const stateData = location?.state?.data || {};
        const storeData = data || {};
        const domainData = await getDomainInfo();
        const isReturningFromPasswordGenerator = location?.state?.from === 'passwordGenerator';
        const isReturningFromFetch = location?.state?.from === 'fetch';
        const generatedPassword = location?.state?.generatedPassword;

        const getValueWithPriority = (key, stateValue, storeValue, fallback, shouldSanitize = false) => {
          let selectedValue;

          if (isReturningFromPasswordGenerator || isReturningFromFetch) {
            if (key === 's_password' && generatedPassword !== undefined) {
              selectedValue = generatedPassword;
            } else if (key === 's_password' && stateValue !== undefined) {
              selectedValue = stateValue;
            } else if (stateValue !== undefined) {
              selectedValue = stateValue;
            } else if (storeValue !== undefined && storeValue !== null) {
              selectedValue = storeValue;
            } else {
              selectedValue = fallback;
            }
          } else {
            if (stateValue !== undefined) {
              selectedValue = stateValue;
            } else if (storeValue !== undefined && storeValue !== null) {
              selectedValue = storeValue;
            } else {
              selectedValue = fallback;
            }
          }

          if (selectedValue === undefined) {
            return null;
          }

          return shouldSanitize && typeof selectedValue === 'string' ? filterXSS(selectedValue) : selectedValue;
        };

        const fieldDefinitions = [
          { key: 'url', fallback: domainData.url, sanitize: true },
          { key: 'username', fallback: undefined, sanitize: true },
          { key: 's_password', fallback: undefined, sanitize: true },
          { key: 'minLength', fallback: domainData.minLength, sanitize: true },
          { key: 'maxLength', fallback: domainData.maxLength, sanitize: true },
          { key: 'pattern', fallback: domainData.pattern, sanitize: false },
          { key: 'onMobile', fallback: true, sanitize: false },
          { key: 'additionalOverflow', fallback: true, sanitize: false },
          { key: 'passwordVisible', fallback: undefined, sanitize: false }
        ];

        fieldDefinitions.forEach(({ key, fallback, sanitize }) => {
          const value = getValueWithPriority(key, stateData[key], storeData[key], fallback, sanitize);

          if (value !== null) {
            setData(key, value);
          }
        });

        setLoading(false);
      } catch (e) {
        CatchError(e);
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [location?.state?.data, location?.state?.generatedPassword]);

  const handlePasswordVisibleClick = () => {
    setData('passwordVisible', !data?.passwordVisible);
  };

  const handleCopyPassword = async form => {
    try {
      const currentPassword = form.getFieldState('s_password').value;
      await copyValue(currentPassword, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'password');
      showToast(getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCopyUrl = async form => {
    try {
      const currentUrl = form.getFieldState('url').value;
      await copyValue(currentUrl, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'uri');
      showToast(getMessage('notification_uri_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_uri_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCopyUsername = async form => {
    try {
      const currentUsername = form.getFieldState('username').value;
      await copyValue(currentUsername, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'username');
      showToast(getMessage('notification_username_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_username_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleGeneratePassword = () => {
    navigate('/password-generator', { state: { from: 'addNew' } });
  };

  const onSubmit = async e => {
    // FUTURE - change to select device
    const device = await getCurrentDevice();

    if (!device) {
      return showToast(getMessage('error_no_current_device'), 'error');
    }

    const deviceId = device.id;

    const formData = {
      contentType: Login.contentType,
      content: {
        url: e.url ? e.url : '',
        passwordMinLength: e['password-minlength'] ? e['password-minlength'] : null,
        passwordMaxLength: e['password-maxlength'] ? e['password-maxlength'] : null,
        passwordPattern: e['password-pattern'] ? e['password-pattern'] : null
      }
    };

    if (data?.onMobile) {
      formData.content.username = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
      formData.content.s_password = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
    } else {
      formData.content.username = e.username
        ? { value: e.username, action: REQUEST_STRING_ACTIONS.SET }
        : { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
      formData.content.s_password = e.s_password
        ? { value: e.s_password, action: REQUEST_STRING_ACTIONS.SET }
        : { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
    }

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'add-new',
        data: formData,
        originalData: e,
        model: Login.contentType,
        deviceId
      }
    });
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <h2>{getMessage('add_new_header_login')}</h2>
      <h3>{getMessage('add_new_subheader')}</h3>

      <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, form, submitting }) => (
        <form onSubmit={handleSubmit}>
          <Field name="password-minlength" value={data?.minLength || ''}>
            {({ input }) => <input type="hidden" {...input} id="password-minlength" />}
          </Field>
          <Field name="password-maxlength" value={data?.maxLength || ''}>
            {({ input }) => <input type="hidden" {...input} id="password-maxlength" />}
          </Field>
          <Field name="password-pattern" value={data?.pattern || ''}>
            {({ input }) => <input type="hidden" {...input} id="password-pattern" />}
          </Field>
          <Field name="url">
            {({ input }) => (
              <div className={`${pI.passInput}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor="add-new-url">{getMessage('domain_uri')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type="text"
                    {...input}
                    placeholder={getMessage('placeholder_domain_uri')}
                    id="add-new-url"
                    dir="ltr"
                    spellCheck="false"
                    autoCorrect="off"
                    autoComplete="off"
                    autoCapitalize="off"
                    onChange={e => {
                      input.onChange(e);
                      setData('url', e.target.value);
                    }}
                  />
                  <div className={pI.passInputBottomButtons}>
                    <button
                      type='button'
                      className={`${bS.btn} ${pI.iconButton}`}
                      onClick={() => handleCopyUrl(form)}
                      title={getMessage('this_tab_copy_to_clipboard')}
                      tabIndex={-1}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>
                <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
                  {domainValidation(input.value)}
                </div>
                <div className={pI.passInputAdditional}>
                  <div className={`${bS.passToggle} ${bS.loaded}`}>
                    <input
                      type="checkbox"
                      name="set-in-mobile"
                      id="set-in-mobile"
                      checked={data?.onMobile}
                      onChange={() => {
                        setData('onMobile', !data?.onMobile);
                      }}
                    />
                    <label htmlFor="set-in-mobile">
                      <span className={bS.passToggleBox}>
                        <span className={bS.passToggleBoxCircle}></span>
                      </span>

                      <span className={bS.passToggleText}>
                        <span>{getMessage('set_login_and_password_in_the_mobile_app')}</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </Field>
          <motion.div
            className={`${S.addNewAdditional} ${data?.additionalOverflow ? S.overflowH : ''}`}
            variants={additionalVariants}
            initial={data?.onMobile !== false ? 'hidden' : 'visible'}
            transition={{ duration: 0.2, type: 'tween', ease: 'easeOut' }}
            animate={data?.onMobile ? 'hidden' : 'visible'}
            onAnimationStart={() => { setData('additionalOverflow', true); }}
            onAnimationComplete={() => {
              if (!data?.onMobile) {
                setData('additionalOverflow', false);
              } else {
                setData('additionalOverflow', true);
              }
            }}
          >
            <Field name="username">
              {({ input }) => (
                <div className={`${pI.passInput} ${data?.onMobile ? pI.disabled : ''} ${S.passInput}`}>
                  <div className={pI.passInputTop}>
                    <label htmlFor="username">{getMessage('username')}</label>
                  </div>
                  <div className={pI.passInputBottom}>
                    <input
                      type="text"
                      {...input}
                      id="username"
                      disabled={data?.onMobile ? 'disabled' : ''}
                      placeholder={getMessage('placeholder_username')}
                      onChange={e => {
                        input.onChange(e);
                        setData('username', e.target.value);
                      }}
                    />
                    <div className={pI.passInputBottomButtons}>
                      <button
                        type='button'
                        className={`${bS.btn} ${pI.iconButton}`}
                        onClick={() => handleCopyUsername(form)}
                        title={getMessage('this_tab_copy_to_clipboard')}
                        disabled={data?.onMobile ? 'disabled' : ''}
                        tabIndex={-1}
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Field>
            <Field name="s_password">
              {({ input }) => (
                <div className={`${pI.passInput} ${data?.onMobile ? pI.disabled : ''} ${S.passInput}`}>
                  <div className={pI.passInputTop}>
                    <label htmlFor="s_password">{getMessage('password')}</label>
                  </div>
                  <div className={pI.passInputBottom}>
                    <input
                      {...input}
                      type={data?.passwordVisible ? 'text' : 'password'}
                      placeholder={getMessage('placeholder_password')}
                      id="s_password"
                      disabled={data?.onMobile ? 'disabled' : ''}
                      dir="ltr"
                      spellCheck="false"
                      autoCorrect="off"
                      autoComplete="off"
                      autoCapitalize="off"
                      onChange={e => {
                        input.onChange(e);
                        setData('s_password', e.target.value);
                      }}
                    />
                    <div className={pI.passInputBottomButtons}>
                      <button
                        type='button'
                        className={`${bS.btn} ${pI.iconButton} ${pI.refreshButton}`}
                        onClick={handleGeneratePassword}
                        title={getMessage('details_generate_password')}
                      >
                        <RefreshIcon />
                      </button>
                      <button
                        type="button"
                        onClick={handlePasswordVisibleClick}
                        className={`${pI.iconButton} ${pI.visibleButton}`}
                        title={getMessage('details_toggle_password_visibility')}
                        tabIndex={-1}
                      >
                        <VisibleIcon />
                      </button>
                      <button
                        type='button'
                        className={`${bS.btn} ${pI.iconButton}`}
                        onClick={() => handleCopyPassword(form)}
                        title={getMessage('this_tab_copy_to_clipboard')}
                        tabIndex={-1}
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </div>
                  <Tooltip className={`${pI.passInputAdditional} tooltip`}>
                    <h4>{getMessage('add_new_learn_more_tooltip_header')}</h4>
                    <h5>{getMessage('add_new_learn_more_tooltip_content_1')}</h5>
                    <p>{getMessage('add_new_learn_more_tooltip_content_2')}</p>
                  </Tooltip>
                </div>
              )}
            </Field>
          </motion.div>
          <div className={S.addNewButtons}>
            <button
              type="submit"
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={submitting ? 'disabled' : ''}
            >
              {getMessage('continue')}
            </button>
          </div>
        </form>
      )}
      />
    </>
  );
}

export default LoginAddNewView;