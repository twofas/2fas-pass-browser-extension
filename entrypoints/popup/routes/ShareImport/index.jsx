// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ShareImport.module.scss';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { getSecret } from '@/partials/share/ShareAPI';
import { fromBase64Url, decryptShareData, deriveKeyFromPassword } from '@/partials/share/ShareCrypto';
import { filterXSS } from 'xss';
import useScrollPosition from '../../hooks/useScrollPosition';
import usePopupState from '../../store/popupState/usePopupState';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ShareImportPasswordView from './views/ShareImportPasswordView';
import LoginShareImportView from './views/LoginShareImportView';
import SecureNoteShareImportView from './views/SecureNoteShareImportView';
import PaymentCardShareImportView from './views/PaymentCardShareImportView';
import WifiShareImportView from './views/WifiShareImportView';
import CustomShareImportView from './views/CustomShareImportView';
import { useI18n } from '@/partials/context/I18nContext';

const VIEWS = {
  LOADING: 'loading',
  PASSWORD: 'password',
  DATA: 'data'
};

const CONTENT_TYPE_VIEWS = {
  login: LoginShareImportView,
  secureNote: SecureNoteShareImportView,
  paymentCard: PaymentCardShareImportView,
  wifi: WifiShareImportView,
  custom: CustomShareImportView
};

const CONTENT_TYPE_HEADERS = {
  login: 'share_import_header_login',
  secureNote: 'share_import_header_secure_note',
  paymentCard: 'share_import_header_payment_card',
  wifi: 'share_import_header_wifi',
  custom: 'share_import_header_custom'
};

function ShareImport (props) {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const scrollableRef = useRef(null);
  const { data, setBatchData, setData, clearData } = usePopupState();
  const [view, setView] = useState(() => {
    if (location.search.includes('fresh')) {
      return VIEWS.LOADING;
    }

    if (data.shareDecrypted) {
      return VIEWS.DATA;
    }

    if (data.shareEncryptedData) {
      return VIEWS.PASSWORD;
    }

    return VIEWS.LOADING;
  });
  const [passwordError, setPasswordError] = useState('');

  useScrollPosition(scrollableRef, true);

  const sanitizeContent = useCallback(result => {
    if (!result?.content) {
      return result;
    }

    const sanitized = { ...result, content: {} };

    for (const [key, value] of Object.entries(result.content)) {
      if (typeof value === 'string') {
        sanitized.content[key] = filterXSS(value);
      } else if (Array.isArray(value)) {
        sanitized.content[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            const sanitizedItem = {};

            for (const [k, v] of Object.entries(item)) {
              sanitizedItem[k] = typeof v === 'string' ? filterXSS(v) : v;
            }

            return sanitizedItem;
          }

          return typeof item === 'string' ? filterXSS(item) : item;
        });
      } else {
        sanitized.content[key] = value;
      }
    }

    return sanitized;
  }, []);

  const decrypt = useCallback(async (keyBytes, nonce, apiData) => {
    const nonceBytes = fromBase64Url(nonce);
    const ciphertext = fromBase64Url(apiData);
    return decryptShareData(keyBytes, nonceBytes, ciphertext);
  }, []);

  const storeDecryptedContent = useCallback((contentType, content) => {
    setBatchData({
      shareDecrypted: true,
      shareContentType: contentType,
      ...content
    });
  }, [setBatchData]);

  const handleCancel = useCallback(() => {
    clearData();
    navigate('/');
  }, [clearData, navigate]);

  useEffect(() => {
    const isFresh = location.search.includes('fresh');

    if (isFresh) {
      clearData();
      navigate(location.pathname, { replace: true });
    } else if (data.shareDecrypted || data.shareEncryptedData) {
      return;
    }

    const init = async () => {
      try {
        if (!params?.id || !params?.type || !params?.nonce || !params?.key) {
          showToast(getMessage('share_import_invalid_params'), 'error');
          navigate('/');
          return;
        }

        const secretResponse = await getSecret(params.id);

        if (params.type === 'v1k') {
          const keyBytes = fromBase64Url(params.key);
          const result = await decrypt(keyBytes, params.nonce, secretResponse.data);
          const sanitized = sanitizeContent(result);
          storeDecryptedContent(sanitized.contentType, sanitized.content);
          setView(VIEWS.DATA);
        } else {
          setData('shareEncryptedData', secretResponse.data);
          setView(VIEWS.PASSWORD);
        }
      } catch (e) {
        CatchError(e);
        showToast(getMessage('share_import_fetch_error'), 'error');
        navigate('/');
      }
    };

    init();
  }, []);

  const handlePasswordSubmit = useCallback(async password => {
    setPasswordError('');

    try {
      const salt = fromBase64Url(params.key);
      const keyBytes = await deriveKeyFromPassword(password, salt);
      const result = await decrypt(keyBytes, params.nonce, data.shareEncryptedData);
      const sanitized = sanitizeContent(result);
      storeDecryptedContent(sanitized.contentType, sanitized.content);
      setView(VIEWS.DATA);
    } catch (e) {
      if (e.message === 'Decryption failed' || e.name === 'OperationError') {
        setPasswordError(getMessage('share_import_password_error'));
      } else {
        CatchError(e);
        showToast(getMessage('share_import_decrypt_error'), 'error');
        navigate('/');
      }
    }
  }, [params, data.shareEncryptedData, decrypt, storeDecryptedContent, getMessage]);

  const renderFormContent = () => {
    if (view === VIEWS.PASSWORD) {
      return (
        <ShareImportPasswordView
          onSubmit={handlePasswordSubmit}
          error={passwordError}
        />
      );
    }

    if (view === VIEWS.DATA && data.shareDecrypted) {
      const contentType = data.shareContentType;
      const ContentView = CONTENT_TYPE_VIEWS[contentType];

      if (!ContentView) {
        showToast(getMessage('share_import_unsupported_type'), 'error');
        navigate('/');
        return null;
      }

      const headerKey = CONTENT_TYPE_HEADERS[contentType];

      return (
        <>
          <h2>{getMessage(headerKey)}</h2>
          <h3>{getMessage('share_import_subheader')}</h3>
          <ContentView />
        </>
      );
    }

    return null;
  };

  if (view === VIEWS.LOADING) {
    return (
      <div className={`${props.className ? props.className : ''}`}>
        <div>
          <section className={S.shareImportFullscreen}>
            <div className={S.shareImportLoading}>
              <p>{getMessage('share_import_loading')}</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.shareImport}>
          <div className={S.shareImportContainer}>
            <NavigationButton type='cancel' onClick={handleCancel} />
            {renderFormContent()}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ShareImport;
