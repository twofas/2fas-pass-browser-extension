// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import { lazy } from 'react';
import getDomain from '@/partials/functions/getDomain';
import getTextColor from '@/partials/functions/getTextColor';
import { HEX_REGEX } from '@/constants/regex';
import URIMatcher from '@/partials/URIMatcher';
import { parseDomain, ParseResultType } from 'parse-domain';

const Skeleton = lazy(() => import('../../components/Skeleton'));

/** 
* Function to generate the icon for a login item.
* @param {Object} login - The login item.
* @param {boolean} faviconError - Indicates if there was an error loading the favicon.
* @param {function} setFaviconError - Function to set the favicon error state.
* @param {boolean} loading - Indicates if the icon is loading.
* @return {JSX.Element} The generated icon element.
*/
const generateIcon = (login, faviconError, setFaviconError, loading) => {
  const handleFaviconError = () => { setFaviconError(true); };

  if (loading) {
    return <Skeleton />;
  } else if ((!login?.iconType && login?.iconType !== 0) || login?.iconType === 1 || faviconError) {
    // Label
    const style = {};

    if (login?.labelColor && HEX_REGEX.test(login.labelColor)) {
      style.backgroundColor = login.labelColor;
    }

    return (
      <span className={S.iconLabel} style={style}>
        <span style={{ color: getTextColor(login.labelColor) }}>{login?.labelText?.toUpperCase() || login?.name?.substring(0, 2).toUpperCase() || ''}</span>
      </span>
    );
  } else if (login?.iconType === 0) {
    // Default favicon
    let iconDomain = '';
    const iconUriIndex = login?.iconUriIndex || 0;

    try {
      iconDomain = getDomain(login?.uris[iconUriIndex]?.text);
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
          alt={login?.name}
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
          src={login?.customImageUrl}
          alt={login?.name}
          onError={handleFaviconError}
          onLoad={el => { el.target.style.opacity = 1; }}
          loading="lazy"
        />
      </span>
    );
  }
};

export default generateIcon;
