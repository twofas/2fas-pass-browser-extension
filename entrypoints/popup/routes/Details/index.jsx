// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Details.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { LazyMotion } from 'motion/react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useState, useEffect, lazy, useCallback, useRef } from 'react';
import generateURLs from './functions/generateURLs';
import getEditableAmount from './functions/getEditableAmount';
import { Form } from 'react-final-form';
import getServices from '@/partials/sessionStorage/getServices';
import { valueToNFKD, sanitizeObject } from '@/partials/functions';

import URIMatcher from '@/partials/URIMatcher';
import { PULL_REQUEST_TYPES } from '@/constants';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const Name = lazy(() => import('./components/Name'));
const Username = lazy(() => import('./components/Username'));
const Password = lazy(() => import('./components/Password'));
const SecurityTier = lazy(() => import('./components/SecurityTier'));
const Tags = lazy(() => import('./components/Tags'));
const Notes = lazy(() => import('./components/Notes'));
const DangerZone = lazy(() => import('./components/DangerZone'));
const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));

const hiddenPassword = '******';

/** 
* Function to render the details component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Details (props) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  const isInitialLoadRef = useRef(true);
  const unwatchStorageVersion = useRef(null);

  const getInitialValue = useCallback((key, fallback) => {
    if (location?.state?.data?.generatorData?.[key] !== undefined) {
      return location.state.data.generatorData[key];
    }

    return fallback;
  }, [location?.state?.data?.generatorData]);

  const getInitialService = useCallback(() => {
    if (location?.state?.data?.service) {
      return location.state.data.service;
    }

    return {};
  }, [location?.state?.data?.service]);

  const getInitialFormValues = useCallback(() => {
    if (location?.state?.data?.formValues) {
      return location.state.data.formValues;
    }

    return null;
  }, [location?.state?.data?.formValues]);

  const [service, setService] = useState(getInitialService());
  const [originalService, setOriginalService] = useState(null);
  const [formValues, setFormValues] = useState(getInitialFormValues());
  const [loading, setLoading] = useState(true);
  const [dangerZoneOpened, setDangerZoneOpened] = useState(getInitialValue('dangerZoneOpened', false));
  const [nameEditable, setNameEditable] = useState(getInitialValue('nameEditable', false));
  const [usernameEditable, setUsernameEditable] = useState(getInitialValue('usernameEditable', false));
  const [passwordEditable, setPasswordEditable] = useState(getInitialValue('passwordEditable', false));
  const [passwordVisible, setPasswordVisible] = useState(getInitialValue('passwordVisible', false));
  const [domainsEditable, setDomainsEditable] = useState(getInitialValue('domainsEditable', []));
  const [passwordMobile, setPasswordMobile] = useState(getInitialValue('passwordMobile', false));
  const [usernameMobile, setUsernameMobile] = useState(getInitialValue('usernameMobile', false));
  const [tierEditable, setTierEditable] = useState(getInitialValue('tierEditable', false));
  const [notesEditable, setNotesEditable] = useState(getInitialValue('notesEditable', false));
  const [tagsEditable, setTagsEditable] = useState(getInitialValue('tagsEditable', false));
  const [inputError, setInputError] = useState(undefined);
  const [storageVersion, setStorageVersion] = useState(null);

  const handleRemoveUri = useCallback((index, form) => {
    const currentValues = form.getState().values;
    const newUris = currentValues.uris.filter((_, i) => i !== index);

    form.change('uris', newUris);

    const newDomainsEditable = domainsEditable.filter((_, i) => i !== index);
    setDomainsEditable(newDomainsEditable);

    const updatedFormValues = {
      ...currentValues,
      uris: newUris
    };

    setFormValues(updatedFormValues);

    }, [domainsEditable]);

  const handleAddUri = useCallback(form => {
    const currentValues = form.getState().values;
    const currentUris = currentValues.uris || [];
    const newUri = {
      text: '',
      matcher: URIMatcher.M_DOMAIN_TYPE,
      _tempId: `new-${Date.now()}-${Math.random()}`
    };

    const newUris = [...currentUris, newUri];
    form.change('uris', newUris);

    const newDomainsEditable = [...domainsEditable, true];
    setDomainsEditable(newDomainsEditable);

    const updatedFormValues = {
      ...currentValues,
      uris: newUris
    };

    setFormValues(updatedFormValues);

    }, [domainsEditable]);

  const getData = useCallback(async () => {
    if (location?.state?.data?.service) {
      setOriginalService(location.state.data.service);
      setLoading(false);
    } else {
      const data = await getServices();
      let s = data.find(s => s.id === params.id);

      if (!s || s.length <= 0) {
        showToast(browser.i18n.getMessage('details_service_not_found'), 'error');
        navigate('/');
        return;
      }

      if (s.password) {
        s.passwordEncrypted = s.password;
        s.password = hiddenPassword;
      }

      s = sanitizeObject(s);
      setOriginalService(s);

      const urisLength = s.uris?.length || 0;

      setService(s);
      setDomainsEditable(new Array(urisLength).fill(false));
      setLoading(false);
      setPasswordEditable(false);
    }

    isInitialLoadRef.current = false;
  }, [location?.state?.data?.service, params.id, navigate]);

  const watchStorageVersion = useCallback(() => {
    const uSV = storage.watch('session:storageVersion', async newValue => {
      setStorageVersion(newValue);
    });

    return uSV;
  }, []);

  useEffect(() => {
    getData()
      .then(() => watchStorageVersion())
      .then(unwatch => { unwatchStorageVersion.current = unwatch; })
      .catch(e => CatchError(e));

    return () => {
      if (unwatchStorageVersion.current) {
        unwatchStorageVersion.current();
      }
    };
  }, [storageVersion]);

  const validate = values => {
    const errors = {};

    if (!values.name || values.name?.length <= 0) {
      errors.name = browser.i18n.getMessage('details_name_required');
    } else if (values.name?.length > 255) {
      errors.name = browser.i18n.getMessage('details_name_max_length');
    } else if (values.username?.length > 255) {
      errors.username = browser.i18n.getMessage('details_username_max_length');
    }

    values.uris.forEach((uri, index) => {
      if (uri?.text?.length > 2048) {
        errors[`uris[${index}]`] = browser.i18n.getMessage('details_uri_max_length');
      }
    });

    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      showToast(errors[errorKeys[0]], 'error');
      setInputError(errorKeys[0]);
      return false;
    }

    return true;
  };

  const onSubmit = async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    e.uris = e.uris.map(uri => {
      return {
        text: uri?.text ? valueToNFKD(uri.text) : '',
        matcher: uri?.matcher
      };
    });

    const stateData = {
      loginId: service.id ? valueToNFKD(service.id) : null,
      deviceId: service?.deviceId
    };

    stateData.securityType = e?.securityType !== undefined ? (typeof e.securityType === 'number' ? e.securityType : e.securityType?.value) : (originalService || service)?.securityType;

    if (nameEditable) {
      stateData.name = e.name ? valueToNFKD(e.name) : '';
    }

    if (usernameEditable) {
      if (usernameMobile) {
        stateData.usernameMobile = true;
      } else {
        stateData.username = e.username ? valueToNFKD(e.username) : '';
        stateData.usernameMobile = false;
      }
    }

    if (passwordEditable) {
      if (passwordMobile) {
        stateData.passwordMobile = true;
      } else {
        stateData.password = e.password ? valueToNFKD(e.password) : '';
        stateData.passwordMobile = false;
      }
    }

    if (notesEditable) {
      stateData.notes = e.notes ? valueToNFKD(e.notes) : '';
    }

    const hasUriChanges = domainsEditable.some(e => e) || e.uris?.some(uri => uri._tempId) || (service.uris?.length !== e.uris?.length);
    
    if (hasUriChanges) {
      stateData.uris = e.uris;
    }

    if (tagsEditable) {
      stateData.tags = e.tags || [];
    }

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.UPDATE_DATA,
        from: 'details',
        data: stateData
      }
    });
  };

  if (loading) {
    return null;
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className={`${props.className ? props.className : ''}`}>
        <div >
          <section className={S.details}>
            <div className={S.detailsContainer}>
              <NavigationButton type='cancel' />

              <h2>{browser.i18n.getMessage('details_header')}</h2>

              <Form
                onSubmit={onSubmit}
                initialValues={formValues || service}
                render={({ handleSubmit, form, submitting, values }) => (
                  <form onSubmit={handleSubmit} onChange={() => {
                    // Track form value changes (but not for URI changes, which are handled separately)
                    setTimeout(() => {
                      const currentValues = form.getState().values;
                      // Only update if not already updated by handleAddUri or handleRemoveUri
                      if (JSON.stringify(currentValues) !== JSON.stringify(formValues)) {
                        setFormValues(currentValues);
                        }
                    }, 0);
                  }}>
                    <Name
                      key={`name-${service.id}-${storageVersion}`}
                      data={{ service, form, nameEditable, inputError }}
                      actions={{ setNameEditable }}
                    />
                    <Username
                      key={`username-${service.id}-${storageVersion}`}
                      data={{ service, usernameEditable, usernameMobile, inputError, form }}
                      actions={{
                        setUsernameEditable,
                        setUsernameMobile
                      }}
                    />
                    <Password
                      key={`password-${service.id}-${storageVersion}`}
                      data={{ service: originalService || service, passwordEditable, passwordVisible, passwordMobile, form }}
                      actions={{
                        setPasswordEditable,
                        setPasswordVisible,
                        setPasswordMobile
                      }}
                      generatorData={{ dangerZoneOpened, nameEditable, usernameEditable, domainsEditable, usernameMobile, tierEditable, notesEditable }}
                    />
                    {generateURLs({
                      data: { service, uris: values.uris, domainsEditable, inputError, form },
                      actions: { setDomainsEditable, handleRemoveUri, handleAddUri }
                    })}
                    <SecurityTier
                      data={{ service: originalService || service, tierEditable, form }}
                      actions={{
                        setTierEditable,
                        updateSecurityType: (value) => {
                          const currentFormValues = form.getState().values;
                          const updatedFormValues = { ...currentFormValues, securityType: value };
                          setFormValues(updatedFormValues);
                          }
                      }}
                    />
                    <Tags
                      data={{ service, tagsEditable, form }}
                      actions={{ setTagsEditable }}
                    />
                    <Notes
                      data={{ service: originalService || service, notesEditable, form }}
                      actions={{ setNotesEditable }}
                    />
                    <div className={S.detailsButton}>
                      <button
                        type="submit"
                        className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
                        disabled={(getEditableAmount(nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable, tagsEditable, values.uris || []).amount <= 0 || submitting) ? 'disabled' : ''}
                      >
                        {browser.i18n.getMessage('update')}{getEditableAmount(nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable, tagsEditable, values.uris || []).text}
                      </button>
                    </div>

                    <DangerZone
                      data={{ service, dangerZoneOpened, submitting }}
                      actions={{ setDangerZoneOpened }}
                    />
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

export default Details;
