// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardSecurityCodeInput.module.scss';
import { memo, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { InputMask } from 'primereact/inputmask';
import getSecurityCodeMask from './getSecurityCodeMask';

/**
* PaymentCardSecurityCodeInput component with dynamic mask based on card type.
* @param {Object} props - Component props.
* @param {string} props.value - The security code value.
* @param {Function} props.onChange - Change handler function.
* @param {string} props.id - Input element ID.
* @param {string} props.cardNumber - The card number to determine mask (Amex uses 4 digits).
* @param {Object} props.inputProps - Additional props to spread on InputMask.
* @return {JSX.Element} The rendered component.
*/
function PaymentCardSecurityCodeInput ({ value, onChange, id, cardNumber, ...inputProps }) {
  const cursorPositionRef = useRef(null);
  const previousMaskRef = useRef(null);

  const securityCodeMaskData = useMemo(
    () => getSecurityCodeMask(cardNumber),
    [cardNumber]
  );

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

  return (
    <InputMask
      {...inputProps}
      className={S.paymentCardSecurityCodeInput}
      type='text'
      mask={securityCodeMaskData.mask}
      autoClear={false}
      value={value}
      placeholder={browser.i18n.getMessage('placeholder_payment_card_security_code')}
      id={id}
      onChange={handleChange}
    />
  );
}

export default memo(PaymentCardSecurityCodeInput);
