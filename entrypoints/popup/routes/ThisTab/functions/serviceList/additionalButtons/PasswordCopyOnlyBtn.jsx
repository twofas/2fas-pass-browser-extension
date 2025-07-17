// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import copyValue from '../copyValue';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import { toast } from 'react-toastify';
import { lazy } from 'react';

const ServicePasswordIcon = lazy(() => import('@/assets/popup-window/service-password.svg?react'));

/** 
* Function to handle autofill failed password.
* @async
* @param {Object} data - The data object.
* @param {Function} setAutofillFailed - The function to set autofill failed state.
* @return {Promise<void>}
*/
const handleAutofillFailedPassword = async (data, setAutofillFailed) => {
  const passwordAB = Base64ToArrayBuffer(data.password);
  const passwordDecryptedBytes = DecryptBytes(passwordAB);
  const encryptionPassT2Key = await generateEncryptionAESKey(data.hkdfSaltAB, StringToArrayBuffer('PassT2'), data.sessionKeyForHKDF, false);
  const decryptedPasswordAB = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: passwordDecryptedBytes.iv },
    encryptionPassT2Key,
    passwordDecryptedBytes.data
  );
  const decryptedPassword = ArrayBufferToString(decryptedPasswordAB);

  await copyValue(decryptedPassword, data.loginId, 'password');

  if (data.toastId) {
    toast.dismiss(data.toastId);
  }

  showToast(browser.i18n.getMessage('notification_password_copied'), 'success');

  setAutofillFailed(false);
};

/**
* Function to render the password copy only button.
* @param {Object} props - The component props.
* @param {Object} props.state - The state object.
* @param {Function} props.setAutofillFailed - The function to set autofill failed state.
* @return {JSX.Element} The rendered button element.
*/
const PasswordCopyOnlyBtn = ({ state, setAutofillFailed }) => {
  return (
    <button
      onClick={async () => await handleAutofillFailedPassword(state, setAutofillFailed)}
      title={browser.i18n.getMessage('this_tab_copy_password')}
    >
      <ServicePasswordIcon className={S.servicePassword} />
    </button>
  );
};

export default PasswordCopyOnlyBtn;
