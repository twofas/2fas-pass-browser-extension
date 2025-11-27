// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardExpirationDate.module.scss';
import { memo, useMemo, useCallback } from 'react';
import { Calendar } from 'primereact/calendar';

/**
* PaymentCardExpirationDate component for selecting card expiration date.
* @param {Object} props - Component props.
* @param {string} props.value - The expiration date value in MM/YYYY format.
* @param {Function} props.onChange - Change handler function receiving formatted string.
* @param {string} props.inputId - Input element ID.
* @return {JSX.Element} The rendered component.
*/
function PaymentCardExpirationDate ({ value, onChange, inputId }) {
  const calendarMinDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const parseExpirationDateToDate = useCallback(stringValue => {
    if (!stringValue || typeof stringValue !== 'string') {
      return null;
    }

    const parts = stringValue.split('/');

    if (parts.length !== 2) {
      return null;
    }

    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return null;
    }

    return new Date(year, month - 1, 1);
  }, []);

  const formatDateToExpirationString = useCallback(dateValue => {
    if (!dateValue || !(dateValue instanceof Date)) {
      return '';
    }

    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const year = dateValue.getFullYear();

    return `${month}/${year}`;
  }, []);

  const handleChange = useCallback(e => {
    const formattedValue = formatDateToExpirationString(e.value);
    onChange(formattedValue);
  }, [formatDateToExpirationString, onChange]);

  return (
    <Calendar
      className={S.paymentCardExpirationDate}
      value={parseExpirationDateToDate(value)}
      dateFormat='mm/y'
      view='month'
      minDate={calendarMinDate}
      placeholder='MM/YY'
      inputId={inputId}
      onChange={handleChange}
    />
  );
}

export default memo(PaymentCardExpirationDate);
