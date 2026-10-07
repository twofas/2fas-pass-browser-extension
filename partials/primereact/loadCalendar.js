// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import buildPrimeReactLocale from '@/constants/primereact/index.js';

const PRIMEREACT_LOCALE_NAME = 'app';

let loadedCalendar = null;
let calendarPromise = null;

/**
* Returns the PrimeReact Calendar component when its chunk has already been loaded on this page.
* @return {Function|null} The Calendar component, or null until loadCalendar() resolves.
*/
const getLoadedCalendar = () => loadedCalendar?.Calendar || null;

/**
* Loads the PrimeReact Calendar chunk (with the PrimeReact locale API) once per page; every caller shares the
* same load. A failed load is forgotten, so the next call retries it.
* @return {Promise<Function>} The Calendar component.
*/
const loadCalendar = () => {
  if (!calendarPromise) {
    calendarPromise = Promise.all([import('primereact/calendar'), import('primereact/api')])
      .then(([calendarModule, apiModule]) => {
        loadedCalendar = {
          Calendar: calendarModule.Calendar,
          addLocale: apiModule.addLocale,
          locale: apiModule.locale
        };

        return loadedCalendar.Calendar;
      })
      .catch(e => {
        calendarPromise = null;
        throw e;
      });
  }

  return calendarPromise;
};

/**
* Makes the extension's texts (month and day names, navigation labels) the active PrimeReact locale. Does
* nothing until loadCalendar() has resolved: the calendar is the only PrimeReact component that is localized.
* @param {Function} getMessage - The i18n getMessage function.
* @return {void}
*/
const applyCalendarLocale = getMessage => {
  if (!loadedCalendar) {
    return;
  }

  loadedCalendar.addLocale(PRIMEREACT_LOCALE_NAME, buildPrimeReactLocale(getMessage));
  loadedCalendar.locale(PRIMEREACT_LOCALE_NAME);
};

export { getLoadedCalendar, loadCalendar, applyCalendarLocale };
