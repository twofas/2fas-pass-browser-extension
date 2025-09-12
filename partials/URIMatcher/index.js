// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { parseDomain, ParseResultType } from 'parse-domain';
import { URL_REGEX, IP_REGEX } from '@/constants/regex';

// FUTURE - Check if TwoFasError works here

/**
* Class for matching and normalizing URIs.
* @module URIMatcher
*/
class URIMatcher {
  static URL_REGEX = URL_REGEX;
  static IP_REGEX = IP_REGEX;
  static TRACKERS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'dclid', 'fbclid', 'msclkid', 'twclid', 'lmsid', 'mc_eid', 'mc_cid']);

  static ADDITIONAL_PROTOCOLS = {
    chrome: new Set(['about:', 'chrome-extension:', 'chrome:']),
    firefox: new Set(['about:', 'moz-extension:']),
    opera: new Set(['about:', 'chrome-extension:', 'chrome:', 'opera:']),
    edge: new Set(['about:', 'chrome-extension:', 'chrome:', 'edge:']),
    safari: new Set(['about:', 'safari-extension:'])
  };

  static PROTOCOL_REGEX = {
    chrome: /^(about|chrome-extension|chrome)?:/i,
    firefox: /^(about|moz-extension)?:/i,
    opera: /^(about|chrome-extension|chrome|opera)?:/i,
    edge: /^(about|chrome-extension|chrome|edge)?:/i,
    safari: /^(about|safari-extension)?:/i
  };

  static BAD_PARSE_DOMAIN_TYPES = new Set([ParseResultType.Invalid, ParseResultType.Reserved, ParseResultType.NotListed]);

  static M_DOMAIN_TYPE = 0;
  static M_HOST_TYPE = 1;
  static M_START_WITH_TYPE = 2;
  static M_EXACT_TYPE = 3;

  static MATCHER_FUNCTIONS = {
    [this.M_DOMAIN_TYPE]: this.baseDomainMatch.bind(this),
    [this.M_HOST_TYPE]: this.hostMatch.bind(this),
    [this.M_START_WITH_TYPE]: this.prefixMatch.bind(this),
    [this.M_EXACT_TYPE]: this.exactMatch.bind(this)
  };

  static BreakException = {};
  
  static isText (text) {
    return typeof text === 'string';
  }

  static hasStandardProtocol (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    url = url.toLowerCase();

    return url.startsWith('http://') || url.startsWith('https://');
  }

  static prependProtocol (url) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    if (this.hasStandardProtocol(url)) {
      return url;
    }

    const cleanedUrl = url.replace(/^[^a-zA-Z0-9]+/, '');

    if (this.PROTOCOL_REGEX[import.meta.env.BROWSER || 'chrome'].test(cleanedUrl)) {
      return cleanedUrl;
    }

    return 'https://' + cleanedUrl;
  }

  static isUrl (url, internalProtocols = false) {
    if (url.length <= 0 || url.length > 2048) {
      return false;
    }

    const hasHttpProtocol = this.hasStandardProtocol(url);

    if (hasHttpProtocol) {
      return true;
    }

    if (this.URL_REGEX.test(url) || this.IP_REGEX.test(url)) {
      let prependedUrl = url;

      if (!hasHttpProtocol) {
        prependedUrl = this.prependProtocol(url);
      }

      try {
        const urlObj = new URL(prependedUrl);
        const parsedDomain = parseDomain(urlObj.hostname);

        if (parsedDomain?.type === ParseResultType.Ip || parsedDomain?.type === ParseResultType.Listed) {
          return true;
        }

        return false;
      } catch {
        if (prependedUrl === url) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      if (internalProtocols) {
        return this.PROTOCOL_REGEX[import.meta.env.BROWSER || 'chrome'].test(url);
      } else {
        return false;
      }
    }
  }

  static isIp (url) { // FUTURE - Check IPv6 when supported
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    if (!IP_REGEX.test(url)) {
      return false;
    }

    let normalizedUrl, urlObj;

    try {
      normalizedUrl = this.normalizeUrl(url);
    } catch {
      return false;
    }

    try {
      urlObj = new URL(normalizedUrl);
    } catch {
      return false;
    }

    if (!urlObj || !urlObj.hostname) {
      return false;
    }

    const parsedDomain = parseDomain(urlObj.hostname);

    if (parsedDomain?.type === ParseResultType.Ip) {
      return true;
    }

    return false;
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
      if (!this.TRACKERS.has(key)) {
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

    // Don't modify protocol-only strings like 'https://' or 'chrome-extension://'
    // Check if the URL is just a protocol (ends with :// or :/)
    if (/^[a-z][a-z0-9+.-]*:\/?\/?$/i.test(url)) {
      return url;
    }

    return url.replace(/\/(\?|#)*$/, '');
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

  static normalizeIDN (url, internalProtocols = false) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }

    if (!this.isUrl(url, internalProtocols)) {
      throw new Error('Parameter is not a valid URL');
    }

    return new URL(url).href;
  }

  static normalizeUrl (url, internalProtocols = false) {
    if (!this.isText(url)) {
      throw new Error('Parameter is not a string');
    }
    
    const trimmed = this.trimText(url);

    if (!this.isUrl(trimmed, internalProtocols)) {
      throw new Error('Parameter is not a valid URL');
    }

    const prepended = this.prependProtocol(trimmed);
    let normalizedIDN;
    
    try {
      normalizedIDN = this.normalizeIDN(prepended, internalProtocols);
    } catch {
      throw new Error('Parameter is not a valid URL');
    }

    const lowerCaseURLWithoutPort = this.getLowerCaseURLWithoutPort(normalizedIDN);
    const urlWithoutTrailingChars = this.removeTrailingChars(lowerCaseURLWithoutPort);

    return urlWithoutTrailingChars;
  }

  static baseDomainMatch (serviceUrl, browserUrl, internalProtocols = false) {
    const normalizedServiceUrl = this.ignoreWWW(this.normalizeUrl(serviceUrl, internalProtocols));
    const normalizedBrowserUrl = this.ignoreWWW(this.normalizeUrl(browserUrl, internalProtocols));

    if (normalizedServiceUrl === normalizedBrowserUrl) {
      return true;
    }

    let serviceUrlObj, browserUrlObj;

    try {
      serviceUrlObj = new URL(normalizedServiceUrl);
      browserUrlObj = new URL(normalizedBrowserUrl);
    } catch {
      return false;
    }

    if (serviceUrlObj.hostname === browserUrlObj.hostname) {
      return true;
    }

    const serviceUrlParsed = parseDomain(serviceUrlObj.hostname);
    const browserUrlParsed = parseDomain(browserUrlObj.hostname);

    if (serviceUrlParsed.type === ParseResultType.Ip || browserUrlParsed.type === ParseResultType.Ip) {
      return serviceUrlParsed.hostname === browserUrlParsed.hostname;
    }

    if (this.BAD_PARSE_DOMAIN_TYPES.has(serviceUrlParsed?.type) || this.BAD_PARSE_DOMAIN_TYPES.has(browserUrlParsed?.type)) {
      if (
        !this.ADDITIONAL_PROTOCOLS[import.meta.env.BROWSER || 'chrome'].has(serviceUrlObj?.protocol) ||
        !this.ADDITIONAL_PROTOCOLS[import.meta.env.BROWSER || 'chrome'].has(browserUrlObj?.protocol)
      ) {
        return false;
      } else {
        return serviceUrlObj?.origin === browserUrlObj?.origin;
      }
    }

    return serviceUrlParsed?.domain === browserUrlParsed?.domain && serviceUrlParsed?.topLevelDomains?.[0] === browserUrlParsed?.topLevelDomains?.[0];
  }

  static hostMatch (serviceUrl, browserUrl, internalProtocols = false) {
    const normalizedServiceUrl = this.ignoreWWW(this.normalizeUrl(serviceUrl, internalProtocols));
    const normalizedBrowserUrl = this.ignoreWWW(this.normalizeUrl(browserUrl, internalProtocols));

    if (normalizedServiceUrl === normalizedBrowserUrl) {
      return true;
    }

    let serviceUrlObj, browserUrlObj;

    try {
      serviceUrlObj = new URL(normalizedServiceUrl);
      browserUrlObj = new URL(normalizedBrowserUrl);
    } catch {
      return false;
    }

    return serviceUrlObj.host === browserUrlObj.host;
  }

  static prefixMatch (serviceUrl, browserUrl, internalProtocols = false) {
    const normalizedServiceUrl = this.ignoreWWW(this.normalizeUrl(serviceUrl, internalProtocols));
    const normalizedBrowserUrl = this.ignoreWWW(this.normalizeUrl(browserUrl, internalProtocols));

    return normalizedBrowserUrl.startsWith(normalizedServiceUrl);
  }

  static exactMatch (serviceUrl, browserUrl, internalProtocols = false) {
    return this.normalizeUrl(serviceUrl, internalProtocols) === this.normalizeUrl(browserUrl, internalProtocols);
  }

  static getMatchedAccounts (services, tabUrl) {
    if (!this.isText(tabUrl)) {
      throw new Error('Parameter tabUrl is not a string');
    }
    
    if (!Array.isArray(services)) {
      throw new Error('Parameter services is not an array');
    }
    
    if (!this.isUrl(tabUrl, true)) {
      throw new Error('Parameter tabUrl is not a valid URL');
    }
    
    if (services.length <= 0) {
      return [];
    }

    const domainCredentials = [];

    try {
      services.forEach(account => {
        if (!account?.uris || !Array.isArray(account?.uris) || account?.uris.length <= 0) {
          return;
        }

        let serviceUrls;

        try {
          serviceUrls = this.recognizeURIs(account.uris, true)?.urls;
        } catch {
          // FUTURE - Log error?
          return;
        }

        if (!serviceUrls || serviceUrls.length <= 0) {
          return;
        }

        serviceUrls.forEach(uri => {
          const { matcher, text } = uri;

          if (
            (!Number.isInteger(matcher) || matcher < URIMatcher.M_DOMAIN_TYPE || matcher > URIMatcher.M_EXACT_TYPE) ||
            (!this.isText(text) || text.length <= 0) ||
            (!this.isUrl(text, true))
          ) {
            return;
          }

          const matcherFunction = this.MATCHER_FUNCTIONS[matcher];
          
          if (matcherFunction && matcherFunction(text, tabUrl, true)) {
            domainCredentials.push(account);
          }
        });
      });
    } catch (e) {
      if (e !== this.BreakException) {
        throw e;
      }
    }

    const map = new Map();
    domainCredentials.forEach(obj => {
      if (!map.has(obj.id)) {
        map.set(obj.id, obj);
      }
    });

    const result = Array.from(map.values());
    map.clear();
    return result;
  }

  static recognizeURIs (uris, internalProtocols = false) {
    if (Array.isArray(uris) === false) {
      throw new Error('Parameter is not an array');
    }

    const response = { urls: [], others: [] };

    if (uris.length <= 0) {
      return response;
    }

    const seenUrls = new Set();
    const seenOthers = new Set();

    try {
      uris.forEach(uri => {
        const { text } = uri;
        
        if (!this.isText(text) || text.length <= 0) {
          throw this.BreakException;
        }

        if (this.isUrl(text, internalProtocols)) {
          try {
            uri.text = this.normalizeUrl(text, internalProtocols);

            if (!seenUrls.has(uri.text)) {
              seenUrls.add(uri.text);
              response.urls.push(uri);
            }
          } catch {
            if (!seenOthers.has(uri.text)) {
              seenOthers.add(uri.text);
              response.others.push(uri);
            }
          }
        } else {
          if (!seenOthers.has(uri.text)) {
            seenOthers.add(uri.text);
            response.others.push(uri);
          }
        }
      });
    } catch (e) {
      if (e !== this.BreakException) {
        throw e;
      }
    } finally {
      seenUrls.clear();
      seenOthers.clear();
    }

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
