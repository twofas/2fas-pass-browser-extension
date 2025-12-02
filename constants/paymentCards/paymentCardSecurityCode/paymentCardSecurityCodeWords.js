// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const paymentCardSecurityCodeWords = Object.freeze([
  'cvv', // Card Verification Value
  'cvc', // Card Verification Code
  'csc', // Card Security Code
  'cvn', // Card Verification Number
  'cid', // Card Identification Number (Amex)
  'cvv2', // CVV version 2
  'cvc2', // CVC version 2
  'security code', // English
  'verification code', // English
  'card security code', // English
  'card verification', // English
  '3 digits', // English
  '4 digits', // English (Amex)
  'kod sigurie', // Albanian
  'segurtasun kodea', // Basque
  'код бяспекі', // Belarusian
  'sigurnosni kod', // Bosnian
  'код за сигурност', // Bulgarian
  'codi de seguretat', // Catalan
  'coddu di sicurezza', // Corsican
  'sigurnosni kod', // Croatian
  'bezpečnostní kód', // Czech
  'sikkerhedskode', // Danish
  'beveiligingscode', // Dutch
  'turvakood', // Estonian
  'turvakoodi', // Finnish
  'code de sécurité', // French
  'feiligenscode', // Frisian
  'código de seguridade', // Galician
  'Sicherheitscode', // German
  'κωδικός ασφαλείας', // Greek
  'biztonsági kód', // Hungarian
  'öryggiskóði', // Icelandic
  'cód slándála', // Irish
  'codice di sicurezza', // Italian
  'drošības kods', // Latvian
  'saugos kodas', // Lithuanian
  'Sécherheetsprotokoll', // Luxembourgish
  'безбедносен код', // Macedonian
  'kodiċi tas-sigurtà', // Maltese
  'sikkerhetskode', // Norwegian
  'kod bezpieczeństwa', // Polish
  'código de segurança', // Portuguese
  'cod de securitate', // Romanian
  'код безопасности', // Russian
  'còd tèarainteachd', // Scots Gaelic
  'сигурносни код', // Serbian
  'bezpečnostný kód', // Slovak
  'varnostna koda', // Slovenian
  'código de seguridad', // Spanish
  'säkerhetskod', // Swedish
  'куркынычсызлык коды', // Tatar
  'код безпеки', // Ukrainian
  'cod diogelwch', // Welsh
  'זיכערקייַט קאָד', // Yiddish
  'անdelays կdelays', // Armenian
  'təhlükəsizlik kodu', // Azerbaijani
  'নিরাপত্তা কোড', // Bengali
  '安全码', // Chinese Simplified
  '安全碼', // Chinese Traditional
  'უსაფრთხოების კოდი', // Georgian
  'સુરક્ષા કોડ', // Gujarati
  'सुरक्षा कोड', // Hindi
  'tus lej kev ruaj ntseg', // Hmong
  'セキュリティコード', // Japanese
  'ಭದ್ರತಾ ಸಂಕೇತ', // Kannada
  'қауіпсіздік коды', // Kazakh
  'លេខកូដសុវត្ថិភាព', // Khmer
  '보안 코드', // Korean
  'коопсуздук коду', // Kyrgyz
  'ລະຫັດຄວາມປອດໄພ', // Lao
  'സുരക്ഷാ കോഡ്', // Malayalam
  'सुरक्षा कोड', // Marathi
  'аюулгүй байдлын код', // Mongolian
  'လုံခြုံရေးကုဒ်', // Myanmar (Burmese)
  'सुरक्षा कोड', // Nepali
  'ସୁରକ୍ଷା କୋଡ୍', // Odia
  'د امنیت کوډ', // Pashto
  'ਸੁਰੱਖਿਆ ਕੋਡ', // Punjabi
  'سيڪيورٽي ڪوڊ', // Sindhi
  'ආරක්ෂක කේතය', // Sinhala
  'рамзи амният', // Tajik
  'பாதுகாப்பு குறியீடு', // Tamil
  'భద్రతా కోడ్', // Telugu
  'รหัสความปลอดภัย', // Thai
  'güvenlik kodu', // Turkish
  'howpsuzlyk kody', // Turkmen
  'سیکورٹی کوڈ', // Urdu
  'بىخەتەرلىك كودى', // Uyghur
  'xavfsizlik kodi', // Uzbek
  'mã bảo mật', // Vietnamese
  'رمز الأمان', // Arabic
  'קוד אבטחה', // Hebrew
  'koda ewlehiyê', // Kurdish (Kurmanji)
  'کد امنیتی', // Persian
  'sekuriteitskode', // Afrikaans
  'khoutu ea ts\'ireletso', // Sesotho
  'koodhka amniga', // Somali
  'msimbo wa usalama', // Swahili
  'ikhodi yokuphepha', // Zulu
  'security code', // Filipino
  'helu hōʻoia', // Hawaiian
  'kode keamanan', // Indonesian
  'kode keamanan', // Javanese
  'kaody fiarovana', // Malagasy
  'kod keselamatan', // Malay
  'waehere haumarutanga', // Maori
  'numera saogalemu', // Samoan
  'kode kaamanan', // Sundanese
  'sekureca kodo', // Esperanto
  'kòd sekirite' // Haitian Creole
]);

export default paymentCardSecurityCodeWords;
