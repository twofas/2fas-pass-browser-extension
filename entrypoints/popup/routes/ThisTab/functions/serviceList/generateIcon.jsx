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
import jcb from '@/assets/popup-window/payment-cards/jcb.png';
import unionPay from '@/assets/popup-window/payment-cards/unionPay.svg';
import Skeleton from '../../components/Skeleton';
import SecureNoteIcon from '@/assets/popup-window/items/secure-note.svg?react';
import PaymentCardIcon from '@/assets/popup-window/items/payment-card.svg?react';

const CARD_ISSUER_ICONS = {
  Visa: { light: visaLight, dark: visaDark },
  MC: { light: mc, dark: mc },
  AMEX: { light: amex, dark: amex },
  Discover: { light: discover, dark: discover },
  DinersClub: { light: dinnersLight, dark: dinnersDark },
  JCB: { light: jcb, dark: jcb },
  UnionPay: { light: unionPay, dark: unionPay }
};

/** 
* Function to generate the icon for a login item.
* @param {Object} login - The login item.
* @param {boolean} faviconError - Indicates if there was an error loading the favicon.
* @param {function} setFaviconError - Function to set the favicon error state.
* @param {boolean} loading - Indicates if the icon is loading.
* @return {JSX.Element} The generated icon element.
*/
const generateIcon = (item, faviconError, setFaviconError, loading) => {
  const handleFaviconError = () => { setFaviconError(true); };

  if (loading) {
    return <Skeleton type='icon' />;
  }

  switch (item?.constructor?.name) {
    case 'Login': {
      if ((!item?.content?.iconType && item?.content?.iconType !== 0) || item?.content?.iconType === 1 || faviconError) {
        // Label
        const style = {};

        if (item?.content?.labelColor && HEX_REGEX.test(item?.content?.labelColor)) {
          style.backgroundColor = item.content.labelColor;
        }

        return (
          <span className={S.iconLabel} style={style}>
            <span style={{ color: item.content.textColor }}>{item?.content?.labelText?.toUpperCase() || (item?.content?.name || '').substring(0, 2).toUpperCase() || ''}</span>
          </span>
        );
      } else if (item?.content?.iconType === 0) {
        // Default favicon
        let iconDomain = '';
        const iconUriIndex = item?.content?.iconUriIndex || 0;

        try {
          iconDomain = getDomain(item?.content?.uris[iconUriIndex]?.text);
        } catch {
          handleFaviconError();
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
          handleFaviconError();
        }

        const imageUrl = `https://icon.2fas.com/${iconDomain}/favicon.png`;

        return (
          <span className={S.iconImage}>
            <img
              src={imageUrl}
              alt={item?.content?.name}
              className={S.iconImageBlur}
              onError={handleFaviconError}
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
            <img
              src={imageUrl}
              alt={item?.content?.name}
              onError={handleFaviconError}
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
          </span>
        );
      } else {
        // Custom
        return (
          <span className={S.iconImage}>
            <img
              src={item?.content?.customImageUrl}
              alt={item?.content?.name}
              className={S.iconImageBlur}
              onError={handleFaviconError}
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
            <img
              src={item?.content?.customImageUrl}
              alt={item?.content?.name}
              onError={handleFaviconError}
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
          </span>
        );
      }
    }

    case 'SecureNote': {
      return (
        <span className={S.iconSecureNote}>
          <SecureNoteIcon />
        </span>
      );
    }

    case 'PaymentCard': {
      const cardIssuer = item?.content?.cardIssuer;
      const issuerIcon = CARD_ISSUER_ICONS[cardIssuer];

      if (issuerIcon) {
        return (
          <span className={S.iconPaymentCardImage}>
            <img
              src={issuerIcon.light}
              alt={cardIssuer}
              className={`${S.iconPaymentCardImageBlur} theme-light`}
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
            <img
              src={issuerIcon.dark}
              alt={cardIssuer}
              className={`${S.iconPaymentCardImageBlur} theme-dark`}
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
            <img
              src={issuerIcon.light}
              alt={cardIssuer}
              className="theme-light"
              onLoad={el => { el.target.style.opacity = 1; }}
              loading="lazy"
            />
            <img
              src={issuerIcon.dark}
              alt={cardIssuer}
              className="theme-dark"
              onLoad={el => { el.target.style.opacity = 1; }}
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

    default: {
      // Label
      const style = {};

      if (item?.content?.labelColor && HEX_REGEX.test(item?.content?.labelColor)) {
        style.backgroundColor = item.content.labelColor;
      }

      return (
        <span className={S.iconLabel} style={style}>
          <span style={{ color: item.content.textColor }}>{item?.content?.labelText?.toUpperCase() || (item?.content?.name || '').substring(0, 2).toUpperCase() || ''}</span>
        </span>
      );
    }
  }
};

export default generateIcon;
