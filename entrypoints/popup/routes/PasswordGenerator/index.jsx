// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PasswordGenerator.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Form, Field } from 'react-final-form';
import copyValue from '@/partials/functions/copyValue';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import PasswordInput from '@/entrypoints/popup/components/PasswordInput';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import RefreshIcon from '@/assets/popup-window/refresh.svg?react';
import usePopupStateStore from '../../store/popupState';
import useScrollPosition from '../../hooks/useScrollPosition';

function PasswordGenerator (props) {
  const location = useLocation();
  const navigate = useNavigate();

  const data = usePopupStateStore(state => state.data);
  const popupHref = usePopupStateStore(state => state.href);
  const setData = usePopupStateStore(state => state.setData);

  const scrollableRef = useRef(null);
  const initialPasswordRef = useRef(null);

  useScrollPosition(scrollableRef);

  const generatePassword = (length, useUppercase, useNumbers, useSpecialChars) => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';

    if (useUppercase !== undefined ? useUppercase : true) {
      charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    if (useNumbers !== undefined ? useNumbers : true) {
      charset += '0123456789';
    }

    if (useSpecialChars !== undefined ? useSpecialChars : true) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    let password = '';
    length = length !== undefined ? length : 16;

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }

    return password;
  };

  const regeneratePassword = (form, chars, uppercase, numbers, special) => {
    const length = chars !== undefined ? chars : data.characters;
    const useUppercase = uppercase !== undefined ? uppercase : data.includeUppercase;
    const useNumbers = numbers !== undefined ? numbers : data.includeNumbers;
    const useSpecial = special !== undefined ? special : data.includeSpecialChars;
    let newPassword = generatePassword(length, useUppercase, useNumbers, useSpecial);

    initialPasswordRef.current = newPassword;
    setData('password', newPassword);
    form.change('password', newPassword);

    newPassword = null;
  };

  if (!initialPasswordRef.current && !data.password) {
    initialPasswordRef.current = generatePassword(
      data.characters,
      data.includeUppercase,
      data.includeNumbers,
      data.includeSpecialChars
    );
  }

  useEffect(() => {
    setData('navigationContext', location.state);
  }, [location.state, setData, popupHref]);

  useEffect(() => {
    if (initialPasswordRef.current && !data.password) {
      setData('password', initialPasswordRef.current);
    }
  }, [data.password, setData, popupHref]);

  const initialValues = {
    characters: data.characters,
    includeUppercase: data.includeUppercase,
    includeNumbers: data.includeNumbers,
    includeSpecialChars: data.includeSpecialChars,
    password: data.password || initialPasswordRef.current
  };

  const onSubmit = async values => {
    const currentState = location?.state;
    const storedContext = data?.navigationContext;

    const navigationContext = currentState || storedContext;

    if (!navigationContext || !navigationContext.from || !navigationContext.data) {
      showToast(browser.i18n.getMessage('password_generator_data_error'));
      return;
    }

    if (navigationContext.from === 'addNew') {
      return navigate(`/add-new/Login`, {
        state: {
          from: 'passwordGenerator',
          data: { ...navigationContext.data, password: values.password }
        }
      });
    } else if (navigationContext.from === 'details' && navigationContext.data?.item?.id) {
      return navigate(`/details/${navigationContext.data.item.deviceId}/${navigationContext.data.item.vaultId}/${navigationContext.data.item.id}`, {
        state: {
          from: 'passwordGenerator',
          data: { ...navigationContext.data, item: { ...navigationContext.data.item, content: { ...navigationContext.data.item.content, s_password: values.password } } }
        }
      });
    } else {
      showToast(browser.i18n.getMessage('password_generator_data_error'));
      return;
    }
  };

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.passwordGenerator}>
          <div className={S.passwordGeneratorContainer}>
            <NavigationButton type='back' />
            <h2>{browser.i18n.getMessage('password_generator_title')}</h2>

            <Form
              onSubmit={onSubmit}
              initialValues={initialValues}
              render={({ handleSubmit, form }) => {
                return (
                  <form onSubmit={handleSubmit} className={S.passwordGeneratorForm}>
                    <Field name='password'>
                      {({ input }) => (
                        <div className={`${pI.passInput} ${pI.disabled} ${pI.withoutMargin}`}>
                          <div className={pI.passInputTop}>
                            <label htmlFor="password">{browser.i18n.getMessage('password')}</label>
                          </div>
                          <div className={pI.passInputBottom}>
                            <PasswordInput
                              {...input}
                              showPassword={true}
                              isDecrypted={true}
                              disabled={true}
                              disabledColors={true}
                            />
                            <div className={pI.passInputBottomButtons}>
                              <button
                                type='button'
                                onClick={() => regeneratePassword(form)}
                                className={bS.btnIcon}
                                title={browser.i18n.getMessage('password_generator_regenerate')}
                              >
                                <RefreshIcon />
                              </button>
                              <button
                                type='button'
                                onClick={async () => {
                                  try {
                                    await copyValue(input.value, '00000000-0000-0000-0000-000000000000', 'password');
                                    showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
                                  } catch (e) {
                                    await CatchError(e);
                                    showToast(browser.i18n.getMessage('error_copy_password'));
                                  }
                                }}
                                className={bS.btnIcon}
                                title={browser.i18n.getMessage('copy_to_clipboard')}
                              >
                                <CopyIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Field>

                    <div className={S.passwordGeneratorFormCharacters}>
                      <Field name='characters'>
                        {({ input }) => {
                          const percentage = ((input.value - 6) / (64 - 6)) * 100;
                          const isDarkMode = document.documentElement.classList.contains('theme-dark') || 
                            (document.documentElement.classList.contains('theme-unset') && 
                             window.matchMedia('(prefers-color-scheme: dark)').matches);
                          
                          const trackColor = isDarkMode ? '#282a33' : '#ececec';
                          const fillColor = isDarkMode ? '#869dfe' : '#214ce8';
                          
                          const trackBackground = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`;
                          
                          return (
                            <>
                              <h3>{browser.i18n.getMessage('password_generator_characters').replace('COUNT', input.value)}</h3>
                              <style>
                                {`
                                  .${S.passwordGeneratorFormCharacters} input[type="range"]::-webkit-slider-runnable-track {
                                    background: ${trackBackground};
                                  }
                                  .${S.passwordGeneratorFormCharacters} input[type="range"]::-moz-range-track {
                                    background: ${trackBackground};
                                  }
                                `}
                              </style>
                              <input
                                {...input}
                                type='range'
                                min='6'
                                max='64'
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value);
                                  input.onChange(e);
                                  setData('characters', newValue);
                                  regeneratePassword(form, newValue, undefined, undefined, undefined);
                                }}
                              />
                            </>
                          );
                        }}
                      </Field>
                    </div>

                    <div className={S.passwordGeneratorFormInclude}>
                      <h3>{browser.i18n.getMessage('password_generator_include')}</h3>
                      
                      <div className={S.passwordGeneratorFormIncludeGrid}>
                        <div className={bS.passToggle}>
                          <Field name='includeUppercase' type='checkbox'>
                            {({ input }) => (
                              <>
                                <input
                                  {...input}
                                  id='include-uppercase'
                                  onChange={(e) => {
                                    const newValue = e.target.checked;
                                    input.onChange(e);
                                    setData('includeUppercase', newValue);
                                    regeneratePassword(form, undefined, newValue, undefined, undefined);
                                  }}
                                />
                                <label htmlFor='include-uppercase'>
                                  <span className={bS.passToggleBox}>
                                    <span className={bS.passToggleBoxCircle} />
                                  </span>
                                  <span className={bS.passToggleText}>
                                    <span>{browser.i18n.getMessage('password_generator_uppercase')}</span>
                                  </span>
                                </label>
                              </>
                            )}
                          </Field>
                        </div>

                        <div className={bS.passToggle}>
                          <Field name='includeNumbers' type='checkbox'>
                            {({ input }) => (
                              <>
                                <input
                                  {...input}
                                  id='include-numbers'
                                  onChange={(e) => {
                                    const newValue = e.target.checked;
                                    input.onChange(e);
                                    setData('includeNumbers', newValue);
                                    regeneratePassword(form, undefined, undefined, newValue, undefined);
                                  }}
                                />
                                <label htmlFor='include-numbers'>
                                  <span className={bS.passToggleBox}>
                                    <span className={bS.passToggleBoxCircle} />
                                  </span>
                                  <span className={bS.passToggleText}>
                                    <span>{browser.i18n.getMessage('password_generator_numbers')}</span>
                                  </span>
                                </label>
                              </>
                            )}
                          </Field>
                        </div>

                        <div className={bS.passToggle}>
                          <Field name='includeSpecialChars' type='checkbox'>
                            {({ input }) => (
                              <>
                                <input
                                  {...input}
                                  id='include-special-chars'
                                  onChange={(e) => {
                                    const newValue = e.target.checked;
                                    input.onChange(e);
                                    setData('includeSpecialChars', newValue);
                                    regeneratePassword(form, undefined, undefined, undefined, newValue);
                                  }}
                                />
                                <label htmlFor='include-special-chars'>
                                  <span className={bS.passToggleBox}>
                                    <span className={bS.passToggleBoxCircle} />
                                  </span>
                                  <span className={bS.passToggleText}>
                                    <span>{browser.i18n.getMessage('password_generator_special_chars')}</span>
                                  </span>
                                </label>
                              </>
                            )}
                          </Field>
                        </div>
                      </div>
                    </div>

                    <div className={S.passwordGeneratorSubmit}>
                      <button
                        className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
                        type='submit'
                      >
                        {browser.i18n.getMessage('password_generator_use_password')}
                      </button>
                    </div>
                  </form>
                );
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default PasswordGenerator;
