// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import URIMatcher from './index.js';
import { assert, expect, describe, it } from 'vitest';

describe('URIMatcher', () => {
  // Base methods
  describe('isText', () => {
    it('should return true if the text is a string', () => {
      assert.isTrue(URIMatcher.isText(''));
      assert.isTrue(URIMatcher.isText('string'));
      assert.isTrue(URIMatcher.isText(String('string')));
      assert.isFalse(URIMatcher.isText(123));
      assert.isFalse(URIMatcher.isText(123.2222));
      assert.isFalse(URIMatcher.isText({}));
      assert.isFalse(URIMatcher.isText([]));
      assert.isFalse(URIMatcher.isText(null));
      assert.isFalse(URIMatcher.isText(undefined));
    });
  });

  describe('prependProtocol', () => {
    it('should return the URL with the protocol prepended if not present', () => {
      assert.equal(URIMatcher.prependProtocol('www.domain.com'), 'https://www.domain.com');
      assert.equal(URIMatcher.prependProtocol('http://www.domain.com'), 'http://www.domain.com');
      assert.equal(URIMatcher.prependProtocol('https://www.domain.com'), 'https://www.domain.com');
      assert.equal(URIMatcher.prependProtocol('http://domain.com'), 'http://domain.com');
      assert.equal(URIMatcher.prependProtocol('127.0.0.1'), 'https://127.0.0.1');
    });
  });

  describe('isUrl', () => {
    it('should return true if the text is a URL', () => {
      assert.isTrue(URIMatcher.isUrl('https://www.domain.com'));
      assert.isTrue(URIMatcher.isUrl('http://www.domain.com'));
      assert.isTrue(URIMatcher.isUrl('https://domain.com'));
      assert.isTrue(URIMatcher.isUrl('http://domain.com'));
      assert.isTrue(URIMatcher.isUrl('www.domain.com'));
      assert.isTrue(URIMatcher.isUrl('domain.com'));
      assert.isTrue(URIMatcher.isUrl('http://räksmörgås.josefsson.org/'));
      assert.isFalse(URIMatcher.isUrl('https://www.domain.123')); // FUTURE - 123 is NOT VALID!
      assert.isFalse(URIMatcher.isUrl('http://www.domain.123'));
      assert.isFalse(URIMatcher.isUrl('https://domain.123'));
      assert.isFalse(URIMatcher.isUrl('http://domain.123'));
      assert.isFalse(URIMatcher.isUrl('www.domain.123'));
      assert.isFalse(URIMatcher.isUrl('domain.123'));
      assert.isFalse(URIMatcher.isUrl('com.twofasapp'));
      assert.isFalse(URIMatcher.isUrl('localhost'));
      assert.isFalse(URIMatcher.isUrl('localhost/'));
      assert.isTrue(URIMatcher.isUrl('http://localhost'));
      assert.isTrue(URIMatcher.isUrl('http://localhost/'));
      assert.isTrue(URIMatcher.isUrl('http://localhost:3000'));
      assert.isTrue(URIMatcher.isUrl('http://localhost:3000/'));
      assert.isTrue(URIMatcher.isUrl('127.0.0.1'));
      assert.isTrue(URIMatcher.isUrl('http://127.0.0.1'));
      assert.isTrue(URIMatcher.isUrl('127.0.0.1:3000'));
      assert.isTrue(URIMatcher.isUrl('https://127.0.0.1:3000'));
      assert.isTrue(URIMatcher.isUrl('local.dev')); // DEV IS VALID TLD
      assert.isTrue(URIMatcher.isUrl('http://local.dev'));
      assert.isTrue(URIMatcher.isUrl('https://local.dev'));
      assert.isTrue(URIMatcher.isUrl('https://local.dev:8080'));
      assert.isFalse(URIMatcher.isUrl('home.internal'));
      assert.isTrue(URIMatcher.isUrl('http://home.internal'));
      assert.isTrue(URIMatcher.isUrl('https://home.internal'));
      assert.isFalse(URIMatcher.isUrl('2fas.test'));
      assert.isTrue(URIMatcher.isUrl('http://2fas.test'));
      assert.isTrue(URIMatcher.isUrl('https://2fas.test'));
      assert.isFalse(URIMatcher.isUrl('2fas.local'));
      assert.isTrue(URIMatcher.isUrl('http://2fas.local'));
      assert.isTrue(URIMatcher.isUrl('https://2fas.local'));
      assert.isFalse(URIMatcher.isUrl('xyz'));
      assert.isTrue(URIMatcher.isUrl('http://xyz'));
    });
  });

  describe('trimText', () => {
    it('should return the trimmed text', () => {
      assert.strictEqual(URIMatcher.trimText('  text  '), 'text');
      assert.strictEqual(URIMatcher.trimText('text  '), 'text');
      assert.strictEqual(URIMatcher.trimText('  text'), 'text');
      assert.strictEqual(URIMatcher.trimText('text'), 'text');
      expect(() => URIMatcher.trimText(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.trimText({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.trimText(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.trimText(undefined)).to.throw('Parameter is not a string');
    });
  });

  describe('ignoreWWW', () => {
    it('should return the URL without www', () => {
      assert.strictEqual(URIMatcher.ignoreWWW('https://www.domain.com'), 'https://domain.com');
      assert.strictEqual(URIMatcher.ignoreWWW('http://www.domain.com'), 'http://domain.com');
      assert.strictEqual(URIMatcher.ignoreWWW('https://domain.com'), 'https://domain.com');
      assert.strictEqual(URIMatcher.ignoreWWW('http://domain.com'), 'http://domain.com');
      assert.strictEqual(URIMatcher.ignoreWWW(''), '');
      expect(() => URIMatcher.ignoreWWW(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.ignoreWWW({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.ignoreWWW(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.ignoreWWW(undefined)).to.throw('Parameter is not a string');
    });
  });

  describe('cleanURLParameters', () => {
    it('should return the cleaned URL without tracker parameters', () => {
      assert.strictEqual(URIMatcher.cleanURLParameters('https://www.domain.com/about-us/?moj_param=4&utm_source=google&utm_medium=profile&utm_campaign=gmb&test=true'), 'https://www.domain.com/about-us/?moj_param=4&test=true');
      assert.strictEqual(URIMatcher.cleanURLParameters('https://www.domain.com/about-us/?utm_source=google&utm_medium=profile&utm_campaign=gmb'), 'https://www.domain.com/about-us/');
      assert.strictEqual(URIMatcher.cleanURLParameters('https://localhost/about-us/?utm_source=google&utm_medium=profile&utm_campaign=gmb'), 'https://localhost/about-us/');
      expect(() => URIMatcher.cleanURLParameters(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.cleanURLParameters({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.cleanURLParameters(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.cleanURLParameters(undefined)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.cleanURLParameters('test')).to.throw('Parameter is not a valid URL');
    });
  });

  describe('removeTrailingChars', () => {
    it('should return the URL without trailing unnecessary characters', () => {
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/about-us/'), 'https://www.domain.com/about-us');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/?'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/#'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/?#'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/#?'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/?test'), 'https://www.domain.com/?test');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://www.domain.com/#test'), 'https://www.domain.com/#test');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://localhost/?'), 'https://localhost');
      assert.strictEqual(URIMatcher.removeTrailingChars('https://localhost:3000/?'), 'https://localhost:3000');
      assert.strictEqual(URIMatcher.removeTrailingChars(''), '');
      expect(() => URIMatcher.removeTrailingChars(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.removeTrailingChars({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.removeTrailingChars(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.removeTrailingChars(undefined)).to.throw('Parameter is not a string');
    });
  });

  describe('getLowerCaseURLWithoutPort', () => {
    it('should return the URL with the hostname in lowercase and without port if is matching with protocol', () => {
      assert.strictEqual(URIMatcher.getLowerCaseURLWithoutPort('https://www.DOMAIN.com'), 'https://www.domain.com/');
      assert.strictEqual(URIMatcher.getLowerCaseURLWithoutPort('https://www.domain.com'), 'https://www.domain.com/');
      assert.strictEqual(URIMatcher.getLowerCaseURLWithoutPort('https://WWW.google.com:443/?abc=ABC'), 'https://www.google.com/?abc=ABC');
      assert.strictEqual(URIMatcher.getLowerCaseURLWithoutPort('httpS://google.com/?abc=ABC'), 'https://google.com/?abc=ABC');
      assert.strictEqual(URIMatcher.getLowerCaseURLWithoutPort('httpS://google.com/?abc=ABC '), 'https://google.com/?abc=ABC');
      expect(() => URIMatcher.getLowerCaseURLWithoutPort('')).to.throw('Parameter is not a valid URL');
      expect(() => URIMatcher.getLowerCaseURLWithoutPort(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.getLowerCaseURLWithoutPort({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.getLowerCaseURLWithoutPort(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.getLowerCaseURLWithoutPort(undefined)).to.throw('Parameter is not a string');
    });
  });

  // describe('urlencode', () => {
  //   it('should return the URL encoded', () => {
  //     assert.strictEqual(URIMatcher.urlencode('http://example.com/foo%2b'), 'http://example.com/foo%2B');
  //     assert.strictEqual(URIMatcher.urlencode('http://example.com/%7Efoo'), 'http://example.com/~foo');
  //     assert.strictEqual(URIMatcher.urlencode('https://peregrinus.pl/pl/lublin'), 'https://peregrinus.pl/pl/lublin');
  //     expect(() => URIMatcher.getLowerCaseURLWithoutPort('')).to.throw('Parameter is not a valid URL');
  //     expect(() => URIMatcher.getLowerCaseURLWithoutPort(123)).to.throw('Parameter is not a string');
  //     expect(() => URIMatcher.getLowerCaseURLWithoutPort({})).to.throw('Parameter is not a string');
  //     expect(() => URIMatcher.getLowerCaseURLWithoutPort(null)).to.throw('Parameter is not a string');
  //     expect(() => URIMatcher.getLowerCaseURLWithoutPort(undefined)).to.throw('Parameter is not a string');
  //   });
  // });

  describe('normalizeIDN', () => {
    it('should return the URL with the IDN domain normalized', () => {
      assert.strictEqual(URIMatcher.normalizeIDN('http://räksmörgås.josefsson.org/'), 'http://xn--rksmrgs-5wao1o.josefsson.org/');
      assert.strictEqual(URIMatcher.normalizeIDN('http://納豆.w3.mag.keio.ac.jp/'), 'http://xn--99zt52a.w3.mag.keio.ac.jp/');
      assert.strictEqual(URIMatcher.normalizeIDN('https://häuser.com/'), 'https://xn--huser-gra.com/');
      assert.strictEqual(URIMatcher.normalizeIDN('https://grüsse.com/'), 'https://xn--grsse-lva.com/');
      assert.strictEqual(URIMatcher.normalizeIDN('https://足球.com/'), 'https://xn--5eyx16c.com/');
      assert.strictEqual(URIMatcher.normalizeIDN('https://футбольный.com/'), 'https://xn--90aqfidwgh3ei.com/');
      assert.strictEqual(URIMatcher.normalizeIDN('https://localhost'), 'https://localhost/');
      assert.strictEqual(URIMatcher.normalizeIDN('https://127.0.0.1'), 'https://127.0.0.1/');
      expect(() => URIMatcher.normalizeIDN('')).to.throw('Parameter is not a valid URL');
      expect(() => URIMatcher.normalizeIDN(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeIDN({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeIDN(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeIDN(undefined)).to.throw('Parameter is not a string');
    });
  });

  describe('normalizeUrl', () => {
    it('should return the normalized URL', () => {
      expect(() => URIMatcher.normalizeUrl(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeUrl([])).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeUrl({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeUrl(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeUrl(undefined)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.normalizeUrl('')).to.throw('Parameter is not a valid URL');
      expect(() => URIMatcher.normalizeUrl('com.twofasapp')).to.throw('Parameter is not a valid URL');
      expect(() => URIMatcher.normalizeUrl('xyz')).to.throw('Parameter is not a valid URL');
      assert.strictEqual(URIMatcher.normalizeUrl('2fas.com'), 'https://2fas.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com '), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl(' https://www.domain.com '), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('    https://www.domain.com    '), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('http://räksmörgås.josefsson.org'), 'http://xn--rksmrgs-5wao1o.josefsson.org');
      assert.strictEqual(URIMatcher.normalizeUrl('http://納豆.w3.mag.keio.ac.jp'), 'http://xn--99zt52a.w3.mag.keio.ac.jp');
      assert.strictEqual(URIMatcher.normalizeUrl('https://häuser.com'), 'https://xn--huser-gra.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://grüsse.com'), 'https://xn--grsse-lva.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://足球.com'), 'https://xn--5eyx16c.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://футбольный.com'), 'https://xn--90aqfidwgh3ei.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.DOMAIN.com'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl(' https://www.domain.com '), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://WWW.google.com:443/?abc=ABC'), 'https://www.google.com/?abc=ABC');
      assert.strictEqual(URIMatcher.normalizeUrl('httpS://google.com/?abc=ABC'), 'https://google.com/?abc=ABC');
      assert.strictEqual(URIMatcher.normalizeUrl('httpS://google.com/?abc=ABC '), 'https://google.com/?abc=ABC');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/about-us/'), 'https://www.domain.com/about-us');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/?'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/#'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/?#'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/#?'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/#?#?#?#?#?#?'), 'https://www.domain.com');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/?test'), 'https://www.domain.com/?test');
      assert.strictEqual(URIMatcher.normalizeUrl('https://www.domain.com/#test'), 'https://www.domain.com/#test');
      assert.strictEqual(URIMatcher.normalizeUrl('http://example.com/foo%2b'), 'http://example.com/foo%2b');
      assert.strictEqual(URIMatcher.normalizeUrl('http://example.com/%7Efoo'), 'http://example.com/%7Efoo');
      assert.strictEqual(URIMatcher.normalizeUrl('http://localhost/%7Efoo'), 'http://localhost/%7Efoo');
      assert.strictEqual(URIMatcher.normalizeUrl('http://localhost:3000/%7Efoo'), 'http://localhost:3000/%7Efoo');
      assert.strictEqual(URIMatcher.normalizeUrl('http://127.0.0.1/%7Efoo'), 'http://127.0.0.1/%7Efoo');
      assert.strictEqual(URIMatcher.normalizeUrl('http://127.0.0.1:3000/%7Efoo'), 'http://127.0.0.1:3000/%7Efoo');
      
      // All-in-one tests
      assert.strictEqual(URIMatcher.normalizeUrl('   http://räksmörgås.josefsson.org   '), 'http://xn--rksmrgs-5wao1o.josefsson.org');
      assert.strictEqual(URIMatcher.normalizeUrl(' https://häuseR.com/?'), 'https://xn--huser-gra.com');
      assert.strictEqual(URIMatcher.normalizeUrl(' https://футбольный.com:443/?abc=ABC'), 'https://xn--90aqfidwgh3ei.com/?abc=ABC');
      assert.strictEqual(URIMatcher.normalizeUrl(' httpS://футбольный.com:443/?abc=ABC'), 'https://xn--90aqfidwgh3ei.com/?abc=ABC');
      assert.strictEqual(URIMatcher.normalizeUrl(' https://häuseR.com/?#'), 'https://xn--huser-gra.com');
      assert.strictEqual(URIMatcher.normalizeUrl(' http://example.com/%7Efoo/?#'), 'http://example.com/%7Efoo');

      // IP test
      assert.strictEqual(URIMatcher.normalizeUrl('127.0.0.1'), 'https://127.0.0.1');
    });
  });

  // Matchers
  describe('baseDomainMatch', () => {
    it('should return true if the base domain is matching', () => {
      // Domain 1
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'http://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://www.domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://domain.net/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/my.aspx?error=999', 'https://domain.com:1234/'));

      // Domain 2
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'http://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://www.domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://domain.net/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com/en/', 'https://domain.com:1234/'));

      // Domain 3
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'http://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://www.domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://domain.net/'));
      assert.isTrue(URIMatcher.baseDomainMatch('https://www.domain.com', 'https://domain.com:1234/'));

      // Domain 4
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'http://www.domain.com/en/'));
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://www.domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://domain.com/'));
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://domain.net/'));
      assert.isTrue(URIMatcher.baseDomainMatch('http://www.domain.com', 'https://domain.com:1234/'));

      // IP
      assert.isTrue(URIMatcher.baseDomainMatch('10.10.10.10', 'http://10.10.10.10'));
      assert.isTrue(URIMatcher.baseDomainMatch('10.10.10.10', 'https://10.10.10.10'));

      // Wrong domains
      expect(() => URIMatcher.baseDomainMatch(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.baseDomainMatch([])).to.throw('Parameter is not a string');
      expect(() => URIMatcher.baseDomainMatch({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.baseDomainMatch(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.baseDomainMatch(undefined)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.baseDomainMatch('')).to.throw('Parameter is not a valid URL');
    });
  });

  describe('hostMatch', () => {
    it('should return true if the host is matching', () => {
      // Domain 1
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.sd.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://sd.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://sd.domain.com:1234/'));
      assert.isTrue(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'http://www.sd.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://domain.com/'));
      assert.isTrue(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://domain.net/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://domain.com:1234/'));

      // Domain 2
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://www.sd.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://sd.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://sd.domain.com:1234/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'http://www.sd.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://domain.net/'));
      assert.isFalse(URIMatcher.hostMatch('https://www.sd.domain.com:1234/en/', 'https://domain.com:1234/'));

      // Domain 3
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://www.sd.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://sd.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://sd.domain.com:1234/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'http://www.sd.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://domain.net/'));
      assert.isFalse(URIMatcher.hostMatch('http://sd.domain.com:1234', 'https://domain.com:1234/'));

      // IP
      assert.isTrue(URIMatcher.hostMatch('10.10.10.10', 'http://10.10.10.10'));
      assert.isTrue(URIMatcher.hostMatch('10.10.10.10', 'https://10.10.10.10'));

      // Wrong domains
      expect(() => URIMatcher.hostMatch(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.hostMatch([])).to.throw('Parameter is not a string');
      expect(() => URIMatcher.hostMatch({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.hostMatch(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.hostMatch(undefined)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.hostMatch('')).to.throw('Parameter is not a valid URL');
    });
  });

  describe('prefixMatch', () => {
    it('should return true if the prefix is matching', () => {
      // Domain 1
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.sd.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'http://www.sd.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://sd.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://sd.domain.com:1234/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'http://www.sd.domain.com/en/'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com/en/my.aspx?error=999', 'https://www.domain.com/'));

      // Domain 2
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com:1234/en/', 'https://sd.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com:1234/en/', 'https://www.sd.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.prefixMatch('https://www.sd.domain.com:1234/en/', 'https://sd.domain.com:1234/en/page/?param=1'));
      assert.isTrue(URIMatcher.prefixMatch('https://www.sd.domain.com:1234/en/', 'https://www.sd.domain.com:1234/en/page/?param=1'));
      assert.isFalse(URIMatcher.prefixMatch('https://www.sd.domain.com:1234/en/', 'http://www.sd.domain.com:1234/en/page/?param=1'));

      // IP
      assert.isFalse(URIMatcher.prefixMatch('10.10.10.10', 'http://10.10.10.10'));
      assert.isTrue(URIMatcher.prefixMatch('http://10.10.10.10', 'http://10.10.10.10'));
      assert.isTrue(URIMatcher.prefixMatch('http://10.10.10.10', 'http://10.10.10.10/some/path'));
      assert.isTrue(URIMatcher.prefixMatch('https://10.10.10.10', 'https://10.10.10.10'));
      assert.isTrue(URIMatcher.prefixMatch('https://10.10.10.10', 'https://10.10.10.10/some/path'));

      // Wrong domains
      expect(() => URIMatcher.prefixMatch(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.prefixMatch([])).to.throw('Parameter is not a string');
      expect(() => URIMatcher.prefixMatch({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.prefixMatch(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.prefixMatch(undefined)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.prefixMatch('')).to.throw('Parameter is not a valid URL');
    });
  });

  describe('exactMatch', () => {
    it('should return true if the URL is matching', () => {
      // Domain 1
      assert.isTrue(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://domain.net/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/my.aspx?error=999', 'https://domain.com:1234/'));

      // Domain 2
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isTrue(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://domain.net/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com/en/', 'https://domain.com:1234/'));

      // Domain 3
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'http://www.domain.com/en/'));
      assert.isTrue(URIMatcher.exactMatch('https://www.domain.com', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'https://domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'https://domain.net/'));
      assert.isFalse(URIMatcher.exactMatch('https://www.domain.com', 'https://domain.com:1234/'));

      // Domain 4
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://domain.net/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com', 'https://domain.com:1234/'));

      // Domain 5
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://www.domain.com/en/my.aspx?error=999'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'http://www.domain.com/en/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://www.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://sd.domain.com/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://domain.net/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'https://domain.com:1234/'));
      assert.isTrue(URIMatcher.exactMatch('http://www.domain.com:1234/', 'http://www.domain.com:1234/'));
      assert.isFalse(URIMatcher.exactMatch('http://www.domain.com:1234/', 'http://domain.com:1234/'));

      // IP
      assert.isTrue(URIMatcher.exactMatch('http://10.10.10.10', 'http://10.10.10.10'));
      assert.isTrue(URIMatcher.exactMatch('https://10.10.10.10', 'https://10.10.10.10'));

      // Wrong domains
      expect(() => URIMatcher.exactMatch(123)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.exactMatch([])).to.throw('Parameter is not a string');
      expect(() => URIMatcher.exactMatch({})).to.throw('Parameter is not a string');
      expect(() => URIMatcher.exactMatch(null)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.exactMatch(undefined)).to.throw('Parameter is not a string');
      expect(() => URIMatcher.exactMatch('')).to.throw('Parameter is not a valid URL');
    });
  });

  // Advanced methods
  describe('getMatchedAccounts', () => {
    it('should return the matched accounts', () => {
      expect(() => URIMatcher.getMatchedAccounts()).to.throw('Parameter tabUrl is not a string');
      expect(() => URIMatcher.getMatchedAccounts(null, '')).to.throw('Parameter services is not an array');
      expect(() => URIMatcher.getMatchedAccounts([], '')).to.throw('Parameter tabUrl is not a valid URL');
      assert.deepEqual(URIMatcher.getMatchedAccounts([], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([123], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([null], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{}], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: null }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: [] }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: {} }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: 123 }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: '' }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: 'google.pl' }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: { text: 'google.pl' } }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: { text: 'google.pl', matcher: URIMatcher.M_DOMAIN_TYPE } }], 'google.pl'), []);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: [{ text: 'google.pl', matcher: URIMatcher.M_DOMAIN_TYPE }] }], 'google.pl'), [{ uris: [{ text: 'https://google.pl', matcher: URIMatcher.M_DOMAIN_TYPE }] }]);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: [{ text: '10.10.10.10', matcher: URIMatcher.M_DOMAIN_TYPE }] }], '10.10.10.10'), [{ uris: [{ text: 'https://10.10.10.10', matcher: URIMatcher.M_DOMAIN_TYPE }] }]);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: [{ text: '10.10.10.10', matcher: URIMatcher.M_HOST_TYPE }] }], '10.10.10.10'), [{ uris: [{ text: 'https://10.10.10.10', matcher: URIMatcher.M_HOST_TYPE }] }]);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: [{ text: '10.10.10.10', matcher: URIMatcher.M_EXACT_TYPE }] }], '10.10.10.10'), [{ uris: [{ text: 'https://10.10.10.10', matcher: URIMatcher.M_EXACT_TYPE }] }]);
      assert.deepEqual(URIMatcher.getMatchedAccounts([{ uris: [{ text: '10.10.10.10', matcher: URIMatcher.M_START_WITH_TYPE }] }], '10.10.10.10'), [{ uris: [{ text: 'https://10.10.10.10', matcher: URIMatcher.M_START_WITH_TYPE }] }]);
    });
  });

  describe('recognizeURIs', () => {
    it('should return the recognized URIs (URI & others)', () => {
      // Parameter tests
      expect(() => URIMatcher.recognizeURIs(123)).to.throw('Parameter is not an array');
      expect(() => URIMatcher.recognizeURIs({})).to.throw('Parameter is not an array');
      expect(() => URIMatcher.recognizeURIs(null)).to.throw('Parameter is not an array');
      expect(() => URIMatcher.recognizeURIs(undefined)).to.throw('Parameter is not an array');
      expect(() => URIMatcher.recognizeURIs('')).to.throw('Parameter is not an array');

      assert.deepEqual(URIMatcher.recognizeURIs([]), { urls: [], others: [] });

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }]),
        { urls: [], others: [{ text: 'test' }]}
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: '2fas.com' }]),
        { urls: [{ text: 'https://2fas.com' }], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: 'https://2fas.com' }]),
        { urls: [{ text: 'https://2fas.com' }], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: 'https://2fas.com' }, { text: '2fas.com' }]),
        { urls: [{ text: 'https://2fas.com' }], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: '' }]),
        { urls: [], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: undefined }]),
        { urls: [], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: null }]),
        { urls: [], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: 123 }]),
        { urls: [], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: {} }]),
        { urls: [], others: [{ text: 'test' }] }
      );

      assert.deepEqual(
        URIMatcher.recognizeURIs([{ text: 'test' }, { text: [] }]),
        { urls: [], others: [{ text: 'test' }] }
      );
    });
  });

  describe('generateDocumentUrlPatterns', () => {
    it('should return the document URL patterns', () => {
      // Parameter tests
      expect(() => URIMatcher.generateDocumentUrlPatterns()).to.throw('Parameter is not an object');
      expect(() => URIMatcher.generateDocumentUrlPatterns('')).to.throw('Parameter is not an object');
      expect(() => URIMatcher.generateDocumentUrlPatterns([])).to.throw('Parameter is not an object');
      expect(() => URIMatcher.generateDocumentUrlPatterns(123)).to.throw('Parameter is not an object');
      expect(() => URIMatcher.generateDocumentUrlPatterns(null)).to.throw('Parameter is not an object');
      expect(() => URIMatcher.generateDocumentUrlPatterns(undefined)).to.throw('Parameter is not an object');
      expect(() => URIMatcher.generateDocumentUrlPatterns({})).to.throw('Parameter is not a valid URI object');

      // DOMAIN
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://www.domain.com', matcher: URIMatcher.M_DOMAIN_TYPE }), ['*://domain.com/', '*://domain.com/*', '*://*.domain.com/', '*://*.domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com', matcher: URIMatcher.M_DOMAIN_TYPE }), ['*://domain.com/', '*://domain.com/*', '*://*.domain.com/', '*://*.domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'www.domain.com', matcher: URIMatcher.M_DOMAIN_TYPE }), ['*://domain.com/', '*://domain.com/*', '*://*.domain.com/', '*://*.domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'domain.com', matcher: URIMatcher.M_DOMAIN_TYPE }), ['*://domain.com/', '*://domain.com/*', '*://*.domain.com/', '*://*.domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10', matcher: URIMatcher.M_DOMAIN_TYPE }), ['http://10.10.10.10/', 'http://10.10.10.10:*/', 'http://10.10.10.10/*', 'http://10.10.10.10:*/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '127.0.0.1', matcher: URIMatcher.M_DOMAIN_TYPE }), ['http://127.0.0.1/', 'http://127.0.0.1:*/', 'http://127.0.0.1/*', 'http://127.0.0.1:*/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'http://localhost', matcher: URIMatcher.M_DOMAIN_TYPE }), ['http://localhost/', 'http://localhost/*', 'http://*.localhost/', 'http://*.localhost/*']);

      // HOST
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://www.domain.com', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com/', '*://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com/', '*://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'www.domain.com', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com/', '*://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'sd.domain.com', matcher: URIMatcher.M_HOST_TYPE }), ['*://sd.domain.com/', '*://sd.domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'domain.com', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com/', '*://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com:8123', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com:8123/', '*://domain.com:8123/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com:8123/path', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com:8123/', '*://domain.com:8123/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com:443', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com/', '*://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'http://domain.com:80', matcher: URIMatcher.M_HOST_TYPE }), ['*://domain.com/', '*://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10', matcher: URIMatcher.M_HOST_TYPE }), ['http://10.10.10.10/', 'http://10.10.10.10/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '127.0.0.1', matcher: URIMatcher.M_HOST_TYPE }), ['http://127.0.0.1/', 'http://127.0.0.1/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10:80', matcher: URIMatcher.M_HOST_TYPE }), ['http://10.10.10.10:80/', 'http://10.10.10.10:80/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '127.0.0.1:8123', matcher: URIMatcher.M_HOST_TYPE }), ['http://127.0.0.1:8123/', 'http://127.0.0.1:8123/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '127.0.0.1:443', matcher: URIMatcher.M_HOST_TYPE }), ['http://127.0.0.1/', 'http://127.0.0.1/*']); // because 443 is the default port for https and we add https protocol if not present
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'http://localhost', matcher: URIMatcher.M_HOST_TYPE }), ['http://localhost/', 'http://localhost/*']);

      // START_WITH
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://www.domain.com', matcher: URIMatcher.M_START_WITH_TYPE }), ['https://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com', matcher: URIMatcher.M_START_WITH_TYPE }), ['https://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'www.domain.com', matcher: URIMatcher.M_START_WITH_TYPE }), ['https://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'domain.com', matcher: URIMatcher.M_START_WITH_TYPE }), ['https://domain.com/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10', matcher: URIMatcher.M_START_WITH_TYPE }), ['http://10.10.10.10/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10:80', matcher: URIMatcher.M_START_WITH_TYPE }), ['http://10.10.10.10:80/*']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'http://localhost', matcher: URIMatcher.M_START_WITH_TYPE }), ['http://localhost/*']);

      // EXACT
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://www.domain.com', matcher: URIMatcher.M_EXACT_TYPE }), ['https://domain.com/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'https://domain.com', matcher: URIMatcher.M_EXACT_TYPE }), ['https://domain.com/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'www.domain.com', matcher: URIMatcher.M_EXACT_TYPE }), ['https://domain.com/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'domain.com', matcher: URIMatcher.M_EXACT_TYPE }), ['https://domain.com/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10', matcher: URIMatcher.M_EXACT_TYPE }), ['http://10.10.10.10/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: '10.10.10.10/test', matcher: URIMatcher.M_EXACT_TYPE }), ['http://10.10.10.10/test/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'http://localhost', matcher: URIMatcher.M_EXACT_TYPE }), ['http://localhost/']);
      assert.deepEqual(URIMatcher.generateDocumentUrlPatterns({ text: 'http://localhost/test', matcher: URIMatcher.M_EXACT_TYPE }), ['http://localhost/test/']);
    });
  });
});
