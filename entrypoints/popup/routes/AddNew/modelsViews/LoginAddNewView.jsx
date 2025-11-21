// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import * as m from 'motion/react-m';
import { useNavigate, useLocation } from 'react-router';
import getDomainInfo from '../functions/getDomainInfo';
import { useEffect, useState } from 'react';
import { Form, Field } from 'react-final-form';
import onMessage from '../events/onMessage';
import { valueToNFKD, copyValue, getCurrentDevice } from '@/partials/functions';
import { filterXSS } from 'xss';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import usePopupStateStore from '../../../store/popupState';
import Tooltip from '@/entrypoints/popup/components/Tooltip';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import RefreshIcon from '@/assets/popup-window/refresh.svg?react';
import PasswordInput from '@/entrypoints/popup/components/PasswordInput';
import { PULL_REQUEST_TYPES, REQUEST_STRING_ACTIONS } from '@/constants';
import Login from '@/partials/models/itemModels/Login';

const additionalVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '189px' }
};

/**
* AddNew component for creating a new login entry.
* @return {JSX.Element} The rendered component.
*/
function LoginAddNewView() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

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

        const getValueWithPriority = (key, stateValue, storeValue, fallback, shouldSanitize = false) => {
          let selectedValue;

          if (isReturningFromPasswordGenerator || isReturningFromFetch) {
            if (key === 's_password' && stateValue !== undefined) {
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
  }, [location?.state?.data]);

  const handlePasswordVisibleClick = () => {
    setData('passwordVisible', !data?.passwordVisible);
  };

  const handleCopyPassword = async form => {
    try {
      const currentPassword = form.getFieldState('s_password').value;
      await copyValue(currentPassword, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'password');
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCopyUrl = async form => {
    try {
      const currentUrl = form.getFieldState('url').value;
      await copyValue(currentUrl, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'uri');
      showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_uri_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCopyUsername = async form => {
    try {
      const currentUsername = form.getFieldState('username').value;
      await copyValue(currentUsername, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'username');
      showToast(browser.i18n.getMessage('notification_username_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_username_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleGeneratePassword = form => {
    const formState = form.getState();
    const currentValues = formState.values;

    const navigationData = {
      url: currentValues.url || data.url,
      username: currentValues.username || data.username,
      s_password: currentValues.s_password || data.s_password,
      minLength: currentValues['password-minlength'] || data.minLength,
      maxLength: currentValues['password-maxlength'] || data.maxLength,
      pattern: currentValues['password-pattern'] || data.pattern,
      onMobile: currentValues.onMobile !== undefined ? currentValues.onMobile : data.onMobile,
      additionalOverflow: data.additionalOverflow,
      passwordVisible: data.passwordVisible
    };

    Object.entries(navigationData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        setData(key, value);
      }
    });

    navigate('/password-generator', {
      state: {
        from: 'addNew',
        data: navigationData
      }
    });
  };

  const onSubmit = async e => {
    // FUTURE - change to select device
    const device = await getCurrentDevice();

    if (!device) {
      return showToast(browser.i18n.getMessage('error_no_current_device'), 'error');
    }

    const deviceId = device.id;

    const formData = {
      contentType: Login.contentType,
      content: {
        url: e.url ? valueToNFKD(e.url) : '',
        passwordMinLength: e['password-minlength'] ? valueToNFKD(e['password-minlength']) : null,
        passwordMaxLength: e['password-maxlength'] ? valueToNFKD(e['password-maxlength']) : null,
        passwordPattern: e['password-pattern'] ? valueToNFKD(e['password-pattern']) : null
      }
    };

    if (data?.onMobile) {
      formData.content.username = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
      formData.content.s_password = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
    } else {
      formData.content.username = { value: e.username ? valueToNFKD(e.username) : '', action: REQUEST_STRING_ACTIONS.SET };
      formData.content.s_password = { value: e.s_password ? valueToNFKD(e.s_password) : '', action: REQUEST_STRING_ACTIONS.SET };
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
                <label htmlFor="add-new-url">{browser.i18n.getMessage('domain_uri')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type="text"
                  {...input}
                  placeholder={browser.i18n.getMessage('placeholder_domain_uri')}
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
                    title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
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
                      <span>{browser.i18n.getMessage('set_login_and_password_in_the_mobile_app')}</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </Field>
        <m.div
          className={`${S.addNewAdditional} ${data?.additionalOverflow ? S.overflowH : ''}`}
          variants={additionalVariants}
          initial={data?.onMobile ? 'hidden' : 'visible'}
          transition={{ duration: 0.3, type: 'tween' }}
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
                  <label htmlFor="username">{browser.i18n.getMessage('username')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type="text"
                    {...input}
                    id="username"
                    disabled={data?.onMobile ? 'disabled' : ''}
                    placeholder={browser.i18n.getMessage('placeholder_username')}
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
                      title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                      disabled={data?.onMobile ? 'disabled' : ''}
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
                  <label htmlFor="s_password">{browser.i18n.getMessage('password')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <PasswordInput
                    {...input}
                    type={data?.passwordVisible ? 'text' : 'password'}
                    placeholder={browser.i18n.getMessage('placeholder_password')}
                    id="s_password"
                    showPassword={data?.passwordVisible}
                    isDecrypted={true}
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
                      onClick={() => handleGeneratePassword(form)}
                      title={browser.i18n.getMessage('add_new_generate_password')}
                    >
                      <RefreshIcon />
                    </button>
                    <button
                      type="button"
                      onClick={handlePasswordVisibleClick}
                      className={`${pI.iconButton} ${pI.visibleButton}`}
                      title={browser.i18n.getMessage('add_new_toggle_password_visibility')}
                    >
                      <VisibleIcon />
                    </button>
                    <button
                      type='button'
                      className={`${bS.btn} ${pI.iconButton}`}
                      onClick={() => handleCopyPassword(form)}
                      title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>
                <Tooltip className={`${pI.passInputAdditional} tooltip`}>
                  <h4>{browser.i18n.getMessage('add_new_learn_more_tooltip_header')}</h4>
                  <h5>{browser.i18n.getMessage('add_new_learn_more_tooltip_content_1')}</h5>
                  <p>{browser.i18n.getMessage('add_new_learn_more_tooltip_content_2')}</p>
                </Tooltip>
              </div>
            )}
          </Field>
        </m.div>
        <div className={S.addNewButtons}>
          <button
            type="submit"
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            disabled={submitting ? 'disabled' : ''}
          >
            {browser.i18n.getMessage('continue')}
          </button>
        </div>
      </form>
    )}
    />
  );
}

export default LoginAddNewView;