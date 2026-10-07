// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Words naming a password field, matched against a text input's name, id, placeholder,
// aria-label and label text to recognise a password revealed by a "show password" toggle.
const passwordKeywords = Object.freeze([
  'password',
  'passwd',
  'passphrase',
  'haslo', // Polish
  'hasło', // Polish
  'passwort', // German
  'kennwort', // German
  'contrasena', // Spanish
  'contraseña', // Spanish
  'contrasenya', // Catalan
  'senha', // Portuguese
  'motdepasse', // French
  'mot de passe', // French
  'wachtwoord', // Dutch
  'losenord', // Swedish
  'lösenord', // Swedish
  'adgangskode', // Danish
  'passord', // Norwegian
  'salasana', // Finnish
  'parool', // Estonian
  'heslo', // Czech, Slovak
  'jelszo', // Hungarian
  'jelszó', // Hungarian
  'geslo', // Slovenian
  'lozinka', // Croatian, Bosnian, Serbian
  'slaptazodis', // Lithuanian
  'slaptažodis', // Lithuanian
  'sifre', // Turkish
  'şifre', // Turkish
  'пароль', // Russian, Ukrainian, Belarusian
  'парола', // Bulgarian
  'лозинка', // Serbian, Macedonian
  'κωδικός πρόσβασης', // Greek
  'סיסמה', // Hebrew
  'סיסמא', // Hebrew
  'كلمة المرور', // Arabic
  'كلمة السر', // Arabic
  'رمز عبور', // Persian
  'گذرواژه', // Persian
  'पासवर्ड', // Hindi
  'パスワード', // Japanese
  '密码', // Chinese Simplified
  '密碼', // Chinese Traditional
  '비밀번호', // Korean
  'รหัสผ่าน', // Thai
  'mật khẩu', // Vietnamese
  'mat khau', // Vietnamese
  'kata sandi', // Indonesian
  'katasandi', // Indonesian
  'kata laluan' // Malay
]);

// Abbreviations naming a password field. Matched against name and id only: in free text
// (labels, placeholders) a word such as "pass" too often means something else ("boarding pass").
const passwordIdentifierKeywords = Object.freeze([
  'pass',
  'pwd',
  'pword',
  'pswd',
  'psw',
  'mdp'
]);

// Words marking a field that mentions a password without being one (hint, security question,
// one-time code, search box).
const passwordDeniedKeywords = Object.freeze([
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
const passwordDeniedAutocompleteValues = Object.freeze([
  'username',
  'email',
  'one-time-code'
]);

export { passwordKeywords, passwordIdentifierKeywords, passwordDeniedKeywords, passwordDeniedAutocompleteValues };
