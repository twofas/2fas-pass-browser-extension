// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { parseDomain, ParseResultType } from 'parse-domain';
import { PROTOCOL_REGEX, URL_REGEX, IP_REGEX, LOCAL_DOMAIN_WO_TLD_REGEX, ANDROID_BUNDLE_REGEX } from '@/constants/regex';

// FUTURE - Check if TwoFasError works here

/**
* Class for matching and normalizing URIs.
* @module URIMatcher
*/
class URIMatcher {
  static PROTOCOL_REGEX = PROTOCOL_REGEX;
  static URL_REGEX = URL_REGEX;
  static IP_REGEX = IP_REGEX;
  static LOCAL_DOMAIN_WO_TLD_REGEX = LOCAL_DOMAIN_WO_TLD_REGEX;
  static ANDROID_BUNDLE_REGEX = ANDROID_BUNDLE_REGEX;
  static TRACKERS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'dclid', 'fbclid', 'msclkid', 'twclid', 'lmsid', 'mc_eid', 'mc_cid'];

  static M_DOMAIN_TYPE = 0;
  static M_HOST_TYPE = 1;
  static M_START_WITH_TYPE = 2;
  static M_EXACT_TYPE = 3;

  static BreakException = {};
  
  static isText (text) {
    if (typeof text === 'string' || text instanceof String) {
      return true;
    }

    return false;
  }

  static prependProtocol (url) {
    if (!this.PROTOCOL_REGEX.test(url)) {
      url = 'https://' + url;
    }
    
    return url;
  }

  static isUrl (url) {
    if (
      (!this.URL_REGEX.test(url) &&
      !this.IP_REGEX.test(url) &&
      !this.LOCAL_DOMAIN_WO_TLD_REGEX.test(url)) ||
      this.ANDROID_BUNDLE_REGEX.test(url)
    ) {
      return false;
    }

    if (!this.PROTOCOL_REGEX.test(url)) {
      const prependedURL = this.prependProtocol(url);
      let normalizedIDN, normalizedIDNObj;
      
      try { // For bad TLD like .123
        normalizedIDN = this.normalizeIDN(prependedURL);
        normalizedIDNObj = new URL(normalizedIDN);
      } catch (e) {
        return false;
      }

      const parsedUrl = parseDomain(normalizedIDNObj.hostname);

      if (parsedUrl?.type === ParseResultType.Ip) {
        return true;
      }

      if (parsedUrl?.type === ParseResultType.Listed) {
        try {
          new URL(prependedURL); // eslint-disable-line no-new
          return true;
        } catch (e) {
          return false;
        }
      } else {
        return false;
      }
    } else {
      try {
        new URL(url); // eslint-disable-line no-new
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  static isIp (url) { // FUTURE - Add tests (+ check IPv6)
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    return this.IP_REGEX.test(url);
  }

  static trimText (text) {
    if (!this.isText(text) || !text.trim || typeof text?.trim !== 'function') {
      throw new Error('Parameter is not a string');
    }

    return text.trim();
  }

  static ignoreWWW (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    return url.replace(/(https?:\/\/)(www\.)/, '$1');
  }

  static cleanURLParameters (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    if (!this.isUrl(url)) {
      throw new Error('Parameter is not a valid URL');
    }

    let urlObj;

    try {
      urlObj = new URL(url);
    } catch {
      throw new Error('Parameter is not a valid URL');
    }

    const searchParams = new URLSearchParams(urlObj.search);
    const cleanedParams = {};

    searchParams.forEach((value, key) => {
      if (!this.TRACKERS.includes(key)) {
        cleanedParams[key] = value;
      }
    });

    const cleanedUrl = new URL(urlObj.origin + urlObj.pathname);
    cleanedUrl.search = new URLSearchParams(cleanedParams).toString();

    return this.normalizeIDN(cleanedUrl.href);
  }

  static removeTrailingChars (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    return url.replace(/\/(\?|\#)*$/, '');
  }

  static getLowerCaseURLWithoutPort (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    let urlObj;

    try {
      urlObj = new URL(url);
    } catch {
      throw new Error('Parameter is not a valid URL');
    }

    const { hostname, protocol, port, pathname, search, hash } = urlObj;
    const lowerCaseHostname = hostname?.toLowerCase();

    return `${protocol}//${lowerCaseHostname}${port ? `:${port}` : ''}${pathname}${search}${hash}`;
  }

  // static urlencode (url) {
  //   if (!this.isText(url)) {
  //     throw new Error('Parameter is not a string');
  //   }

  //   let urlObj;

  //   try {
  //     urlObj = new URL(url);
  //   } catch {
  //     throw new Error('Parameter is not a valid URL');
  //   }

  //   const { protocol, hostname, port, searchParams } = urlObj;
  //   let { pathname, search, hash } = urlObj;

  //   if (pathname) {
  //     pathname = '/' + encodeURIComponent(decodeURIComponent(pathname.substring(1)));
  //   }

  //   if (searchParams.size > 0) {
  //     searchParams.forEach((value, key) => {
  //       searchParams.set(key, encodeURIComponent(decodeURIComponent(value)));
  //     });

  //     search = '?' + searchParams.toString();

  //     if (search.substring(search.length - 1, search.length) === '=') {
  //       search = search.substring(0, search.length - 1);
  //     }
  //   }

  //   if (hash) {
  //     if (hash !== '#?') {
  //       hash = '#' + encodeURIComponent(decodeURIComponent(hash.substring(1)));
  //     }
  //   }

  //   if (pathname === '/' && !search && !hash) {
  //     pathname = '';
  //   }

  //   return `${protocol}//${hostname}${port ? `:${port}` : ''}${pathname}${search}${hash}`;
  // }

  static normalizeIDN (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    if (!this.isUrl(url)) {
      throw new Error('Parameter is not a valid URL');
    }

    return new URL(url).href;
  }

  static normalizeUrl (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }
    
    const trimmed = this.trimText(url);

    if (!this.isUrl(trimmed)) {
      throw new Error('Parameter is not a valid URL');
    }

    const prepended = this.prependProtocol(trimmed);
    const normalizedIDN = this.normalizeIDN(prepended);

    const lowerCaseURLWithoutPort = this.getLowerCaseURLWithoutPort(normalizedIDN);
    const urlWithoutTrailingChars = this.removeTrailingChars(lowerCaseURLWithoutPort);

    return urlWithoutTrailingChars;
  }

  static baseDomainMatch (serviceUrl, browserUrl) {
    serviceUrl = this.normalizeUrl(serviceUrl);
    browserUrl = this.normalizeUrl(browserUrl);

    serviceUrl = this.ignoreWWW(serviceUrl);
    browserUrl = this.ignoreWWW(browserUrl);

    const serviceUrlObj = new URL(serviceUrl);
    const browserUrlObj = new URL(browserUrl);

    const serviceUrlParsed = parseDomain(serviceUrlObj.hostname);
    const browserUrlParsed = parseDomain(browserUrlObj.hostname);

    if (serviceUrlParsed.type === ParseResultType.Ip || browserUrlParsed.type === ParseResultType.Ip) {
      return serviceUrlParsed.hostname === browserUrlParsed.hostname;
    }

    return serviceUrlParsed.domain === browserUrlParsed.domain && serviceUrlParsed.topLevelDomains[0] === browserUrlParsed.topLevelDomains[0];
  }

  static hostMatch (serviceUrl, browserUrl) {
    serviceUrl = this.normalizeUrl(serviceUrl);
    browserUrl = this.normalizeUrl(browserUrl);

    serviceUrl = this.ignoreWWW(serviceUrl);
    browserUrl = this.ignoreWWW(browserUrl);

    const serviceUrlObj = new URL(serviceUrl);
    const browserUrlObj = new URL(browserUrl);

    return serviceUrlObj.host === browserUrlObj.host;
  }

  static prefixMatch (serviceUrl, browserUrl) {
    serviceUrl = this.normalizeUrl(serviceUrl);
    browserUrl = this.normalizeUrl(browserUrl);

    serviceUrl = this.ignoreWWW(serviceUrl);
    browserUrl = this.ignoreWWW(browserUrl);

    return browserUrl.startsWith(serviceUrl);
  }

  static exactMatch (serviceUrl, browserUrl) {
    serviceUrl = this.normalizeUrl(serviceUrl);
    browserUrl = this.normalizeUrl(browserUrl);

    return serviceUrl === browserUrl;
  }

  static getMatchedAccounts (services, tabUrl) {
    if (!this.isText(tabUrl)) {
      throw new Error('Parameter tabUrl is not a string');
    }

    if (!Array.isArray(services)) {
      throw new Error('Parameter services is not an array');
    }

    if (!this.isUrl(tabUrl)) {
      throw new Error('Parameter tabUrl is not a valid URL');
    }

    if (services.length <= 0) {
      return [];
    }
    
    try {
      tabUrl = this.normalizeUrl(tabUrl);
    } catch {
      return [];
    }

    const domainCredentials = [];

    services.forEach(account => {
      if (!account?.uris || !Array.isArray(account?.uris) || account?.uris.length <= 0) {
        return [];
      }

      const serviceUrls = this.recognizeURIs(account.uris)?.urls;

      if (!serviceUrls || serviceUrls.length <= 0) {
        return [];
      }

      try {
        serviceUrls.forEach(uri => {
          const matcher = uri?.matcher;
          const text = uri?.text;

          if (
            (!Number.isInteger(matcher) || matcher < URIMatcher.M_DOMAIN_TYPE || matcher > URIMatcher.M_EXACT_TYPE) ||
            (!this.isText(text) || text.length <= 0) ||
            (!this.isUrl(text))
          ) {
            throw this.BreakException;
          }

          const serviceUrl = this.normalizeUrl(text);

          switch (matcher) {
            case this.M_DOMAIN_TYPE: {
              if (this.baseDomainMatch(serviceUrl, tabUrl)) {
                domainCredentials.push(account);
              }
  
              break;
            }
  
            case this.M_HOST_TYPE: {
              if (this.hostMatch(serviceUrl, tabUrl)) {
                domainCredentials.push(account);
              }
  
              break;
            }
  
            case this.M_START_WITH_TYPE: {
              if (this.prefixMatch(serviceUrl, tabUrl)) {
                domainCredentials.push(account);
              }

              break;
            }
  
            case this.M_EXACT_TYPE: {
              if (this.exactMatch(serviceUrl, tabUrl)) {
                domainCredentials.push(account);
              }
              
              break;
            }
  
            default: {
              break;
            }
          }
        });
      } catch (e) {
        if (e !== this.BreakException) {
          throw e;
        }
      }
    });

    const map = new Map();
    domainCredentials.forEach(obj => {
      if (!map.has(obj.id)) {
        map.set(obj.id, obj);
      }
    });

    return Array.from(map.values());
  }

  static recognizeURIs (uris) {
    if (Array.isArray(uris) === false) {
      throw new Error('Parameter is not an array');
    }

    const response = { urls: [], others: [] };

    if (uris.length <= 0) {
      return response;
    }

    try {
      uris.forEach(uri => {
        const { text } = uri;
        
        if (!this.isText(text) || text.length <= 0) {
          throw this.BreakException;
        }

        if (this.isUrl(text)) {
          uri.text = this.normalizeUrl(text);
          response.urls.push(uri);
        } else {
          response.others.push(uri);
        }
      });
    } catch (e) {
      if (e !== this.BreakException) {
        throw e;
      }
    }

    // Remove duplicates
    response.urls = response.urls.filter((value, index, self) => self.findIndex(t => t.text === value.text) === index);
    response.others = response.others.filter((value, index, self) => self.findIndex(t => t.text === value.text) === index);

    return response;
  }

  static generateDocumentUrlPatterns (uri) {
    if (
      !uri ||
      typeof uri !== 'object' ||
      Array.isArray(uri)
    ) {
      throw new Error('Parameter is not an object');
    }

    if (
      !uri?.text ||
      !Number.isInteger(uri?.matcher) ||
      uri.matcher < URIMatcher.M_DOMAIN_TYPE || uri.matcher > URIMatcher.M_EXACT_TYPE
    ) {
      throw new Error('Parameter is not a valid URI object');
    }

    if (!this.isText(uri.text) || uri.text.length <= 0) {
      return [];
    }

    const { text, matcher } = uri;
    const normalizedUrl = this.normalizeUrl(text);
    const normalizedUrlWithoutWWW = this.ignoreWWW(normalizedUrl);
    const urlObj = new URL(normalizedUrlWithoutWWW);
    const parsedUrl = parseDomain(urlObj.hostname);

    switch (matcher) {
      case this.M_DOMAIN_TYPE: {
        if (parsedUrl?.type === ParseResultType.Ip) {
          return [
            `http://${parsedUrl.hostname}/`,
            `http://${parsedUrl.hostname}/*`,
          ];
        }

        if (parsedUrl.hostname === 'localhost') {
          return [
            `http://${parsedUrl.hostname}/`,
            `http://${parsedUrl.hostname}/*`,
            `http://*.${parsedUrl.hostname}/`,
            `http://*.${parsedUrl.hostname}/*`
          ];
        }

        return [
          `*://${parsedUrl.hostname}/`,
          `*://${parsedUrl.hostname}/*`,
          `*://*.${parsedUrl.hostname}/`,
          `*://*.${parsedUrl.hostname}/*`
        ];
      }

      case this.M_HOST_TYPE: {
        if (parsedUrl?.type === ParseResultType.Ip || parsedUrl?.hostname === 'localhost') {
          if (!urlObj?.port || urlObj?.port.length <= 0) {
            return [`http://${parsedUrl.hostname}/`, `http://${parsedUrl.hostname}/*`];
          }

          return [
            `http://${parsedUrl.hostname}${urlObj.port ? `:${urlObj.port}` : ''}/`,
            `http://${parsedUrl.hostname}${urlObj.port ? `:${urlObj.port}` : ''}/*`
          ];
        }

        return [
          `*://${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}/`,
          `*://${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}/*`
        ];
      }

      case this.M_START_WITH_TYPE: {
        if (parsedUrl?.type === ParseResultType.Ip) {
          return [`http://${parsedUrl.hostname}${urlObj.port ? `:${urlObj.port}` : ''}/*`];
        }

        return [`${normalizedUrlWithoutWWW}/*`];
      }

      case this.M_EXACT_TYPE: {
        if (parsedUrl?.type === ParseResultType.Ip) {
          return [`http://${parsedUrl.hostname}${urlObj.port ? `:${urlObj.port}` : ''}${urlObj.pathname === '/' ? '/' : `${urlObj.pathname}/`}`];
        }

        return [`${normalizedUrlWithoutWWW}/`];
      }

      default: {
        return [];
      }
    }
  }
}

export default URIMatcher;
