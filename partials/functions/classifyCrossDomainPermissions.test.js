// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import classifyCrossDomainPermissions from './classifyCrossDomainPermissions.js';

describe('classifyCrossDomainPermissions', () => {
  describe('no cross-domain login forms (regression: tracker-heavy page)', () => {
    // After the fix, frames that never reported a login form (e.g. doubleclick /
    // adsrvr tracking iframes on login.vanguard.com) are simply not passed in.
    // The result must be "allow" with NO dialog — previously these non-responding
    // frames were flagged as unknownDomains and spuriously triggered a trust dialog.
    it('allows with no dialog when no hostname reported a form (empty Set)', () => {
      const result = classifyCrossDomainPermissions(new Set(), [], []);
      expect(result.needsDialog).toBe(false);
      expect(result.allAllowed).toBe(true);
      expect(result.allBlocked).toBe(false);
      expect(result.unknownDomains).toEqual([]);
      expect(result.crossDomainAllowedDomains).toEqual([]);
    });

    it('allows with no dialog for an empty array', () => {
      const result = classifyCrossDomainPermissions([], ['trusted.com'], ['blocked.com']);
      expect(result.needsDialog).toBe(false);
      expect(result.allAllowed).toBe(true);
    });
  });

  describe('unknown cross-domain login form -> dialog', () => {
    it('flags an unknown hostname as needing the trust dialog', () => {
      const result = classifyCrossDomainPermissions(new Set(['sso.bank.example']), [], []);
      expect(result.needsDialog).toBe(true);
      expect(result.allAllowed).toBe(false);
      expect(result.unknownDomains).toEqual(['sso.bank.example']);
      expect(result.crossDomainAllowedDomains).toEqual([]);
    });
  });

  describe('trusted hostnames', () => {
    it('auto-allows a trusted hostname without a dialog', () => {
      const result = classifyCrossDomainPermissions(['login.idp.example'], ['login.idp.example'], []);
      expect(result.needsDialog).toBe(false);
      expect(result.allAllowed).toBe(true);
      expect(result.trustedDomains).toEqual(['login.idp.example']);
      expect(result.crossDomainAllowedDomains).toEqual(['login.idp.example']);
    });
  });

  describe('untrusted hostnames', () => {
    it('blocks entirely when the only hostname is untrusted', () => {
      const result = classifyCrossDomainPermissions(['ads.evil.example'], [], ['ads.evil.example']);
      expect(result.allAllowed).toBe(false);
      expect(result.allBlocked).toBe(true);
      expect(result.needsDialog).toBe(false);
      expect(result.untrustedDomains).toEqual(['ads.evil.example']);
      expect(result.crossDomainAllowedDomains).toEqual([]);
    });

    it('partially allows when one hostname is trusted and another untrusted', () => {
      const result = classifyCrossDomainPermissions(
        ['good.example', 'bad.example'],
        ['good.example'],
        ['bad.example']
      );
      expect(result.allAllowed).toBe(false);
      expect(result.allBlocked).toBe(false);
      expect(result.needsDialog).toBe(false);
      expect(result.trustedDomains).toEqual(['good.example']);
      expect(result.untrustedDomains).toEqual(['bad.example']);
      expect(result.crossDomainAllowedDomains).toEqual(['good.example']);
    });
  });

  describe('mixed -> dialog wins', () => {
    it('shows the dialog when at least one hostname is unknown, regardless of others', () => {
      const result = classifyCrossDomainPermissions(
        ['good.example', 'bad.example', 'new.example'],
        ['good.example'],
        ['bad.example']
      );
      expect(result.needsDialog).toBe(true);
      expect(result.allAllowed).toBe(false);
      expect(result.unknownDomains).toEqual(['new.example']);
      expect(result.trustedDomains).toEqual(['good.example']);
      expect(result.untrustedDomains).toEqual(['bad.example']);
      // trusted domains are still pre-allowed so the dialog only asks about new ones
      expect(result.crossDomainAllowedDomains).toEqual(['good.example']);
    });
  });

  describe('safety / guards', () => {
    it('returns the allow default for non-iterable input', () => {
      const result = classifyCrossDomainPermissions(undefined);
      expect(result.allAllowed).toBe(true);
      expect(result.needsDialog).toBe(false);
    });

    it('tolerates non-array trusted/untrusted lists', () => {
      const result = classifyCrossDomainPermissions(['x.example'], null, undefined);
      expect(result.unknownDomains).toEqual(['x.example']);
      expect(result.needsDialog).toBe(true);
    });
  });
});
