// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ShareResult.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useCallback, useMemo } from 'react';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ItemIcon from '../ThisTab/functions/serviceList/generateIcon';
import { useI18n } from '@/partials/context/I18nContext';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';

const EXPIRATION_OPTIONS = [
  { value: 300, key: 'share_expiry_5min' },
  { value: 1800, key: 'share_expiry_30min' },
  { value: 3600, key: 'share_expiry_1hour' },
  { value: 86400, key: 'share_expiry_1day' },
  { value: 604800, key: 'share_expiry_7days' },
  { value: 2592000, key: 'share_expiry_30days' }
];

function getExpirationLabel (value, getMessage) {
  const option = EXPIRATION_OPTIONS.find(o => o.value === value);
  return option ? getMessage(option.key) : '';
}

function getItemSubtitle (item) {
  switch (item?.contentType) {
    case 'login':
      return item.content?.username || '';

    case 'paymentCard':
      return item.content?.cardNumberMask || item.content?.cardHolder || '';

    case 'wifi':
      return item.content?.ssid || '';

    case 'secureNote':
      return item.content?.additionalInfo || '';

    default:
      return '';
  }
}

function ShareResult (props) {
  const { getMessage } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const result = location.state?.result;
  const item = location.state?.item;

  useEffect(() => {
    if (!result || !item) {
      navigate('/');
    }
  }, [result, item, navigate]);

  const subtitle = useMemo(() => {
    if (!item) {
      return '';
    }

    return getItemSubtitle(item);
  }, [item]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.link);
      showToast(getMessage('share_result_copied'), 'success');
    } catch {}
  }, [result?.link, getMessage]);

  const handleCopyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.password);
      showToast(getMessage('share_result_copied'), 'success');
    } catch {}
  }, [result?.password, getMessage]);

  if (!result || !item) {
    return null;
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.shareResult}>
          <NavigationButton type='back' />
          <h2>{getMessage('share_result_title')}</h2>

          <div className={S.shareResultPreview}>
            <div className={S.shareResultPreviewIcon}>
              <ItemIcon item={item} loading={false} />
            </div>
            <span className={S.shareResultPreviewName}>{item.content?.name || ''}</span>
            {subtitle && <span className={S.shareResultPreviewSubtitle}>{subtitle}</span>}
          </div>

          <div className={S.shareResultLinkBox}>
            <p className={S.shareResultLinkBoxUrl} title={result.link}>{result.link}</p>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              onClick={handleCopyLink}
            >
              {getMessage('share_result_copy_link')}
            </button>
          </div>

          <div className={S.shareResultSummary}>
            <h4 className={S.shareResultSummaryTitle}>{getMessage('share_result_settings')}</h4>

            <div className={S.shareResultSummaryRow}>
              <span className={S.shareResultSummaryRowLabel}>{getMessage('share_result_expiration')}</span>
              <span className={S.shareResultSummaryRowValue}>{getExpirationLabel(result.expiration, getMessage)}</span>
            </div>

            {result.oneTimeAccess && (
              <div className={S.shareResultSummaryRow}>
                <span className={S.shareResultSummaryRowLabel}>{getMessage('share_result_one_time')}</span>
                <span className={S.shareResultSummaryRowCheck}>
                  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8.5L6.5 12L13 4" fill="none" />
                  </svg>
                </span>
              </div>
            )}

            {result.password && (
              <div className={S.shareResultSummaryRow}>
                <span className={S.shareResultSummaryRowLabel}>{getMessage('share_result_password')}</span>
                <button
                  type='button'
                  className={S.shareResultSummaryRowCopy}
                  onClick={handleCopyPassword}
                  title={getMessage('share_result_copy_password')}
                >
                  <CopyIcon />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ShareResult;
