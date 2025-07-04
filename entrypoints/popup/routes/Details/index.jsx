// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Details.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { LazyMotion } from 'motion/react';
import { useParams, useNavigate } from 'react-router';
import { useState, useEffect, lazy, useCallback } from 'react';
import generateURLs from './functions/generateURLs';
import getEditableAmount from './functions/getEditableAmount';
import { Form } from 'react-final-form';
import getServices from '@/partials/sessionStorage/getServices';
import valueToNFKD from '@/partials/functions/valueToNFKD';
import sanitizeObject from '@/partials/functions/sanitizeObject';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const Name = lazy(() => import('./components/Name'));
const Username = lazy(() => import('./components/Username'));
const Password = lazy(() => import('./components/Password'));
const SecurityTier = lazy(() => import('./components/SecurityTier'));
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
  const [service, setService] = useState({});
  const [loading, setLoading] = useState(true);
  const [dangerZoneOpened, setDangerZoneOpened] = useState(false);
  const [nameEditable, setNameEditable] = useState(false);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [passwordEditable, setPasswordEditable] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordDecryptError, setPasswordDecryptError] = useState(false);
  const [domainsEditable, setDomainsEditable] = useState([]);
  const [passwordMobile, setPasswordMobile] = useState(false);
  const [usernameMobile, setUsernameMobile] = useState(false);
  const [tierEditable, setTierEditable] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [notesEditable, setNotesEditable] = useState(false);
  const [inputError, setInputError] = useState(undefined);

  const navigate = useNavigate();
  const params = useParams();

  const getData = useCallback(async () => {
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
    
    const urisLength = s.uris?.length || 0;

    setService(s);
    setDomainsEditable(new Array(urisLength).fill(false));
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      getData();
    } catch (e) {
      CatchError(e);
    }
  }, []);

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
        text: valueToNFKD(uri.text),
        matcher: uri.matcher
      }
    });

    const stateData = {
      loginId: service.id ? valueToNFKD(service.id) : null,
      deviceId: service?.deviceId
    };

    stateData.securityType = e?.securityType && Number.isInteger(e?.securityType?.value) ? e.securityType.value : service?.securityType;

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

    if (domainsEditable.some(e => e)) {
      stateData.uris = e.uris;
    }

    return navigate('/fetch', {
      state: {
        action: 'updateLogin',
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
        <div>
          <section className={S.details}>
            <div className={S.detailsContainer}>
              <NavigationButton type='cancel' />

              <h2>{browser.i18n.getMessage('details_header')}</h2>

              <Form
                onSubmit={onSubmit}
                initialValues={service}
                render={({ handleSubmit, form, submitting, pristine, values }) => (
                  <form onSubmit={handleSubmit}>
                    <Name
                      data={{ service, form, nameEditable, inputError }}
                      actions={{ setNameEditable }}
                    />
                    <Username
                      data={{ service, usernameEditable, usernameMobile, inputError, form }}
                      actions={{ setUsernameEditable, setUsernameMobile }}
                    />
                    <Password
                      data={{ service, passwordEditable, passwordVisible, passwordMobile, passwordDecryptError, form }}
                      actions={{ setPasswordEditable, setPasswordVisible, setPasswordMobile, setPasswordDecryptError }}
                    />
                    {generateURLs({
                      data: { service, uris: values.uris, domainsEditable, inputError, form },
                      actions: { setDomainsEditable }
                    })}
                    <SecurityTier
                      data={{ service, tierEditable, form }}
                      actions={{ setTierEditable }}
                    />
                    <Notes
                      data={{ service, notesEditable, notesVisible, form }}
                      actions={{ setNotesEditable, setNotesVisible }}
                    />
                    <div className={S.detailsButton}>
                      <button
                        type="submit"
                        className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
                        disabled={(getEditableAmount(nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable).amount <= 0 || submitting) ? 'disabled' : ''}
                      >
                        {browser.i18n.getMessage('update')}{getEditableAmount(nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable).text}
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
