// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
 * Builds the PrimeReact locale configuration object using getMessage function.
 * @param {Function} getMessageFn - The getMessage function from i18n context.
 * @return {Object} PrimeReact locale configuration object.
 */
const buildPrimeReactLocale = getMessageFn => {
  return {
    firstDayOfWeek: 1,
    dayNames: [
      getMessageFn('primereact_day_sunday'),
      getMessageFn('primereact_day_monday'),
      getMessageFn('primereact_day_tuesday'),
      getMessageFn('primereact_day_wednesday'),
      getMessageFn('primereact_day_thursday'),
      getMessageFn('primereact_day_friday'),
      getMessageFn('primereact_day_saturday')
    ],
    dayNamesShort: [
      getMessageFn('primereact_day_short_sun'),
      getMessageFn('primereact_day_short_mon'),
      getMessageFn('primereact_day_short_tue'),
      getMessageFn('primereact_day_short_wed'),
      getMessageFn('primereact_day_short_thu'),
      getMessageFn('primereact_day_short_fri'),
      getMessageFn('primereact_day_short_sat')
    ],
    dayNamesMin: [
      getMessageFn('primereact_day_min_su'),
      getMessageFn('primereact_day_min_mo'),
      getMessageFn('primereact_day_min_tu'),
      getMessageFn('primereact_day_min_we'),
      getMessageFn('primereact_day_min_th'),
      getMessageFn('primereact_day_min_fr'),
      getMessageFn('primereact_day_min_sa')
    ],
    monthNames: [
      getMessageFn('primereact_month_january'),
      getMessageFn('primereact_month_february'),
      getMessageFn('primereact_month_march'),
      getMessageFn('primereact_month_april'),
      getMessageFn('primereact_month_may'),
      getMessageFn('primereact_month_june'),
      getMessageFn('primereact_month_july'),
      getMessageFn('primereact_month_august'),
      getMessageFn('primereact_month_september'),
      getMessageFn('primereact_month_october'),
      getMessageFn('primereact_month_november'),
      getMessageFn('primereact_month_december')
    ],
    monthNamesShort: [
      getMessageFn('primereact_month_short_jan'),
      getMessageFn('primereact_month_short_feb'),
      getMessageFn('primereact_month_short_mar'),
      getMessageFn('primereact_month_short_apr'),
      getMessageFn('primereact_month_short_may'),
      getMessageFn('primereact_month_short_jun'),
      getMessageFn('primereact_month_short_jul'),
      getMessageFn('primereact_month_short_aug'),
      getMessageFn('primereact_month_short_sep'),
      getMessageFn('primereact_month_short_oct'),
      getMessageFn('primereact_month_short_nov'),
      getMessageFn('primereact_month_short_dec')
    ],
    today: getMessageFn('primereact_today'),
    clear: getMessageFn('primereact_clear'),
    chooseMonth: getMessageFn('primereact_choose_month'),
    chooseYear: getMessageFn('primereact_choose_year'),
    prevMonth: getMessageFn('primereact_prev_month'),
    nextMonth: getMessageFn('primereact_next_month'),
    prevYear: getMessageFn('primereact_prev_year'),
    nextYear: getMessageFn('primereact_next_year'),
    prevDecade: getMessageFn('primereact_prev_decade'),
    nextDecade: getMessageFn('primereact_next_decade')
  };
};

export default buildPrimeReactLocale;
