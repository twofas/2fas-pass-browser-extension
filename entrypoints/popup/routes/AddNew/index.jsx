// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useNavigate, Link, useLocation } from 'react-router';
import getDomainInfo from './functions/getDomainInfo';
import { useEffect, lazy, useState } from 'react';
import { Form, Field } from 'react-final-form';
import onMessage from './events/onMessage';
import valueToNFKD from '@/partials/functions/valueToNFKD';
import { filterXSS } from 'xss';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import copyValue from '@/partials/functions/copyValue';
import { usePopupState } from '@/hooks/usePopupState';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));
const Tooltip = lazy(() => import('@/entrypoints/popup/components/Tooltip'));
const VisibleIcon = lazy(() => import('@/assets/popup-window/visible.svg?react'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const RefreshIcon = lazy(() => import('@/assets/popup-window/refresh.svg?react'));
const PasswordInput = lazy(() => import('@/entrypoints/popup/components/PasswordInput'));

const additionalVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '189px' }
};

/** 
* AddNew component for creating a new login entry.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered component.
*/
function AddNew (props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setScrollElementRef, scrollElementRef, popupStateData, setHref, shouldRestoreScroll, setData, popupState } = usePopupState();

  const [loading, setLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [waitingForPopupState, setWaitingForPopupState] = useState(true);
  const [passwordGeneratorProcessed, setPasswordGeneratorProcessed] = useState(false);

  const [url, setUrl] = useState('');
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [pattern, setPattern] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [onMobile, setOnMobile] = useState(true);
  const [additionalOverflow, setAdditionalOverflow] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);


  const updateData = updates => {
    setData(prevData => ({
      ...prevData,
      ...updates
    }));
  };

  useEffect(() => {
    setHref(location.pathname);
  }, [location.pathname, setHref]);

  useEffect(() => {
    if (location?.state?.data && Object.keys(location.state.data).length > 0) {
      setWaitingForPopupState(false);
      return;
    }

    if (popupState !== undefined) {
      setWaitingForPopupState(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setWaitingForPopupState(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [popupState, location?.state?.data]);

  useEffect(() => {
    if (!dataInitialized && !waitingForPopupState) {
      let sourceData = null;

      if (location?.state?.data && Object.keys(location.state.data).length > 0) {
        sourceData = location.state.data;
      } else if (popupState?.data && Object.keys(popupState.data).length > 0) {
        sourceData = popupState.data;
      }

      if (sourceData) {

        if (sourceData.url !== undefined) {
          const value = typeof sourceData.url === 'string' ? filterXSS(sourceData.url) : sourceData.url;
          setUrl(value);
        }

        if (sourceData.minLength !== undefined) {
          const value = typeof sourceData.minLength === 'string' ? filterXSS(sourceData.minLength) : sourceData.minLength;
          setMinLength(value);
        }

        if (sourceData.maxLength !== undefined) {
          const value = typeof sourceData.maxLength === 'string' ? filterXSS(sourceData.maxLength) : sourceData.maxLength;
          setMaxLength(value);
        }

        if (sourceData.pattern !== undefined) {
          setPattern(sourceData.pattern);
        }

        if (sourceData.password !== undefined) {
          const value = typeof sourceData.password === 'string' ? filterXSS(sourceData.password) : sourceData.password;
          setPassword(value);
        }

        if (sourceData.username !== undefined) {
          const value = typeof sourceData.username === 'string' ? filterXSS(sourceData.username) : sourceData.username;
          setUsername(value);
        }

        if (sourceData.onMobile !== undefined) {
          setOnMobile(sourceData.onMobile);
        }

        if (sourceData.passwordVisible !== undefined) {
          setPasswordVisible(sourceData.passwordVisible);
        }

        if (sourceData.additionalOverflow !== undefined) {
          setAdditionalOverflow(sourceData.additionalOverflow);
        }

        updateData(sourceData);
      }

      setDataInitialized(true);
    }
  }, [dataInitialized, waitingForPopupState, location?.state?.data, popupState, updateData]);

  useEffect(() => {
    if (!passwordGeneratorProcessed && location?.state?.from === 'passwordGenerator' && location?.state?.data) {
      const data = location.state.data;
      const updates = {};

      if (data.password !== undefined) {
        setPassword(data.password);
        updates.password = data.password;
      }

      if (data.username !== undefined) {
        setUsername(data.username);
        updates.username = data.username;
      }

      if (data.onMobile !== undefined) {
        setOnMobile(data.onMobile);
        updates.onMobile = data.onMobile;
      }

      if (data.additionalOverflow !== undefined) {
        setAdditionalOverflow(data.additionalOverflow);
        updates.additionalOverflow = data.additionalOverflow;
      }

      if (Object.keys(updates).length > 0) {
        updateData(updates);
      }

      setPasswordGeneratorProcessed(true);
    }
  }, [location?.state, updateData, passwordGeneratorProcessed]);

  useEffect(() => {
    const messageListener = async (request, sender, sendResponse) => onMessage(request, sender, sendResponse, setUrl, updateData);
    browser.runtime.onMessage.addListener(messageListener);

    const getDomainData = async () => {
      const data = await getDomainInfo();
      const updates = {};

      if (data.url) {
        const sanitizedUrl = filterXSS(data.url);
        setUrl(sanitizedUrl);
        updates.url = sanitizedUrl;
      }

      if (data.minLength) {
        const sanitizedMinLength = filterXSS(data.minLength);
        setMinLength(sanitizedMinLength);
        updates.minLength = sanitizedMinLength;
      }

      if (data.maxLength) {
        const sanitizedMaxLength = filterXSS(data.maxLength);
        setMaxLength(sanitizedMaxLength);
        updates.maxLength = sanitizedMaxLength;
      }

      if (data.pattern) {
        setPattern(data.pattern); // Do not sanitize
        updates.pattern = data.pattern;
      }

      if (Object.keys(updates).length > 0) {
        updateData(updates);
      }
    };

    const initializeData = async () => {
      try {
        if (dataInitialized) {
          const hasLocationData = location?.state?.data && Object.keys(location.state.data).length > 0;
          const hasPopupStateData = popupState?.data && Object.keys(popupState.data).length > 0;

          if (!hasLocationData && !hasPopupStateData) {
            await getDomainData();
          }

          setLoading(false);
        }
      } catch (e) {
        CatchError(e);
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [updateData, popupState?.data, location?.state?.data, dataInitialized]);

  useEffect(() => {
    if (!loading && shouldRestoreScroll && popupStateData?.scrollPosition && popupStateData.scrollPosition !== 0 && scrollElementRef.current) {
      scrollElementRef.current.scrollTo(0, popupStateData.scrollPosition);
    }
  }, [loading, shouldRestoreScroll, popupStateData, scrollElementRef]);

  const handlePasswordVisibleClick = () => {
    const newValue = !passwordVisible;
    setPasswordVisible(newValue);
    updateData({ passwordVisible: newValue });
  };

  const handleCopyPassword = async form => {
    try {
      const currentPassword = form.getFieldState('password').value;
      await copyValue(currentPassword, '00000000-0000-0000-0000-000000000000', 'password');
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCopyUrl = async form => {
    try {
      const currentUrl = form.getFieldState('url').value;
      await copyValue(currentUrl, '00000000-0000-0000-0000-000000000000', 'uri');
      showToast(browser.i18n.getMessage('notification_uri_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_uri_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCopyUsername = async form => {
    try {
      const currentUsername = form.getFieldState('username').value;
      await copyValue(currentUsername, '00000000-0000-0000-0000-000000000000', 'username');
      showToast(browser.i18n.getMessage('notification_username_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_username_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const onSubmit = async e => {
    const data = {
      url: e.url ? valueToNFKD(e.url) : '',
      passwordMinLength: e['password-minlength'] ? valueToNFKD(e['password-minlength']) : null,
      passwordMaxLength: e['password-maxlength'] ? valueToNFKD(e['password-maxlength']) : null,
      passwordPattern: e['password-pattern'] ? valueToNFKD(e['password-pattern']) : null
    };

    if (onMobile) {
      data.usernamePasswordMobile = true;
    } else {
      data.usernamePasswordMobile = false;
      data.username = e.username ? valueToNFKD(e.username) : '';
      data.password = e.password ? valueToNFKD(e.password) : '';
    }

    return navigate('/fetch', {
      state: {
        action: 'newLogin',
        from: 'add-new',
        data
      }
    });
  };

  if (loading || !dataInitialized || waitingForPopupState) {
    return null;
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div ref={el => { setScrollElementRef(el); }}>
          <section className={S.addNew}>
            <div className={S.addNewContainer}>
              <NavigationButton type='cancel' />
          
              <h2>{browser.i18n.getMessage('add_new_header')}</h2>
              <h3>{browser.i18n.getMessage('add_new_subheader')}</h3>

              <Form onSubmit={onSubmit} initialValues={{ minLength, maxLength, pattern, url, username, password }} render={({ handleSubmit, form, submitting }) => ( // pristine, values
                  <form onSubmit={handleSubmit} onChange={() => {
                    const values = form.getState().values;
                    updateData({
                      url: values.url || '',
                      username: values.username || '',
                      password: values.password || '',
                      minLength: values['password-minlength'] || '',
                      maxLength: values['password-maxlength'] || '',
                      pattern: values['password-pattern'] || ''
                    });
                  }}>
                    <Field name="password-minlength" value={minLength}>
                      {({ input }) => <input type="hidden" {...input} id="password-minlength" />}
                    </Field>
                    <Field name="password-maxlength" value={maxLength}>
                      {({ input }) => <input type="hidden" {...input} id="password-maxlength" />}
                    </Field>
                    <Field name="password-pattern" value={pattern}>
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
                                checked={onMobile}
                                onChange={() => {
                                const newValue = !onMobile;
                                setOnMobile(newValue);
                                updateData({ onMobile: newValue });
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
                      className={`${S.addNewAdditional} ${additionalOverflow ? S.overflowH : ''}`}
                      variants={additionalVariants}
                      initial={onMobile ? 'hidden' : 'visible'}
                      transition={{ duration: 0.3, type: 'tween' }}
                      animate={onMobile ? 'hidden' : 'visible'}
                      onAnimationStart={() => { setAdditionalOverflow(true); }}
                      onAnimationComplete={() => {
                        if (!onMobile) {
                          setAdditionalOverflow(false);
                        } else {
                          setAdditionalOverflow(true);
                        }
                      }}
                    >
                      <Field name="username">
                        {({ input }) => (
                          <div className={`${pI.passInput} ${onMobile ? pI.disabled : ''} ${S.passInput}`}>
                            <div className={pI.passInputTop}>
                              <label htmlFor="username">{browser.i18n.getMessage('username')}</label>
                            </div>
                            <div className={pI.passInputBottom}>
                              <input
                                type="text"
                                {...input}
                                id="username"
                                disabled={onMobile ? 'disabled' : ''}
                                placeholder={browser.i18n.getMessage('placeholder_username')}
                              />
                              <div className={pI.passInputBottomButtons}>
                                <button
                                  type='button'
                                  className={`${bS.btn} ${pI.iconButton}`}
                                  onClick={() => handleCopyUsername(form)}
                                  title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                                  disabled={onMobile ? 'disabled' : ''}
                                >
                                  <CopyIcon />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Field>
                      <Field name="password">
                        {({ input }) => (
                          <div className={`${pI.passInput} ${onMobile ? pI.disabled : ''} ${S.passInput}`}>
                            <div className={pI.passInputTop}>
                              <label htmlFor="password">{browser.i18n.getMessage('password')}</label>
                            </div>
                            <div className={pI.passInputBottom}>
                              <PasswordInput
                                {...input}
                                type={passwordVisible ? 'text' : 'password'}
                                placeholder={browser.i18n.getMessage('placeholder_password')}
                                id="password"
                                showPassword={passwordVisible}
                                isDecrypted={true}
                                disabled={onMobile ? 'disabled' : ''}
                                dir="ltr"
                                spellCheck="false"
                                autoCorrect="off"
                                autoComplete="off"
                                autoCapitalize="off"
                              />
                              <div className={pI.passInputBottomButtons}>
                                <Link
                                  to='/password-generator'
                                  className={`${bS.btn} ${pI.iconButton} ${pI.refreshButton}`}
                                  title={browser.i18n.getMessage('add_new_generate_password')}
                                  state={{ from: 'addNew', data: { ...form.getState().values, onMobile, additionalOverflow } }}
                                  prefetch='intent'
                                >
                                  <RefreshIcon />
                                </Link>
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
            </div>
          </section>
        </div>
      </div>
    </LazyMotion>
  );
}

export default AddNew;
