// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const personalInfoDeniedKeywords = Object.freeze([
  // --- First name ---
  'firstname', // English
  'first_name',
  'first-name',
  'givenname',
  'given_name',
  'given-name',
  'fname',
  'vorname', // German
  'prenom', // French
  'voornaam', // Dutch
  'imie', // Polish
  'fornamn', // Swedish
  'fornavn', // Danish, Norwegian
  'etunimi', // Finnish
  'keresztnev', // Hungarian
  'prenume', // Romanian
  'primeiro_nome', // Portuguese
  'primer_nombre', // Spanish
  'primo_nome', // Italian
  'krestni', // Czech
  'adiniz', // Turkish
  'priimek_ime', // Slovenian
  'shimei', // Japanese romanized
  'xingming', // Chinese romanized
  'ireum', // Korean romanized
  'ho_ten', // Vietnamese

  // --- Last name ---
  'lastname', // English
  'last_name',
  'last-name',
  'familyname',
  'family_name',
  'family-name',
  'surname',
  'lname',
  'nachname', // German
  'familienname', // German
  'nom_famille', // French
  'nom_de_famille', // French
  'achternaam', // Dutch
  'nazwisko', // Polish
  'efternamn', // Swedish
  'efternavn', // Danish, Norwegian
  'sukunimi', // Finnish
  'vezeteknev', // Hungarian
  'csaladnev', // Hungarian
  'apellido', // Spanish
  'apellidos', // Spanish
  'cognome', // Italian
  'sobrenome', // Portuguese
  'prijmeni', // Czech
  'priezvisko', // Slovak
  'prezime', // Croatian, Serbian, Bosnian
  'priimek', // Slovenian
  'soyadi', // Turkish
  'soyad', // Turkish
  'familia_name', // Romanian

  // --- Middle name ---
  'middlename', // English
  'middle_name',
  'middle-name',
  'mname',
  'segundo_nombre', // Spanish
  'deuxieme_prenom', // French
  'zweitname', // German
  'secondname',
  'second_name',
  'second-name',

  // --- Full name ---
  'fullname', // English
  'full_name',
  'full-name',
  'realname',
  'real_name',
  'real-name',
  'truename',
  'true_name',
  'true-name',
  'ho_va_ten', // Vietnamese

  // --- Maiden name ---
  'maidenname',
  'maiden_name',
  'maiden-name',

  // --- Birthday ---
  'birthday', // English
  'birthdate',
  'birth_date',
  'birth-date',
  'dateofbirth',
  'date_of_birth',
  'date-of-birth',
  'bday',
  'birthyear',
  'birth_year',
  'birth-year',
  'birthmonth',
  'birth_month',
  'birth-month',
  'birthday_day',
  'birthday_month',
  'birthday_year',
  'geburtsdatum', // German
  'geburtstag', // German
  'date_naissance', // French
  'date_de_naissance', // French
  'datedenaissance', // French (no separators)
  'fecha_nacimiento', // Spanish
  'fecha_de_nacimiento', // Spanish
  'fechanacimiento', // Spanish (no separators)
  'data_nascita', // Italian
  'data_di_nascita', // Italian
  'datanascita', // Italian (no separators)
  'data_nascimento', // Portuguese
  'data_de_nascimento', // Portuguese
  'datanascimento', // Portuguese (no separators)
  'geboortedatum', // Dutch
  'data_urodzenia', // Polish
  'dataurodzenia', // Polish (no separators)
  'datum_narozeni', // Czech
  'datumnarozeni', // Czech (no separators)
  'datum_narodenia', // Slovak
  'fodelsedatum', // Swedish
  'fodselsdag', // Danish, Norwegian
  'syntymaaika', // Finnish
  'syntymapaiva', // Finnish
  'szuletesi', // Hungarian
  'szuletesnap', // Hungarian
  'data_nasterii', // Romanian
  'datanasterii', // Romanian (no separators)
  'rojstni_datum', // Slovenian
  'datum_rodjenja', // Croatian, Serbian
  'datumrodjenja', // Croatian, Serbian (no separators)
  'dogum_tarihi', // Turkish
  'dogumtarihi', // Turkish (no separators)
  'tanjoubi', // Japanese romanized
  'seinengappi', // Japanese romanized
  'shengri', // Chinese romanized
  'ngay_sinh', // Vietnamese

  // --- Gender ---
  'gender'
]);

export default personalInfoDeniedKeywords;
