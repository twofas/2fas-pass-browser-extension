// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Keywords that mark a password field as the CURRENT / OLD password — the one the user
// already knows and that autofill is allowed to fill. Matched as whole words (short tokens)
// or substrings (long/accented tokens) against an input's name, id, placeholder, aria-label
// and associated label text. Accent-free variants are included for attribute names that
// strip diacritics.
const currentPasswordKeywords = Object.freeze([
  'current',
  'old',
  'existing',
  'previous',
  'curr',
  'stare',
  'stary',
  'stara',
  'alte',
  'obecne',
  'obecny',
  'obecna',
  'aktualne',
  'aktualny',
  'aktualna',
  'dotychczasowe',
  'biezace',
  'bieżące',
  'altes',
  'aktuell',
  'bisherig',
  'actual',
  'antiguo',
  'antigua',
  'anterior',
  'ancien',
  'ancienne',
  'actuel',
  'actuelle',
  'atual',
  'antiga',
  'antigo',
  'attuale',
  'vecchia',
  'vecchio',
  'corrente',
  'precedente',
  'huidig',
  'oud',
  'oude'
]);

// Keywords that mark a password field as a NEW / confirmation / repeat password — a field
// that must NOT receive the existing stored password (registration and change-password
// forms). Matched the same way as the current-password keywords.
const newPasswordKeywords = Object.freeze([
  'new',
  'confirm',
  'repeat',
  'retype',
  'reenter',
  're-enter',
  'verify',
  'verification',
  'again',
  'create',
  'conferma',
  'nowe',
  'nowy',
  'nowa',
  'powtorz',
  'powtórz',
  'potwierdz',
  'potwierdź',
  'ponownie',
  'neues',
  'wiederhol',
  'bestatig',
  'bestätig',
  'nuevo',
  'nueva',
  'nuovo',
  'nuova',
  'repetir',
  'novo',
  'nova',
  'nouveau',
  'nouvelle',
  'repeter',
  'répéter',
  'ripeti',
  'nieuw',
  'herhaal',
  'bevestig'
]);

export { currentPasswordKeywords, newPasswordKeywords };
