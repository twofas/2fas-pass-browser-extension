// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { Form, Field } from 'react-final-form';
import { filterXSS } from 'xss';
import usePopupState from '../../../../store/popupState/usePopupState';

/**
* Function to render the Extension Name component.
* @return {JSX.Element} The rendered component.
*/
function ExtensionName () {
  const { getMessage } = useI18n();
  const { data, setData } = usePopupState();

  const [isInitialized, setIsInitialized] = useState(false);

  const isExtNameInvalid = useMemo(() => {
    const name = data.extName;

    if (!name || name.length === 0) {
      return false;
    }

    if (name.length < 3 || name.length > 32) {
      return true;
    }

    return false;
  }, [data.extName]);

  useEffect(() => {
    const getExtName = async () => {
      try {
        const browserInfo = await storage.getItem('local:browserInfo');

        if (browserInfo?.name) {
          const name = filterXSS(browserInfo.name);
          setData('extName', name);
        }

        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    if (!data.extName) {
      getExtName();
    } else {
      setIsInitialized(true);
    }
  }, []);

  const validate = useCallback(values => {
    const errors = {};

    if (!values['ext-name']) {
      errors['ext-name'] = getMessage('settings_ext_name_validate_required');
    } else if (values['ext-name'].length < 3) {
      errors['ext-name'] = getMessage('settings_ext_name_validate_min_length');
    } else if (values['ext-name'].length > 32) {
      errors['ext-name'] = getMessage('settings_ext_name_validate_max_length');
    }

    if (errors['ext-name']) {
      showToast(errors['ext-name'], 'error');
      return false;
    }

    return true;
  }, []);

  const onSubmit = useCallback(async e => {
    if (!validate(e)) {
      return false;
    }

    try {
      const browserInfo = await storage.getItem('local:browserInfo');
      browserInfo.name = e['ext-name'];
      await storage.setItem('local:browserInfo', browserInfo);

      // Update local state to reflect the change
      setData('extName', browserInfo.name);

      showToast(getMessage('notification_extension_name_update_success'), 'success');
    } catch (e) {
      showToast(getMessage('error_saving_extension_name'), 'error');
      await CatchError(e);
    }

    return true;
  }, [validate, setData]);

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{ 'ext-name': data.extName }}
      render={({ handleSubmit, submitting }) => (
        <form className={S.settingsExtName} onSubmit={handleSubmit}>
          <Field name="ext-name">
            {({ input }) => (
               <div className={`${pI.passInput} ${pI.bigMargin}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor="ext-name">{getMessage('settings_ext_name_label')}</label>
                  <button
                    type="submit"
                    className={`${bS.btn} ${bS.btnClear}`}
                    disabled={submitting || !isInitialized ? 'disabled' : ''}
                  >
                    {getMessage('save')}
                  </button>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type="text"
                    {...input}
                    id="ext-name"
                    className={isExtNameInvalid ? pI.inputTextError : ''}
                    placeholder={getMessage('settings_ext_name_placeholder')}
                    dir="ltr"
                    spellCheck="true"
                    autoCorrect="on"
                    autoComplete="on"
                    disabled={!isInitialized}
                    onChange={e => {
                      input.onChange(e);
                      setData('extName', e.target.value);
                    }}
                  />
                </div>
              </div>
            )}
          </Field>
        </form>
      )}
    />
  );
}

export default ExtensionName;
