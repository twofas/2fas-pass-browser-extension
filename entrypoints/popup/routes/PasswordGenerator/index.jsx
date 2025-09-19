// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PasswordGenerator.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { lazy, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Form, Field } from 'react-final-form';
import copyValue from '@/partials/functions/copyValue';
import { usePopupState } from '@/hooks/usePopupState';

const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));
const PasswordInput = lazy(() => import('@/entrypoints/popup/components/PasswordInput'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const RefreshIcon = lazy(() => import('@/assets/popup-window/refresh.svg?react'));

function PasswordGenerator (props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setScrollElementRef, scrollElementRef, popupStateData, setHref, shouldRestoreScroll, setData, popupState } = usePopupState();

  const updateData = useCallback(updates => {
    setData(prevData => ({
      ...prevData,
      ...updates
    }));
  }, [setData]);

  useEffect(() => {
    setHref(location.pathname);
  }, [location.pathname, setHref]);

  useEffect(() => {
    const currentState = location?.state || popupState?.data?.navigationState;

    if (
      !currentState ||
      !currentState?.from ||
      !currentState?.data ||
      (currentState?.from !== 'addNew' && currentState?.from !== 'details')
    ) {
      const doesAnyHistoryEntryExist = location.key !== 'default';

      if (doesAnyHistoryEntryExist) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [location.state, location.key, navigate, popupState?.data?.navigationState]);

  useEffect(() => {
    if (shouldRestoreScroll && popupStateData?.scrollPosition && popupStateData.scrollPosition !== 0 && scrollElementRef.current) {
      scrollElementRef.current.scrollTo(0, popupStateData.scrollPosition);
    }
  }, [shouldRestoreScroll, popupStateData, scrollElementRef]);

  useEffect(() => {
    if (location?.state) {
      updateData({
        ...location.state.data,
        navigationState: location.state,
        generatedPassword: initialPassword
      });
    } else if (!savedPassword) {
      updateData({
        generatedPassword: initialPassword,
        characters,
        includeUppercase,
        includeNumbers,
        includeSpecialChars
      });
    }
  }, []);

  const generatePassword = (length, useUppercase, useNumbers, useSpecialChars) => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';

    if (useUppercase) {
      charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    if (useNumbers) {
      charset += '0123456789';
    }

    if (useSpecialChars) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  };

  const getInitialValue = (key, fallback) => {
    if (location?.state?.data?.[key] !== undefined) {
      return location.state.data[key];
    }

    if (popupState?.data?.[key] !== undefined) {
      return popupState.data[key];
    }

    return fallback;
  };

  const characters = getInitialValue('characters', 16);
  const includeUppercase = getInitialValue('includeUppercase', true);
  const includeNumbers = getInitialValue('includeNumbers', true);
  const includeSpecialChars = getInitialValue('includeSpecialChars', true);
  const savedPassword = getInitialValue('generatedPassword', null);

  const initialPassword = savedPassword || generatePassword(characters, includeUppercase, includeNumbers, includeSpecialChars);

  const initialValues = {
    password: initialPassword,
    characters,
    includeUppercase,
    includeNumbers,
    includeSpecialChars
  };

  const onSubmit = values => {
    const currentState = location?.state || popupState?.data?.navigationState;

    if (!currentState) {
      showToast(browser.i18n.getMessage('password_generator_data_error'));
      return;
    }

    const from = currentState.from;
    const data = { ...currentState.data, password: values.password };

    if (from === 'addNew') {
      return navigate(`/add-new`, {
        state: {
          from: 'passwordGenerator',
          data
        }
      });
    } else if (from === 'details' && currentState.data?.service?.id) {
      return navigate(`/details/${currentState.data.service.id}`, {
        state: {
          from: 'passwordGenerator',
          data: { ...data, formValues: { ...data.formValues, password: values.password } }
        }
      });
    } else {
      showToast(browser.i18n.getMessage('password_generator_data_error'));
      return;
    }
  };

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={el => { setScrollElementRef(el); }}>
        <section className={S.passwordGenerator}>
          <div className={S.passwordGeneratorContainer}>
            <NavigationButton type='back' />

            <h2>{browser.i18n.getMessage('password_generator_title')}</h2>

            <Form
              onSubmit={onSubmit}
              initialValues={initialValues}
              render={({ handleSubmit, form, values }) => {
                const regeneratePassword = (overrides = {}) => {
                  const currentValues = { ...values, ...overrides };
                  const newPassword = generatePassword(
                    currentValues.characters,
                    currentValues.includeUppercase,
                    currentValues.includeNumbers,
                    currentValues.includeSpecialChars
                  );

                  form.change('password', newPassword);

                  setTimeout(() => {
                    updateData({
                      generatedPassword: newPassword,
                      characters: currentValues.characters,
                      includeUppercase: currentValues.includeUppercase,
                      includeNumbers: currentValues.includeNumbers,
                      includeSpecialChars: currentValues.includeSpecialChars
                    });
                  }, 0);
                };

                return (
                  <form onSubmit={handleSubmit} className={S.passwordGeneratorForm} onChange={() => {
                    const values = form.getState().values;
                    updateData({
                      generatedPassword: values.password,
                      characters: values.characters,
                      includeUppercase: values.includeUppercase,
                      includeNumbers: values.includeNumbers,
                      includeSpecialChars: values.includeSpecialChars
                    });
                  }}>
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
                            />
                            <div className={pI.passInputBottomButtons}>
                              <button
                                type='button'
                                onClick={regeneratePassword}
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
                                  regeneratePassword({ characters: newValue });
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
                                    regeneratePassword({ includeUppercase: newValue });
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
                                    regeneratePassword({ includeNumbers: newValue });
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
                                    regeneratePassword({ includeSpecialChars: newValue });
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
