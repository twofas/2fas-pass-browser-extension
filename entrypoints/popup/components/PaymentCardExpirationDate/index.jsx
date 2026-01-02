// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardExpirationDate.module.scss';
import { forwardRef, memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import CalendarIcon from '@/assets/popup-window/calendar.svg?react';
import isExpirationDateInvalid from './validateExpirationDate';

const PANEL_CLASS = 'payment-card-expiration-date-panel';
const PANEL_HEIGHT = 171;
const BOTTOM_BAR_HEIGHT = 72;
const TOP_BAR_HEIGHT = 56;
const MIN_SPACE_REQUIRED = 8;

/**
* PaymentCardExpirationDate component for selecting card expiration date.
* Uses InputMask with MM/YY format and a calendar button for month picker popup.
* Lazy loads PrimeReact components for optimized bundle size.
* @param {Object} props - Component props.
* @param {string} props.value - The expiration date value in MM/YY format.
* @param {Function} props.onChange - Change handler function receiving formatted string.
* @param {string} props.inputId - Input element ID.
* @param {boolean} props.disabled - Whether the component is disabled.
* @param {number} props.securityType - Security tier type (0=Top Secret, 1=Highly Secret, 2=Secret).
* @param {boolean} props.sifExists - Whether the secure input field data has been fetched.
* @param {Object} ref - Forwarded ref for the input element.
* @return {JSX.Element} The rendered component.
*/
const PaymentCardExpirationDate = forwardRef(({ value, onChange, inputId, disabled, securityType, sifExists }, ref) => {
  const [primeReactComponents, setPrimeReactComponents] = useState({ InputMask: null, Calendar: null });
  const calendarRef = useRef(null);
  const buttonRef = useRef(null);
  const isOpenRef = useRef(false);
  const loadedRef = useRef(false);
  const { handleMouseDown: handleInputMouseDown, handleFocus: handleInputFocus, handleClick: handleInputClick, handleDoubleClick: handleInputDoubleClick, handleKeyDown: handleInputKeyDown, handleKeyUp: handleInputKeyUp, handleSelect: handleInputSelect } = useInputMaskFocus();

  const isHighlySecretWithoutSif = securityType === SECURITY_TIER.HIGHLY_SECRET && !sifExists;
  const displayValue = isHighlySecretWithoutSif ? '' : value;

  const isInvalid = useMemo(
    () => isExpirationDateInvalid(displayValue),
    [displayValue]
  );

  const parseExpirationToDate = useCallback(stringValue => {
    if (!stringValue || typeof stringValue !== 'string') {
      return null;
    }

    const cleanValue = stringValue.replace(/\s/g, '');
    const parts = cleanValue.split('/');

    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
      return null;
    }

    const month = parseInt(parts[0], 10);
    const yearShort = parseInt(parts[1], 10);

    if (isNaN(month) || isNaN(yearShort) || month < 1 || month > 12) {
      return null;
    }

    const year = 2000 + yearShort;

    return new Date(year, month - 1, 1);
  }, []);

  const formatDateToExpiration = useCallback(dateValue => {
    if (!dateValue || !(dateValue instanceof Date)) {
      return '';
    }

    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const yearShort = String(dateValue.getFullYear()).slice(-2);

    return `${month}/${yearShort}`;
  }, []);

  const handleInputChange = useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);

  const handleCalendarChange = useCallback(e => {
    const formattedValue = formatDateToExpiration(e.value);

    onChange(formattedValue);

    if (calendarRef.current) {
      calendarRef.current.hide();
    }
  }, [formatDateToExpiration, onChange]);

  const positionPanel = useCallback(() => {
    if (!buttonRef.current) {
      return;
    }

    const panel = document.querySelector(`.${PANEL_CLASS}`);

    if (!panel) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom - BOTTOM_BAR_HEIGHT - MIN_SPACE_REQUIRED;
    const spaceAbove = buttonRect.top - TOP_BAR_HEIGHT - MIN_SPACE_REQUIRED;
    const shouldPlaceOnTop = spaceBelow < PANEL_HEIGHT && spaceAbove > PANEL_HEIGHT;

    let topPosition;

    if (shouldPlaceOnTop) {
      topPosition = buttonRect.top - PANEL_HEIGHT - MIN_SPACE_REQUIRED;
    } else {
      topPosition = buttonRect.bottom + MIN_SPACE_REQUIRED;
    }

    panel.style.top = `${topPosition}px`;
  }, []);

  const handleCalendarButtonClick = useCallback(() => {
    if (!calendarRef.current) {
      return;
    }

    if (isOpenRef.current) {
      calendarRef.current.hide();
    } else {
      calendarRef.current.show();
    }
  }, []);

  const handleCalendarShow = useCallback(() => {
    isOpenRef.current = true;
    requestAnimationFrame(() => {
      positionPanel();
    });
  }, [positionPanel]);

  const handleCalendarHide = useCallback(() => {
    isOpenRef.current = false;
  }, []);

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }

    loadedRef.current = true;

    Promise.all([
      import('primereact/inputmask'),
      import('primereact/calendar')
    ]).then(([inputMaskModule, calendarModule]) => {
      setPrimeReactComponents({
        InputMask: inputMaskModule.InputMask,
        Calendar: calendarModule.Calendar
      });
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isOpenRef.current && calendarRef.current) {
        calendarRef.current.hide();
      }
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const { InputMask, Calendar } = primeReactComponents;

  const inputClassName = `${S.paymentCardExpirationDateInput}${isInvalid ? ` ${S.paymentCardExpirationDateInputError}` : ''}`;

  if (!InputMask || !Calendar || isHighlySecretWithoutSif) {
    return (
      <div className={S.paymentCardExpirationDate}>
        <input
          ref={ref}
          className={inputClassName}
          value={displayValue}
          onChange={e => onChange(e.target.value)}
          placeholder={isHighlySecretWithoutSif ? '' : browser.i18n.getMessage('placeholder_payment_card_expiration_date')}
          id={inputId}
          disabled={!InputMask || !Calendar || isHighlySecretWithoutSif}
        />
        <button
          ref={buttonRef}
          type='button'
          className={`${S.paymentCardExpirationDateButton} ${S.paymentCardExpirationDateButtonHidden}`}
          disabled
          title={browser.i18n.getMessage('button_open_calendar')}
          tabIndex={-1}
        >
          <CalendarIcon />
        </button>
      </div>
    );
  }

  return (
    <div className={S.paymentCardExpirationDate}>
      <InputMask
        ref={ref}
        className={inputClassName}
        value={displayValue}
        onChange={handleInputChange}
        onMouseDown={handleInputMouseDown}
        onFocus={handleInputFocus}
        onClick={handleInputClick}
        onDoubleClick={handleInputDoubleClick}
        onKeyDown={handleInputKeyDown}
        onKeyUp={handleInputKeyUp}
        onSelect={handleInputSelect}
        mask='99/99'
        slotChar=' '
        placeholder={browser.i18n.getMessage('placeholder_payment_card_expiration_date')}
        id={inputId}
        disabled={disabled}
        autoClear={false}
      />
      <button
        ref={buttonRef}
        type='button'
        className={`${S.paymentCardExpirationDateButton} ${disabled ? S.paymentCardExpirationDateButtonHidden : ''}`}
        onClick={handleCalendarButtonClick}
        disabled={disabled}
        title={browser.i18n.getMessage('button_open_calendar')}
        tabIndex={-1}
      >
        <CalendarIcon />
      </button>
      <Calendar
        ref={calendarRef}
        className={S.paymentCardExpirationDateCalendar}
        panelClassName={PANEL_CLASS}
        value={parseExpirationToDate(displayValue)}
        onChange={handleCalendarChange}
        onShow={handleCalendarShow}
        onHide={handleCalendarHide}
        view='month'
        dateFormat='mm/yy'
        disabled={disabled}
      />
    </div>
  );
});

export default memo(PaymentCardExpirationDate);
