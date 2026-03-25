// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Share.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useParams, useNavigate } from 'react-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import getItem from '@/partials/sessionStorage/getItem';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ItemIcon from '../ThisTab/functions/serviceList/generateIcon';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import { useI18n } from '@/partials/context/I18nContext';
import {
  generateNonce,
  generateSalt,
  generateRandomKey,
  deriveKeyFromPassword,
  encryptData,
  toBase64,
  toBase64Url
} from '@/partials/share/ShareCrypto';
import { createSecret } from '@/partials/share/ShareAPI';
import buildShareContent from '@/partials/share/buildShareContent';
import CalendarIcon from '@/assets/popup-window/calendar.svg?react';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import ServicePasswordIcon from '@/assets/popup-window/service-password.svg?react';

const EXPIRATION_SHORT = [
  { value: 300, key: 'share_expiry_5min' },
  { value: 1800, key: 'share_expiry_30min' },
  { value: 3600, key: 'share_expiry_1hour' }
];

const EXPIRATION_LONG = [
  { value: 86400, key: 'share_expiry_1day' },
  { value: 604800, key: 'share_expiry_7days' },
  { value: 2592000, key: 'share_expiry_30days' }
];

const passwordVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '60px' }
};

function getItemSubtitle (item) {
  switch (item.contentType) {
    case 'login':
      return item.content.username || '';

    case 'paymentCard':
      return item.content.cardNumberMask || item.content.cardHolder || '';

    case 'wifi':
      return item.content.ssid || '';

    case 'secureNote':
      return item.content.additionalInfo || '';

    default:
      return '';
  }
}

