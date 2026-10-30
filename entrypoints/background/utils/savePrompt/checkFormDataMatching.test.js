// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// checkFormData decides whether a POST carries the captured credentials. It must read the values the body carries,
// not its encoded text: JSON and form serialisation escape characters strong passwords contain, URL encoding turns a
// space into "+", sites lowercase or trim the login, and a body can come in several raw parts.

import { describe, it, expect } from 'vitest';
import checkFormData from './checkFormData';

const bytes = text => new TextEncoder().encode(text).buffer;
const rawBody = (...parts) => ({ requestBody: { raw: parts.map(part => ({ bytes: bytes(part) })) } });
const jsonBody = object => rawBody(JSON.stringify(object));

describe('checkFormData — matches the values the body carries', () => {
  it('matches a password with a quote and a backslash sent as form data', async () => {
    const values = { username: 'jan@example.com', password: 'ab"cd\\ef' };
    const details = { requestBody: { formData: { email: ['jan@example.com'], password: ['ab"cd\\ef'] } } };

    expect(await checkFormData(details, values)).toBe(true);
  });

  it('matches a password with a quote and a backslash sent as JSON', async () => {
    const values = { username: 'jan@example.com', password: 'ab"cd\\ef' };

    expect(await checkFormData(jsonBody({ email: 'jan@example.com', password: 'ab"cd\\ef' }), values)).toBe(true);
  });

  it('matches values nested in JSON and written with unicode escapes', async () => {
    const values = { username: 'jan', password: 'zażółć' };
    const details = rawBody('{"variables":{"input":{"login":"jan","password":"za\\u017c\\u00f3\\u0142\\u0107"}}}');

    expect(await checkFormData(details, values)).toBe(true);
  });

  it('matches a password with a space sent URL-encoded with "+"', async () => {
    const values = { username: 'jan', password: 'a b+c' };

    expect(await checkFormData(rawBody('user=jan&pass=a+b%2Bc'), values)).toBe(true);
  });

  it('matches a login the site sends lowercased and trimmed', async () => {
    const values = { username: ' Jan@Example.COM ', password: 'S3cret!' };

    expect(await checkFormData(jsonBody({ email: 'jan@example.com', password: 'S3cret!' }), values)).toBe(true);
  });

  it('matches a body that comes in several raw parts', async () => {
    const values = { username: 'jan', password: 'S3cret!' };

    expect(await checkFormData(rawBody('{"username":"jan",', '"password":"S3cret!"}'), values)).toBe(true);
  });

  it('does not match when the password differs only in letter case', async () => {
    const values = { username: 'jan', password: 'S3cret!' };

    expect(await checkFormData(jsonBody({ username: 'jan', password: 's3cret!' }), values)).toBe(false);
  });

  it('does not match without a password, even when the body contains "undefined"', async () => {
    const values = { username: 'jan' };

    expect(await checkFormData(jsonBody({ username: 'jan', note: 'undefined' }), values)).toBe(false);
  });

  it('does not match when the login is missing from the body', async () => {
    const values = { username: 'jan', password: 'S3cret!' };

    expect(await checkFormData(jsonBody({ username: 'piotr', password: 'S3cret!' }), values)).toBe(false);
  });
});

// Some sites transform the password before sending it (Facebook and Instagram encrypt it in the page and send only
// "#PWD_BROWSER:<version>:<timestamp>:<base64>"). Such a body counts only together with the captured login and a login
// form the user submitted right before the request.
describe('checkFormData — password transformed by the page', () => {
  const encrypted = '#PWD_BROWSER:5:1793366768:AfhQACfSq6WxY82nuUY3FHFQMljGgZkC1CQppitATqdogQMZUqFgd661FSdEfkJC58FxV+vbqeZibkvzlmspUD9rqw==';
  const facebookBody = (identifier, password) => rawBody(new URLSearchParams({
    fb_api_req_friendly_name: 'useCDSWebLoginMutation',
    variables: JSON.stringify({
      input: {
        identifier,
        credential_type: 'password',
        password: { sensitive_string_value: password },
        enc_password: { sensitive_string_value: password }
      }
    })
  }).toString());
  const values = { username: 'jan@example.com', password: 'S3cret!' };

  it('matches a Facebook login submitted by the user', async () => {
    expect(await checkFormData(facebookBody('jan@example.com', encrypted), values, undefined, { submitted: true })).toBe(true);
  });

  it('matches an Instagram login (version 10) sent as JSON and submitted by the user', async () => {
    const details = jsonBody({ email: 'jan@example.com', enc_password: encrypted.replace(':5:', ':10:') });

    expect(await checkFormData(details, values, undefined, { submitted: true })).toBe(true);
  });

  it('does not match a body without the password when no login form was submitted', async () => {
    expect(await checkFormData(facebookBody('jan@example.com', encrypted), values)).toBe(false);
    expect(await checkFormData(facebookBody('jan@example.com', encrypted), values, undefined, { submitted: false })).toBe(false);
  });

  it('does not match a submitted form when the login is missing from the body', async () => {
    expect(await checkFormData(facebookBody('piotr@example.com', encrypted), values, undefined, { submitted: true })).toBe(false);
  });

  it('does not match a submitted form when no login was captured', async () => {
    const noLogin = { username: '', password: 'S3cret!' };

    expect(await checkFormData(facebookBody('jan@example.com', encrypted), noLogin, undefined, { submitted: true })).toBe(false);
  });

  it('still matches the plain password without a submit', async () => {
    expect(await checkFormData(facebookBody('jan@example.com', '#PWD_BROWSER:0:1793366768:S3cret!'), values)).toBe(true);
  });
});
