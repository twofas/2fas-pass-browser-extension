// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState, useCallback } from 'react';
import { Form, Field } from 'react-final-form';
import { filterXSS } from 'xss';
import usePopupStateStore from '../../../../store/popupState';

/**
* Function to render the Extension Name component.
* @return {JSX.Element} The rendered component.
*/
function ExtensionName () {
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const [isInitialized, setIsInitialized] = useState(false);

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
      errors['ext-name'] = browser.i18n.getMessage('settings_ext_name_validate_required');
    } else if (values['ext-name'].length < 3) {
      errors['ext-name'] = browser.i18n.getMessage('settings_ext_name_validate_min_length');
    } else if (values['ext-name'].length > 32) {
      errors['ext-name'] = browser.i18n.getMessage('settings_ext_name_validate_max_length');
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

      showToast(browser.i18n.getMessage('notification_extension_name_update_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_saving_extension_name'), 'error');
      await CatchError(e);
    }

    return true;
  }, [validate]);

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
                  <label htmlFor="ext-name">{browser.i18n.getMessage('settings_ext_name_label')}</label>
                  <button
                    type="submit"
                    className={`${bS.btn} ${bS.btnClear}`}
                    disabled={submitting || !isInitialized ? 'disabled' : ''}
                  >
                    {browser.i18n.getMessage('save')}
                  </button>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type="text"
                    {...input}
                    id="ext-name"
                    placeholder={browser.i18n.getMessage('settings_ext_name_placeholder')}
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