function ShareForm ({ item, getMessage, navigate }) {
  const [expiration, setExpiration] = useState(1800);
  const [oneTimeAccess, setOneTimeAccess] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expirationOptions = useMemo(() => [
    { label: '', options: EXPIRATION_SHORT.map(opt => ({ value: opt.value, label: getMessage(opt.key) })) },
    { label: '', options: EXPIRATION_LONG.map(opt => ({ value: opt.value, label: getMessage(opt.key) })) }
  ], [getMessage]);

  const handleExpirationChange = useCallback(selectedOption => {
    if (selectedOption) {
      setExpiration(selectedOption.value);
    }
  }, []);

  const handleOneTimeAccessChange = useCallback(e => {
    setOneTimeAccess(e.target.checked);
  }, []);

  const handleUsePasswordChange = useCallback(e => {
    const checked = e.target.checked;
    setUsePassword(checked);

    if (!checked) {
      setPassword('');
      setShowPassword(false);
    }
  }, []);

  const handlePasswordChange = useCallback(e => {
    setPassword(e.target.value);
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (usePassword && password.length < 8) {
      showToast(getMessage('share_password_error_min_length'), 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!item.sifExists) {
        showToast(getMessage('share_error_no_sif'), 'error');
        setIsSubmitting(false);
        return;
      }

      const shareData = await buildShareContent(item);
      const nonce = generateNonce();
      let shareKey = null;
      let type = null;
      let urlSecret = null;

      if (usePassword && password) {
        type = 'v1p';
        const salt = generateSalt();
        shareKey = await deriveKeyFromPassword(password, salt);
        urlSecret = toBase64Url(salt);
      } else {
        type = 'v1k';
        shareKey = generateRandomKey();
        urlSecret = toBase64Url(shareKey);
      }

      const encrypted = await encryptData(shareKey, nonce, shareData);
      shareKey = null;

      const encodedData = toBase64(encrypted);

      if (encodedData.length > 16384) {
        showToast(getMessage('share_error_size_exceeded'), 'error');
        return;
      }

      const result = await createSecret({
        data: encodedData,
        validForSeconds: expiration,
        singleUse: oneTimeAccess
      });

      const link = `${import.meta.env.VITE_SHARE_FRONTEND_URL}/#/${result.id}/${type}/${toBase64Url(nonce)}/${urlSecret}`;

      navigate('/share-result', {
        state: {
          result: {
            link,
            expiration,
            oneTimeAccess,
            password: usePassword ? password : null
          },
          item: item.toJSON()
        }
      });
    } catch (err) {
      CatchError(err);

      if (err?.message?.includes('Encryption') || err?.message?.includes('Key derivation')) {
        showToast(getMessage('share_error_encrypt'), 'error');
      } else {
        showToast(getMessage('share_error_api'), 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [item, expiration, oneTimeAccess, usePassword, password, isSubmitting, getMessage, navigate]);

  const selectedExpiration = useMemo(() =>
    expirationOptions.flatMap(g => g.options).find(o => o.value === expiration),
  [expirationOptions, expiration]);

  return (
    <form onSubmit={handleSubmit}>
      <h3 className={S.shareSettingsTitle}>{getMessage('share_settings_title')}</h3>

      <div className={S.shareOption}>
        <div className={`${S.shareOptionIcon} ${S.stroke}`}>
          <CalendarIcon />
        </div>
        <div className={S.shareOptionContent}>
          <span className={S.shareOptionTitle}>{getMessage('share_expiration_title')}</span>
          <p className={S.shareOptionDesc}>{getMessage('share_expiration_desc')}</p>
        </div>
        <div className={S.shareOptionControl}>
          <AdvancedSelect
            className='react-select-container'
            classNamePrefix='react-select'
            classNames={{ menuPortal: () => 'react-select-share-expiry__menu-portal' }}
            isSearchable={false}
            options={expirationOptions}
            value={selectedExpiration}
            onChange={handleExpirationChange}
            menuPlacement='auto'
          />
        </div>
      </div>

      <div className={S.shareOption}>
        <div className={`${S.shareOptionIcon} ${S.stroke}`}>
          <VisibleIcon />
        </div>
        <div className={S.shareOptionContent}>
          <span className={S.shareOptionTitle}>{getMessage('share_one_time_access_title')}</span>
          <p className={S.shareOptionDesc}>{getMessage('share_one_time_access_desc')}</p>
        </div>
        <div className={S.shareOptionControl}>
          <div className={bS.passToggle}>
            <input
              type='checkbox'
              id='share-one-time'
              checked={oneTimeAccess}
              onChange={handleOneTimeAccessChange}
            />
            <label htmlFor='share-one-time'>
              <span className={bS.passToggleBox}>
                <span className={bS.passToggleBoxCircle} />
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className={`${S.shareOption} ${S.noBorder}`}>
        <div className={`${S.shareOptionIcon} ${S.fill}`}>
          <ServicePasswordIcon />
        </div>
        <div className={S.shareOptionContent}>
          <span className={S.shareOptionTitle}>{getMessage('share_password_title')}</span>
          <p className={S.shareOptionDesc}>{getMessage('share_password_desc')}</p>

          <motion.div
            className={S.sharePasswordCollapse}
            variants={passwordVariants}
            initial={usePassword ? 'visible' : 'hidden'}
            animate={usePassword ? 'visible' : 'hidden'}
            transition={{ duration: .2, type: 'tween', ease: 'easeOut' }}
          >
            <div className={S.sharePasswordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder={getMessage('share_password_placeholder')}
                autoComplete='off'
                disabled={!usePassword}
              />
              <button
                type='button'
                className={S.sharePasswordFieldToggle}
                onClick={handleTogglePassword}
                tabIndex={-1}
              >
                <VisibleIcon />
              </button>
            </div>
          </motion.div>
        </div>
        <div className={S.shareOptionControl}>
          <div className={bS.passToggle}>
            <input
              type='checkbox'
              id='share-password-toggle'
              checked={usePassword}
              onChange={handleUsePasswordChange}
            />
            <label htmlFor='share-password-toggle'>
              <span className={bS.passToggleBox}>
                <span className={bS.passToggleBoxCircle} />
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className={S.shareButton}>
        <button
          type='submit'
          className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? getMessage('share_submitting') : getMessage('share_button')}
        </button>
      </div>
    </form>
  );
}

function Share (props) {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const params = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollableRef = useRef(null);

  const fetchItem = useCallback(async () => {
    try {
      const fetchedItem = await getItem(params.deviceId, params.vaultId, params.id);

      if (!fetchedItem) {
        showToast(getMessage('share_feature_not_available'), 'error');
        navigate('/');
        return;
      }

      if (!fetchedItem.sifExists) {
        showToast(getMessage('share_error_no_sif'), 'error');
        navigate(`/details/${params.deviceId}/${params.vaultId}/${params.id}`);
        return;
      }

      setItem(fetchedItem);
      setLoading(false);
    } catch (e) {
      CatchError(e);
      navigate('/');
    }
  }, [params.deviceId, params.vaultId, params.id, navigate, getMessage]);

  const subtitle = useMemo(() => {
    if (!item) {
      return '';
    }

    return getItemSubtitle(item);
  }, [item]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  if (loading || !item) {
    return null;
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.share}>
          <NavigationButton type='back' />
          <h2>{getMessage('share_header')}</h2>

          <div className={S.sharePreview}>
            <div className={S.sharePreviewIcon}>
              <ItemIcon item={item} loading={false} />
            </div>
            <span className={S.sharePreviewName}>{item.content.name || ''}</span>
            {subtitle && <span className={S.sharePreviewSubtitle}>{subtitle}</span>}
          </div>

          <ShareForm item={item} getMessage={getMessage} navigate={navigate} />
        </section>
      </div>
    </div>
  );
}

export default Share;
