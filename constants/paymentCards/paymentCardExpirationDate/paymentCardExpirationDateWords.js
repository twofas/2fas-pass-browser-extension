// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const paymentCardExpirationDateWords = Object.freeze([
  'expiry', // English
  'expiration', // English
  'exp', // English
  'valid thru', // English
  'valid until', // English
  'valid to', // English
  'expires', // English
  'exp date', // English
  'expiry date', // English
  'expiration date', // English
  'month', // English
  'year', // English
  'mm/yy', // Format
  'mm/yyyy', // Format
  'mm / yy', // Format
  'mm / yyyy', // Format
  'skadimi', // Albanian
  'iraungitze', // Basque
  'тэрмін', // Belarusian
  'istek', // Bosnian
  'изтичане', // Bulgarian
  'caducitat', // Catalan
  'scadenza', // Corsican
  'istek', // Croatian
  'platnost', // Czech
  'udløb', // Danish
  'vervaldatum', // Dutch
  'kehtivus', // Estonian
  'vanheneminen', // Finnish
  'expiration', // French
  'ferfaldatum', // Frisian
  'caducidade', // Galician
  'Ablaufdatum', // German
  'λήξη', // Greek
  'lejárat', // Hungarian
  'gildistími', // Icelandic
  'éag', // Irish
  'scadenza', // Italian
  'derīguma termiņš', // Latvian
  'galiojimo laikas', // Lithuanian
  'Verfallsdatum', // Luxembourgish
  'истек', // Macedonian
  'skadenza', // Maltese
  'utløp', // Norwegian
  'ważność', // Polish
  'validade', // Portuguese
  'expirare', // Romanian
  'срок действия', // Russian
  'falbh air', // Scots Gaelic
  'истек', // Serbian
  'platnosť', // Slovak
  'veljavnost', // Slovenian
  'vencimiento', // Spanish
  'giltighetstid', // Swedish
  'вакыт', // Tatar
  'термін дії', // Ukrainian
  'dyddiad dod i ben', // Welsh
  'אויסגיין', // Yiddish
  ' delays անdelays', // Armenian
  'etibarlılıq müddəti', // Azerbaijani
  'মেয়াদ', // Bengali
  '有效期', // Chinese Simplified
  '有效期', // Chinese Traditional
  'ვადა', // Georgian
  'સમાપ્તિ', // Gujarati
  'समाप्ति', // Hindi
  'tag kis', // Hmong
  '有効期限', // Japanese
  'ಮುಕ್ತಾಯ', // Kannada
  'жарамдылық мерзімі', // Kazakh
  'ផុតកំណត់', // Khmer
  '만료', // Korean
  'жарактуулук', // Kyrgyz
  'ໝົດອາຍຸ', // Lao
  'കാലാവധി', // Malayalam
  'कालबाह्यता', // Marathi
  'хүчинтэй хугацаа', // Mongolian
  'သက်တမ်းကုန်', // Myanmar (Burmese)
  'म्याद', // Nepali
  'ମିଆଦ', // Odia
  'ختمیدل', // Pashto
  'ਮਿਆਦ', // Punjabi
  'ختم ٿيڻ', // Sindhi
  'කල් ඉකුත්වීම', // Sinhala
  'мӯҳлат', // Tajik
  'காலாவதி', // Tamil
  'గడువు', // Telugu
  'หมดอายุ', // Thai
  'son kullanma', // Turkish
  'möhleti', // Turkmen
  'میعاد', // Urdu
  'ۋاقتى', // Uyghur
  'amal qilish muddati', // Uzbek
  'hết hạn', // Vietnamese
  'انتهاء الصلاحية', // Arabic
  'תפוגה', // Hebrew
  'derbasbûn', // Kurdish (Kurmanji)
  'انقضا', // Persian
  'vervaldatum', // Afrikaans
  'ho fela', // Sesotho
  'dhici', // Somali
  'kumalizika muda', // Swahili
  'ukuphelelwa yisikhathi', // Zulu
  'pag-expire', // Filipino
  'pau', // Hawaiian
  'kadaluarsa', // Indonesian
  'kadaluwarsa', // Javanese
  'fahataperana', // Malagasy
  'tamat tempoh', // Malay
  'whakamutunga', // Maori
  'muta', // Samoan
  'kadaluwarsa', // Sundanese
  'eksvalidiĝo', // Esperanto
  'ekspirasyon' // Haitian Creole
]);

export default paymentCardExpirationDateWords;
