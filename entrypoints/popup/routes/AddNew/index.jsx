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
import { useNavigate, Link } from 'react-router';
import getDomainInfo from './functions/getDomainInfo';
import { useEffect, lazy } from 'react';
import { Form, Field } from 'react-final-form';
import onMessage from './events/onMessage';
import valueToNFKD from '@/partials/functions/valueToNFKD';
import { filterXSS } from 'xss';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import copyValue from '../ThisTab/functions/serviceList/copyValue';

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
  
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [minLength, setMinLength] = useState('');
  const [maxLength, setMaxLength] = useState('');
  const [pattern, setPattern] = useState('');
  const [onMobile, setOnMobile] = useState(true);
  const [additionalOverflow, setAdditionalOverflow] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const messageListener = async (request, sender, sendResponse) => await onMessage(request, sender, sendResponse, setUrl);
    browser.runtime.onMessage.addListener(messageListener);

    const getDomainData = async () => {
      const data = await getDomainInfo();

      if (data.url) {
        setUrl(filterXSS(data.url));
      }
      
      if (data.minLength) {
        setMinLength(filterXSS(data.minLength));
      }

      if (data.maxLength) {
        setMaxLength(filterXSS(data.maxLength));
      }

      if (data.pattern) {
        setPattern(data.pattern); // Do not sanitize
      }

      setLoading(false);
    };

    try {
      getDomainData();
    } catch (e) {
      setLoading(false);
      CatchError(e);
    }

    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handlePasswordVisibleClick = () => {
    setPasswordVisible(!passwordVisible);
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

  if (loading) {
    return null;
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div>
          <section className={S.addNew}>
            <div className={S.addNewContainer}>
              <NavigationButton type='cancel' />
          
              <h2>{browser.i18n.getMessage('add_new_header')}</h2>
              <h3>{browser.i18n.getMessage('add_new_subheader')}</h3>

              <Form onSubmit={onSubmit} initialValues={{ minLength, maxLength, pattern, url }} render={({ handleSubmit, form, submitting }) => ( // pristine, values
                  <form onSubmit={handleSubmit}>
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
                          </div>
                          <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
                            {domainValidation(input.value)}
                          </div>
                          <div className={pI.passInputAdditional}>
                            <div className={`${bS.passToggle} ${bS.loaded}`}>
                              <input type="checkbox" name="set-in-mobile" id="set-in-mobile" defaultChecked onChange={() => setOnMobile(!onMobile)} />
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
                      initial="hidden"
                      transition={{ duration: 0.3, type: 'tween' }}
                      animate={!onMobile ? 'visible' : 'hidden'}
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
                                disabled={!setOnMobile ? 'disabled' : ''}
                                placeholder={browser.i18n.getMessage('placeholder_username')}
                              />
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
                                disabled={!setOnMobile ? 'disabled' : ''}
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
                                  state={{ from: 'addNew' }}
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
