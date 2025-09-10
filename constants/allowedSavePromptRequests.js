// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const allowedSavePromptRequests = Object.freeze([
  'login',
  'sign_in',
  'sign-in',
  'signin',
  'sign_in_with_password',
  'LogOn',
  'auth',
  'password',
  'login_for_web',
  'verification',
  'signin/init',
  'sso/auth',
  'login_check',
  'login-with-credentials',
  'loginWH',
  'authenticate',
  'prelogin',
  'login-submit',
  'login_check',
  'Login',
  'submitLogin',
  'ppsecure/post',
  'admin-ajax.php',
  'dribble.com/session',
  'api-token-auth',
  'loginBackend',
  'login_process.php',
  '/UserSessionResource/create/',
  '/api/tokens'
]);

export default allowedSavePromptRequests;
