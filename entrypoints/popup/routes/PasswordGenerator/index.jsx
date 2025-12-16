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
import usePopupState from '../../store/popupState/usePopupState';
import useScrollPosition from '../../hooks/useScrollPosition';

const PASSWORD_GENERATOR_DEFAULTS = {
  characters: 16,
  includeUppercase: true,
  includeNumbers: true,
  includeSpecialChars: true
};

function PasswordGenerator (props) {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: storeData, setData, href: popupHref } = usePopupState();

  const data = {
    ...storeData,
    characters: storeData.characters ?? PASSWORD_GENERATOR_DEFAULTS.characters,
    includeUppercase: storeData.includeUppercase ?? PASSWORD_GENERATOR_DEFAULTS.includeUppercase,
    includeNumbers: storeData.includeNumbers ?? PASSWORD_GENERATOR_DEFAULTS.includeNumbers,
    includeSpecialChars: storeData.includeSpecialChars ?? PASSWORD_GENERATOR_DEFAULTS.includeSpecialChars
  };

  const scrollableRef = useRef(null);
  const initialPasswordRef = useRef(null);

  useScrollPosition(scrollableRef);

  const generatePassword = (length, useUppercase, useNumbers, useSpecialChars) => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const shouldUseUppercase = useUppercase !== undefined ? useUppercase : true;
    const shouldUseNumbers = useNumbers !== undefined ? useNumbers : true;
    const shouldUseSpecialChars = useSpecialChars !== undefined ? useSpecialChars : true;

    let charset = lowercase;
    let password = '';
    const requiredChars = [];

    const randomIndexLowecase = Math.floor(Math.random() * lowercase.length);
    requiredChars.push(lowercase.charAt(randomIndexLowecase));

    if (shouldUseUppercase) {
      charset += uppercase;
      const randomIndex = Math.floor(Math.random() * uppercase.length);
      requiredChars.push(uppercase.charAt(randomIndex));
    }

    if (shouldUseNumbers) {
      charset += numbers;
      const randomIndex = Math.floor(Math.random() * numbers.length);
      requiredChars.push(numbers.charAt(randomIndex));
    }

    if (shouldUseSpecialChars) {
      charset += specialChars;
      const randomIndex = Math.floor(Math.random() * specialChars.length);
      requiredChars.push(specialChars.charAt(randomIndex));
    }

    length = length !== undefined ? length : 16;
    const remainingLength = length - requiredChars.length;

    for (let i = 0; i < remainingLength; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }

    const allChars = password.split('').concat(requiredChars);

    for (let i = allChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }

    return allChars.join('');
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
    if (location.state) {
      const stateData = location.state.data || {};

      Object.entries(stateData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'navigationContext') {
          setData(key, value);
        }
      });

      if (location.state.from) {
        setData('returnTo', location.state.from);
      }
    }
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
    const returnTo = data?.returnTo || location?.state?.from;

    if (!returnTo) {
      showToast(browser.i18n.getMessage('password_generator_data_error'));
      return;
    }

    if (returnTo === 'addNew') {
      return navigate(`/add-new/Login`, {
        state: {
          from: 'passwordGenerator',
          data: { s_password: values.password }
        }
      });
    } else if (returnTo === 'details') {
      const item = data.item;

      if (!item?.id) {
        showToast(browser.i18n.getMessage('password_generator_data_error'));
        return;
      }

      return navigate(`/details/${item.deviceId}/${item.vaultId}/${item.id}`, {
        state: {
          from: 'passwordGenerator',
          generatedPassword: values.password
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
                              disabled={true}
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
                                    await copyValue(input.value, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'password');
                                    showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
                                  } catch (e) {
                                    await CatchError(e);
                                    showToast(browser.i18n.getMessage('error_copy_password'));
                                  }
                                }}
                                className={bS.btnIcon}
                                title={browser.i18n.getMessage('copy_to_clipboard')}
                                tabIndex={-1}
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
