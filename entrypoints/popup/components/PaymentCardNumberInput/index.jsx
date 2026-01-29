// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardNumberInput.module.scss';
import { forwardRef, memo, useMemo, useRef, useLayoutEffect, useCallback, useState, useEffect } from 'react';
import getCardNumberMask from './getCardNumberMask';
import isCardNumberInvalid from './validateCardNumber';
import { useI18n } from '@/partials/context/I18nContext';

/**
* PaymentCardNumberInput component with dynamic mask based on card type.
* Lazy loads PrimeReact InputMask for optimized bundle size.
* @param {Object} props - Component props.
* @param {string} props.value - The card number value.
* @param {Function} props.onChange - Change handler function.
* @param {string} props.id - Input element ID.
* @param {number} props.securityType - Security tier type (0=Top Secret, 1=Highly Secret, 2=Secret).
* @param {boolean} props.sifExists - Whether the secure input field data has been fetched.
* @param {string} props.placeholder - Optional placeholder text override.
* @param {Object} props.inputProps - Additional props to spread on InputMask.
* @param {Object} ref - Forwarded ref for the input element.
* @return {JSX.Element} The rendered component.
*/
const PaymentCardNumberInput = forwardRef(({ value, onChange, id, securityType, sifExists, placeholder, ...inputProps }, ref) => {
  const { getMessage } = useI18n();
  const [InputMask, setInputMask] = useState(null);
  const cursorPositionRef = useRef(null);
  const previousMaskRef = useRef(null);
  const loadedRef = useRef(false);
  const { handleMouseDown, handleFocus, handleClick, handleDoubleClick, handleKeyDown, handleKeyUp, handleSelect } = useInputMaskFocus();

  const isHighlySecretWithoutSif = securityType === SECURITY_TIER.HIGHLY_SECRET && !sifExists;
  const displayValue = isHighlySecretWithoutSif ? '' : value;

  const mask = useMemo(
    () => getCardNumberMask(displayValue),
    [displayValue]
  );

  const isInvalid = useMemo(
    () => isCardNumberInvalid(displayValue),
    [displayValue]
  );

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }

    loadedRef.current = true;

    import('primereact/inputmask').then(module => {
      setInputMask(() => module.InputMask);
    });
  }, []);

  useLayoutEffect(() => {
    if (previousMaskRef.current && previousMaskRef.current !== mask) {
      if (cursorPositionRef.current !== null) {
        const savedCursorPos = cursorPositionRef.current;

        setTimeout(() => {
          const inputElement = document.getElementById(id);

          if (inputElement) {
            inputElement.focus();
            inputElement.setSelectionRange(savedCursorPos, savedCursorPos);
          }
        }, 0);
      }
    }

    previousMaskRef.current = mask;
  }, [mask, id]);

  const handleChange = useCallback(e => {
    const domInput = document.getElementById(id);

    cursorPositionRef.current = domInput?.selectionStart;
    onChange(e);
  }, [id, onChange]);

  const effectivePlaceholder = placeholder ?? (isHighlySecretWithoutSif ? '' : getMessage('placeholder_payment_card_number'));

  const inputClassName = `${S.paymentCardNumberInput}${isInvalid ? ` ${S.paymentCardNumberInputError}` : ''}`;

  if (!InputMask || isHighlySecretWithoutSif) {
    return (
      <input
        {...inputProps}
        ref={ref}
        placeholder={effectivePlaceholder}
        className={inputClassName}
        type='text'
        value={displayValue}
        id={id}
        onChange={e => onChange(e)}
        disabled={!InputMask || isHighlySecretWithoutSif}
      />
    );
  }

  return (
    <InputMask
      {...inputProps}
      ref={ref}
      placeholder={effectivePlaceholder}
      className={inputClassName}
      type='text'
      mask={mask}
      slotChar=' '
      autoClear={false}
      value={displayValue}
      id={id}
      onChange={handleChange}
      onMouseDown={handleMouseDown}
      onFocus={handleFocus}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onSelect={handleSelect}
    />
  );
});

export default memo(PaymentCardNumberInput);
