// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Words naming a password field, matched against a text input's name, id, placeholder,
// aria-label and label text to recognise a password revealed by a "show password" toggle.
const passwordKeywords = /* @__PURE__ */ Object.freeze([
  'password',
  'passwd',
  'passphrase',
  'haslo',
  'hasło',
  'passwort',
  'kennwort',
  'contrasena',
  'contraseña',
  'contrasenya',
  'senha',
  'motdepasse',
  'mot de passe',
  'wachtwoord',
  'losenord',
  'lösenord',
  'adgangskode',
  'passord',
  'salasana',
  'parool',
  'heslo',
  'jelszo',
  'jelszó',
  'geslo',
  'lozinka',
  'slaptazodis',
  'slaptažodis',
  'sifre',
  'şifre',
  'пароль',
  'парола',
  'лозинка',
  'κωδικός πρόσβασης',
  'סיסמה',
  'סיסמא',
  'كلمة المرور',
  'كلمة السر',
  'رمز عبور',
  'گذرواژه',
  'पासवर्ड',
  'パスワード',
  '密码',
  '密碼',
  '비밀번호',
  'รหัสผ่าน',
  'mật khẩu',
  'mat khau',
  'kata sandi',
  'katasandi',
  'kata laluan'
]);

// Abbreviations naming a password field. Matched against name and id only: in free text
// (labels, placeholders) a word such as "pass" too often means something else ("boarding pass").
const passwordIdentifierKeywords = /* @__PURE__ */ Object.freeze([
  'pass',
  'pwd',
  'pword',
  'pswd',
  'psw',
  'mdp'
]);

// Words marking a field that mentions a password without being one (hint, security question,
// one-time code, search box).
const passwordDeniedKeywords = /* @__PURE__ */ Object.freeze([
  'hint',
  'question',
  'answer',
  'reminder',
  'strength',
  'search',
  'otp',
  'totp',
  'sms',
  'one-time',
  'one time',
  'onetime',
  'podpowiedz',
  'podpowiedź',
  'wskazowka',
  'wskazówka',
  'pytanie',
  'jednorazowe',
  'jednorazowy',
  'jednorazowa'
]);

// Autocomplete field tokens that explicitly describe something other than a password.
const passwordDeniedAutocompleteValues = /* @__PURE__ */ Object.freeze([
  'username',
  'email',
  'one-time-code'
]);

export { passwordKeywords, passwordIdentifierKeywords, passwordDeniedKeywords, passwordDeniedAutocompleteValues };
