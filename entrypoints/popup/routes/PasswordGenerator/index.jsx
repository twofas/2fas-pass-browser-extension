// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PasswordGenerator.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import { lazy, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Form, Field } from 'react-final-form';
import copyValue from '../ThisTab/functions/serviceList/copyValue';

const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));
const PasswordInput = lazy(() => import('@/entrypoints/popup/components/PasswordInput'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const RefreshIcon = lazy(() => import('@/assets/popup-window/refresh.svg?react'));

function PasswordGenerator (props) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!location.state) { // @TODO: Improve this (check details / add new)
      const doesAnyHistoryEntryExist = location.key !== 'default';

      if (doesAnyHistoryEntryExist) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [location.state, location.key, navigate]);

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

  const initialValues = {
    password: generatePassword(16, true, true, true),
    characters: 16,
    includeUppercase: true,
    includeNumbers: true,
    includeSpecialChars: true
  };

  const onSubmit = (values) => {
    if (location.state?.onPasswordGenerated) {
      location.state.onPasswordGenerated(values.password);
    }

    // navigate(-1);
  };

  const validate = (values) => {
    const errors = {};
    if (!values.password || values.password.length < 6) {
      errors.password = browser.i18n.getMessage('password_generator_password_too_short');
    }

    // if (!values.includeUppercase && !values.includeNumbers && !values.includeSpecialChars) {
    //   errors.general = browser.i18n.getMessage('password_generator_select_at_least_one');
    // }

    return errors;
  };

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.passwordGenerator}>
          <div className={S.passwordGeneratorContainer}>
            <NavigationButton type='back' />

            <h2>{browser.i18n.getMessage('password_generator_title')}</h2>

            <Form
              onSubmit={onSubmit}
              validate={validate}
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
                };

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
                                onClick={() => copyValue(input.value, '00000000-0000-0000-0000-000000000000', 'password')}
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
