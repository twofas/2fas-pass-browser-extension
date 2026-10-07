// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Lowercase phrases that disqualify a field found by its label from being a payment card field: gift,
* loyalty and promo cards, bank accounts, one-time codes, identity documents, phone numbers and birth
* dates reuse the same "card number"/"security code" wording (e.g. "Gift card number", "Enter the security
* code sent by SMS", "Cardholder birthdate (YYMMDD)"). Matched like the card label words. Languages are
* limited to the ones covered by Chromium's credit card autofill patterns.
*/
const paymentCardLabelDeniedWords = /* @__PURE__ */ Object.freeze([
  'gift card', // English
  'giftcard', // English
  'gift certificate', // English
  'gift voucher', // English
  'voucher', // English
  'coupon', // English, French
  'promo code', // English
  'promotion code', // English
  'promotional code', // English
  'discount code', // English
  'loyalty', // English
  'frequent flyer', // English
  'membership', // English
  'member number', // English
  'iban', // English
  'bank account', // English
  'account number', // English
  'routing number', // English
  'one-time', // English
  'one time', // English
  'otp', // English
  '2fa', // English
  'sms', // English
  'text message', // English
  'sent to', // English
  'passport', // English
  'document number', // English
  'phone', // English
  'mobile', // English
  'birth', // English
  'birthdate', // English
  'birthday', // English
  'registration number', // English
  'tax', // English
  'sim', // English
  'geschenkkarte', // German
  'geschenkgutschein', // German
  'gutschein', // German
  'kundenkarte', // German
  'kundennummer', // German
  'mitgliedsnummer', // German
  'kontonummer', // German
  'bankleitzahl', // German
  'telefon', // German
  'handy', // German
  'mobilnummer', // German
  'geburtsdatum', // German
  'steuernummer', // German
  'tarjeta regalo', // Spanish
  'tarjeta de regalo', // Spanish
  'cupón', // Spanish
  'cupon', // Spanish
  'código promocional', // Spanish
  'documento', // Spanish, Portuguese
  'teléfono', // Spanish
  'telefono', // Spanish, Italian
  'fecha de nacimiento', // Spanish
  'pasaporte', // Spanish
  'carte cadeau', // French
  'carte-cadeau', // French
  'code promo', // French
  'passeport', // French
  'téléphone', // French
  'telephone', // French
  'date de naissance', // French
  'réservation', // French
  'reservation', // French
  'carta regalo', // Italian
  'buono regalo', // Italian
  'codice promozionale', // Italian
  'codice sconto', // Italian
  'data di nascita', // Italian
  'passaporto', // Italian
  'cartão presente', // Portuguese
  'cartao presente', // Portuguese
  'vale-presente', // Portuguese
  'cupom', // Portuguese
  'cpf', // Portuguese
  'cnpj', // Portuguese
  'telefone', // Portuguese
  'celular', // Portuguese
  'data de nascimento', // Portuguese
  'passaporte', // Portuguese
  'подарочн', // Russian
  'промокод', // Russian
  'телефон', // Russian
  'дата рождения', // Russian
  'паспорт', // Russian
  'ギフトカード', // Japanese
  'ギフト券', // Japanese
  'クーポン', // Japanese
  'ポイントカード', // Japanese
  '会員番号', // Japanese
  '電話', // Japanese, Chinese (Traditional)
  '生年月日', // Japanese
  'パスポート', // Japanese
  '礼品卡', // Chinese (Simplified)
  '禮品卡', // Chinese (Traditional)
  '会员', // Chinese (Simplified)
  '會員', // Chinese (Traditional)
  '优惠券', // Chinese (Simplified)
  '優惠券', // Chinese (Traditional)
  '电话', // Chinese (Simplified)
  '手机', // Chinese (Simplified)
  '手機', // Chinese (Traditional)
  '生日', // Chinese
  '护照', // Chinese (Simplified)
  '護照', // Chinese (Traditional)
  '기프트카드', // Korean
  '기프트 카드', // Korean
  '상품권', // Korean
  '쿠폰', // Korean
  '멤버십', // Korean
  '전화', // Korean
  '휴대폰', // Korean
  '생년월일', // Korean
  '여권', // Korean
  'kartu hadiah', // Indonesian
  'kupon', // Indonesian
  'telepon', // Indonesian
  'tanggal lahir', // Indonesian
  'paspor' // Indonesian
]);

export default paymentCardLabelDeniedWords;
