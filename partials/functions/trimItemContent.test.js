// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { describe, it, expect } from 'vitest';
import trimItemContent from './trimItemContent';
import trimString from './trimString';

describe('trimString', () => {
  it('trims strings and leaves other values untouched', () => {
    expect(trimString('  me@2fas.com \n')).toBe('me@2fas.com');
    expect(trimString('\t ')).toBe('');
    expect(trimString(undefined)).toBeUndefined();
    expect(trimString(null)).toBeNull();
    expect(trimString(5)).toBe(5);
  });
});

describe('trimItemContent', () => {
  it('trims every text value of a Login except the password, with the username and the URLs', () => {
    expect(trimItemContent({
      name: ' GitHub ',
      username: { value: ' me@2fas.com ', action: 'set' },
      s_password: { value: ' secret\t', action: 'set' },
      uris: [{ text: ' https://github.com ', matcher: 0 }],
      notes: '\n note \n',
      passwordMinLength: 8,
      passwordPattern: null
    })).toEqual({
      name: 'GitHub',
      username: { value: 'me@2fas.com', action: 'set' },
      s_password: { value: ' secret\t', action: 'set' },
      uris: [{ text: 'https://github.com', matcher: 0 }],
      notes: '\n note \n',
      passwordMinLength: 8,
      passwordPattern: null
    });
  });

  it('trims the values of a Secure Note, a payment card and a Wi-Fi network, never the Wi-Fi password', () => {
    expect(trimItemContent({ name: ' Note ', s_text: '\n text \n', additionalInfo: ' info ' }))
      .toEqual({ name: 'Note', s_text: '\n text \n', additionalInfo: 'info' });
    expect(trimItemContent({ name: ' Card ', cardHolder: ' John Doe ', s_cardNumber: '4111111111111111', s_expirationDate: ' 12/30 ', s_securityCode: ' 123 ' }))
      .toEqual({ name: 'Card', cardHolder: 'John Doe', s_cardNumber: '4111111111111111', s_expirationDate: '12/30', s_securityCode: '123' });
    expect(trimItemContent({ name: ' Home ', ssid: ' net ', s_wifi_password: ' pass ', securityType: 'wpa2', hidden: true }))
      .toEqual({ name: 'Home', ssid: 'net', s_wifi_password: ' pass ', securityType: 'wpa2', hidden: true });
  });

  it('never changes a password, even one of whitespace only', () => {
    expect(trimItemContent({ s_password: { value: '   ', action: 'set' }, s_wifi_password: '\t' }))
      .toEqual({ s_password: { value: '   ', action: 'set' }, s_wifi_password: '\t' });
  });

  it('keeps the empty lines at the start and the end of the notes, removing only the spaces and tabs there', () => {
    expect(trimItemContent({ notes: '\n\nnote\n\n', s_text: ' \t\ntext\n  ', additionalInfo: '\ninfo \n' }))
      .toEqual({ notes: '\n\nnote\n\n', s_text: '\ntext\n', additionalInfo: '\ninfo \n' });
    expect(trimItemContent({ name: '\nName\n', cardHolder: '\nJohn Doe\n' }))
      .toEqual({ name: 'Name', cardHolder: 'John Doe' });
  });

  it('keeps the whitespace inside the values', () => {
    expect(trimItemContent({ cardHolder: ' John  Doe ', s_text: ' line 1\n\nline 2 ' }))
      .toEqual({ cardHolder: 'John  Doe', s_text: 'line 1\n\nline 2' });
  });

  it('returns a copy and never changes the given content', () => {
    const content = { name: ' a ', username: { value: ' b ', action: 'set' }, uris: [{ text: ' c ', matcher: 0 }] };
    const trimmed = trimItemContent(content);

    expect(content).toEqual({ name: ' a ', username: { value: ' b ', action: 'set' }, uris: [{ text: ' c ', matcher: 0 }] });
    expect(trimmed).not.toBe(content);
    expect(trimmed.username).not.toBe(content.username);
    expect(trimmed.uris).not.toBe(content.uris);
  });

  it('returns values that are not objects as they are', () => {
    expect(trimItemContent(undefined)).toBeUndefined();
    expect(trimItemContent(null)).toBeNull();
  });

  it('keeps the objects that are not plain objects, such as dates or buffers', () => {
    const date = new Date(0);
    const buffer = new ArrayBuffer(4);
    const trimmed = trimItemContent({ date, buffer, nested: Object.assign(Object.create(null), { text: ' a ' }) });

    expect(trimmed.date).toBe(date);
    expect(trimmed.buffer).toBe(buffer);
    expect(trimmed.nested).toEqual({ text: 'a' });
  });
});
