// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardSecurityCodeInput.module.scss';
import { forwardRef, memo, useMemo, useRef, useLayoutEffect, useCallback, useState, useEffect } from 'react';
import getSecurityCodeMask from './getSecurityCodeMask';

/**
* PaymentCardSecurityCodeInput component with dynamic mask based on card type.
* Lazy loads PrimeReact InputMask for optimized bundle size.
* @param {Object} props - Component props.
* @param {string} props.value - The security code value.
* @param {Function} props.onChange - Change handler function.
* @param {string} props.id - Input element ID.
* @param {string} props.cardNumber - The card number to determine mask (Amex uses 4 digits).
* @param {number} props.securityType - Security tier type (0=Top Secret, 1=Highly Secret, 2=Secret).
* @param {boolean} props.sifExists - Whether the secure input field data has been fetched.
* @param {Object} props.inputProps - Additional props to spread on InputMask.
* @param {Object} ref - Forwarded ref for the input element.
* @return {JSX.Element} The rendered component.
*/
const PaymentCardSecurityCodeInput = forwardRef(({ value, onChange, id, cardNumber, securityType, sifExists, ...inputProps }, ref) => {
  const [InputMask, setInputMask] = useState(null);
  const cursorPositionRef = useRef(null);
  const previousMaskRef = useRef(null);
  const loadedRef = useRef(false);
  const { handleMouseDown, handleFocus } = useInputMaskFocus();

  const isHighlySecretWithoutSif = securityType === SECURITY_TIER.HIGHLY_SECRET && !sifExists;
  const displayValue = isHighlySecretWithoutSif ? '' : value;

  const securityCodeMaskData = useMemo(
    () => getSecurityCodeMask(cardNumber),
    [cardNumber]
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
    if (previousMaskRef.current && previousMaskRef.current !== securityCodeMaskData.mask) {
      if (cursorPositionRef.current !== null) {
        const inputElement = document.getElementById(id);
        const hasFocus = document.activeElement === inputElement;

        if (inputElement && hasFocus) {
          const savedCursorPos = cursorPositionRef.current;

          setTimeout(() => {
            inputElement.setSelectionRange(savedCursorPos, savedCursorPos);
          }, 0);
        }
      }
    }

    previousMaskRef.current = securityCodeMaskData.mask;
  }, [securityCodeMaskData.mask, id]);

  const handleChange = useCallback(e => {
    const domInput = document.getElementById(id);

    cursorPositionRef.current = domInput?.selectionStart;
    onChange(e);
  }, [id, onChange]);

  if (!InputMask) {
    return (
      <input
        {...inputProps}
        ref={ref}
        className={S.paymentCardSecurityCodeInput}
        type='text'
        value={displayValue}
        placeholder={browser.i18n.getMessage('placeholder_payment_card_security_code')}
        id={id}
        onChange={e => onChange(e)}
        disabled
      />
    );
  }

  return (
    <InputMask
      {...inputProps}
      ref={ref}
      className={S.paymentCardSecurityCodeInput}
      type='text'
      mask={securityCodeMaskData.mask}
      autoClear={false}
      value={displayValue}
      placeholder={browser.i18n.getMessage('placeholder_payment_card_security_code')}
      id={id}
      onChange={handleChange}
      onMouseDown={handleMouseDown}
      onFocus={handleFocus}
    />
  );
});

export default memo(PaymentCardSecurityCodeInput);
