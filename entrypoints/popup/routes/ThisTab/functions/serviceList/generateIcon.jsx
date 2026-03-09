// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../components/Item/styles/Item.module.scss';
import { getDomain } from '@/partials/functions';
import { HEX_REGEX } from '@/constants';
import URIMatcher from '@/partials/URIMatcher';
import { parseDomain, ParseResultType } from 'parse-domain';
import visaLight from '@/assets/popup-window/payment-cards/visa_light.svg';
import visaDark from '@/assets/popup-window/payment-cards/visa_dark.svg';
import mc from '@/assets/popup-window/payment-cards/mc.svg';
import amex from '@/assets/popup-window/payment-cards/amex.svg';
import discover from '@/assets/popup-window/payment-cards/discover.svg';
import dinnersLight from '@/assets/popup-window/payment-cards/dinners_light.svg';
import dinnersDark from '@/assets/popup-window/payment-cards/dinners_dark.svg';
import jcb from '@/assets/popup-window/payment-cards/jcb.svg';
import unionPayLight from '@/assets/popup-window/payment-cards/unionpay_light.svg';
import unionPayDark from '@/assets/popup-window/payment-cards/unionpay_dark.svg';
import Skeleton from '../../components/Skeleton';
import SecureNoteIcon from '@/assets/popup-window/items/secure-note.svg?react';
import PaymentCardIcon from '@/assets/popup-window/items/payment-card.svg?react';
import WifiIcon from '@/assets/popup-window/items/wifi.svg?react';
import { memo, useState, useMemo, useCallback } from 'react';

const CARD_ISSUER_ICONS = {
  Visa: { light: visaLight, dark: visaDark },
  MC: { light: mc, dark: mc },
  AMEX: { light: amex, dark: amex },
  Discover: { light: discover, dark: discover },
  DinersClub: { light: dinnersLight, dark: dinnersDark },
  JCB: { light: jcb, dark: jcb },
  UnionPay: { light: unionPayLight, dark: unionPayDark }
};

const handleImgLoad = e => { e.target.style.opacity = 1; };

function LoginIcon ({ item }) {
  const [faviconError, setFaviconError] = useState(false);
  const handleFaviconError = useCallback(() => { setFaviconError(true); }, []);

  const iconData = useMemo(() => {
    const iconType = item?.content?.iconType;
    const hasNoIconType = !iconType && iconType !== 0;

    if (hasNoIconType || iconType === 1) {
      return { type: 'label' };
    }

    if (iconType === 0) {
      let iconDomain = '';
      const iconUriIndex = item?.content?.iconUriIndex || 0;

      try {
        iconDomain = getDomain(item?.content?.uris[iconUriIndex]?.text);
      } catch {
        return { type: 'label' };
      }

      let parsedDomain = null;

      try {
        parsedDomain = parseDomain(iconDomain);
      } catch {}

      if (
        !iconDomain ||
        URIMatcher.isIp(iconDomain) ||
        iconDomain === 'localhost' ||
        parsedDomain?.type === ParseResultType.Invalid ||
        parsedDomain?.type === ParseResultType.Reserved ||
        parsedDomain?.type === ParseResultType.NotListed
      ) {
        return { type: 'label' };
      }

      return { type: 'favicon', url: `https://icon.2fas.com/${iconDomain}/favicon.png` };
    }

    return { type: 'custom', url: item?.content?.customImageUrl };
  }, [item?.content?.iconType, item?.content?.iconUriIndex, item?.content?.uris, item?.content?.customImageUrl]);

  if (faviconError || iconData.type === 'label') {
    const labelColor = (item?.content?.labelColor && HEX_REGEX.test(item?.content?.labelColor)) ? item.content.labelColor : null;

    const iconLabelRef = el => {
      if (el && labelColor) {
        el.style.setProperty('background', labelColor, 'important');
      }
    };

    return (
      <span className={S.iconLabel} ref={iconLabelRef}>
        <span style={{ color: item.textColor }}>{item?.content?.labelText?.toUpperCase() || (item?.content?.name || '').substring(0, 2).toUpperCase() || ''}</span>
      </span>
    );
  }

  return (
    <span className={S.iconImage}>
      <img
        src={iconData.url}
        alt={item?.content?.name}
        className={S.iconImageBlur}
        onError={handleFaviconError}
        onLoad={handleImgLoad}
        loading="lazy"
      />
      <img
        src={iconData.url}
        alt={item?.content?.name}
        onError={handleFaviconError}
        onLoad={handleImgLoad}
        loading="lazy"
      />
    </span>
  );
}

function PaymentCardIconView ({ item }) {
  const cardIssuer = item?.content?.cardIssuer;
  const issuerIcon = CARD_ISSUER_ICONS[cardIssuer];

  if (issuerIcon) {
    return (
      <span className={S.iconPaymentCardImage}>
        <img
          src={issuerIcon.light}
          alt={cardIssuer}
          className={`${S.iconPaymentCardImageBlur} theme-light`}
          onLoad={handleImgLoad}
          loading="lazy"
        />
        <img
          src={issuerIcon.dark}
          alt={cardIssuer}
          className={`${S.iconPaymentCardImageBlur} theme-dark`}
          onLoad={handleImgLoad}
          loading="lazy"
        />
        <img
          src={issuerIcon.light}
          alt={cardIssuer}
          className="theme-light"
          onLoad={handleImgLoad}
          loading="lazy"
        />
        <img
          src={issuerIcon.dark}
          alt={cardIssuer}
          className="theme-dark"
          onLoad={handleImgLoad}
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span className={S.iconPaymentCard}>
      <PaymentCardIcon />
    </span>
  );
}

function ItemIcon ({ item, loading }) {
  if (loading) {
    return <Skeleton type='icon' />;
  }

  switch (item?.contentType) {
    case 'login':
      return <LoginIcon item={item} />;

    case 'secureNote':
      return (
        <span className={S.iconSecureNote}>
          <SecureNoteIcon />
        </span>
      );

    case 'wifi':
      return (
        <span className={S.iconWifi}>
          <WifiIcon />
        </span>
      );

    case 'paymentCard':
      return <PaymentCardIconView item={item} />;

    default: {
      const style = {};

      if (item?.content?.labelColor && HEX_REGEX.test(item?.content?.labelColor)) {
        style.backgroundColor = item.content.labelColor;
      }

      return (
        <span className={S.iconLabel} style={style}>
          <span style={{ color: item.textColor }}>{item?.content?.labelText?.toUpperCase() || (item?.content?.name || '').substring(0, 2).toUpperCase() || ''}</span>
        </span>
      );
    }
  }
}

function arePropsEqual (prevProps, nextProps) {
  return prevProps.item === nextProps.item &&
         prevProps.loading === nextProps.loading;
}

export default memo(ItemIcon, arePropsEqual);
