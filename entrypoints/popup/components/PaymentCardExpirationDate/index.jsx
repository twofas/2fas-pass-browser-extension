// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardExpirationDate.module.scss';
import { forwardRef, memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import CalendarIcon from '@/assets/popup-window/calendar.svg?react';
import isExpirationDateInvalid from './validateExpirationDate';
import { useI18n } from '@/partials/context/I18nContext';
import { InputMask } from 'primereact/inputmask';
import { Calendar } from 'primereact/calendar';

const PANEL_CLASS = 'payment-card-expiration-date-panel';
const PANEL_WIDTH = 220;
const PANEL_HEIGHT = 183;
const PANEL_GAP = 8;
const VIEWPORT_PADDING = 8;

/**
* PaymentCardExpirationDate component for selecting card expiration date.
* Uses InputMask with MM/YY format and a calendar button for month picker popup.
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
  const { getMessage } = useI18n();
  const [containerElement, setContainerElement] = useState(null);
  const [positionClasses, setPositionClasses] = useState('');
  const calendarRef = useRef(null);
  const buttonRef = useRef(null);
  const isOpenRef = useRef(false);

  const containerCallbackRef = useCallback(node => {
    if (node) {
      setContainerElement(node);
    }
  }, []);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceAbove = buttonRect.top;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const shouldPlaceBelow = spaceAbove < PANEL_HEIGHT + PANEL_GAP && spaceBelow >= PANEL_HEIGHT + PANEL_GAP;
    const panelLeftEdge = buttonRect.right - PANEL_WIDTH;
    const shouldAlignLeft = panelLeftEdge < VIEWPORT_PADDING;
    const panelRightEdge = buttonRect.left + PANEL_WIDTH;
    const shouldAlignRight = !shouldAlignLeft && panelRightEdge > viewportWidth - VIEWPORT_PADDING;
    let classes = '';

    if (shouldPlaceBelow) {
      classes += ' position-below';
    }

    if (shouldAlignLeft) {
      classes += ' align-left';
    } else if (shouldAlignRight) {
      classes += ' align-right';
    }

    setPositionClasses(classes);
  }, []);

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

    const overlayPanel = calendarRef.current?.overlayRef?.current;
    const isYearPickerVisible = overlayPanel?.querySelector('.p-yearpicker');

    if (calendarRef.current && !isYearPickerVisible) {
      calendarRef.current.hide();
    }
  }, [formatDateToExpiration, onChange]);

  const handleCalendarButtonClick = useCallback(() => {
    if (!calendarRef.current) {
      return;
    }

    if (isOpenRef.current) {
      calendarRef.current.hide();
    } else {
      calculatePosition();
      calendarRef.current.show();
    }
  }, [calculatePosition]);

  const handleCalendarShow = useCallback(() => {
    isOpenRef.current = true;
  }, []);

  const handleCalendarHide = useCallback(() => {
    isOpenRef.current = false;
  }, []);

  const handleScroll = useCallback(e => {
    if (!isOpenRef.current || !calendarRef.current) {
      return;
    }

    const overlayPanel = calendarRef.current?.overlayRef?.current;

    if (overlayPanel && overlayPanel.contains(e.target)) {
      return;
    }

    calendarRef.current.hide();
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [handleScroll]);

  const inputClassName = `${S.paymentCardExpirationDateInput}${isInvalid ? ` ${S.paymentCardExpirationDateInputError}` : ''}`;

  if (isHighlySecretWithoutSif) {
    return (
      <div className={S.paymentCardExpirationDate}>
        <input
          ref={ref}
          className={inputClassName}
          value={displayValue}
          onChange={e => onChange(e.target.value)}
          placeholder=''
          id={inputId}
          disabled
        />
        <button
          ref={buttonRef}
          type='button'
          className={`${S.paymentCardExpirationDateButton} ${S.paymentCardExpirationDateButtonHidden}`}
          disabled
          title={getMessage('button_open_calendar')}
          tabIndex={-1}
        >
          <CalendarIcon />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerCallbackRef} className={S.paymentCardExpirationDate}>
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
        placeholder={getMessage('placeholder_payment_card_expiration_date')}
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
        title={getMessage('button_open_calendar')}
        tabIndex={-1}
      >
        <CalendarIcon />
      </button>
      <Calendar
        ref={calendarRef}
        className={S.paymentCardExpirationDateCalendar}
        panelClassName={`${PANEL_CLASS}${positionClasses}`}
        value={parseExpirationToDate(displayValue)}
        onChange={handleCalendarChange}
        onShow={handleCalendarShow}
        onHide={handleCalendarHide}
        view='month'
        dateFormat='mm/yy'
        disabled={disabled}
        appendTo={containerElement}
      />
    </div>
  );
});

export default memo(PaymentCardExpirationDate);
