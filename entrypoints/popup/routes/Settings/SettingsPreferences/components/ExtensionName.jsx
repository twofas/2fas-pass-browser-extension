// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState } from 'react';
import { Form, Field } from 'react-final-form';
import { filterXSS } from 'xss';
import valueToNFKD from '@/partials/functions/valueToNFKD';

/**
* Function to render the Extension Name component.
* @return {JSX.Element} The rendered component.
*/
function ExtensionName (props) {
  const [loading, setLoading] = useState(true);
  const [extName, setExtName] = useState('');

  useEffect(() => {
    const getExtName = async () => {
      const browserInfo = await storage.getItem('local:browserInfo');
      setExtName(filterXSS(browserInfo.name));
      setLoading(false);

      if (props.onLoad) {
        props.onLoad();
      }
    };

    try {
      getExtName();
    } catch (e) {
      CatchError(e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = values => {
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
  };

  const onSubmit = async e => {
    if (!validate(e)) {
      return false;
    }

    try {
      const browserInfo = await storage.getItem('local:browserInfo');
      browserInfo.name = valueToNFKD(e['ext-name']);
      await storage.setItem('local:browserInfo', browserInfo);
      showToast(browser.i18n.getMessage('notification_extension_name_update_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_saving_extension_name'), 'error');
      await CatchError(e);
    }

    return true;
  };

  if (loading) {
    return null;
  }

  return (
    <Form onSubmit={onSubmit} initialValues={{ 'ext-name': extName }} render={({ handleSubmit, submitting }) => ( // form, pristine, values
      <form className={S.settingsExtName} onSubmit={handleSubmit}>
        <Field name="ext-name">
          {({ input }) => (
             <div className={`${pI.passInput} ${pI.bigMargin}`}>
              <div className={pI.passInputTop}>
                <label htmlFor="ext-name">{browser.i18n.getMessage('settings_ext_name_label')}</label>
                <button type="submit" className={`${bS.btn} ${bS.btnClear}`} disabled={submitting ? 'disabled' : ''}>{browser.i18n.getMessage('save')}</button>
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
