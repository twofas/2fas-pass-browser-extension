// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PaymentCardNumberInput.module.scss';
import { memo, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { InputMask } from 'primereact/inputmask';
import getCardNumberMask from './getCardNumberMask';

/**
* PaymentCardNumberInput component with dynamic mask based on card type.
* @param {Object} props - Component props.
* @param {string} props.value - The card number value.
* @param {Function} props.onChange - Change handler function.
* @param {string} props.id - Input element ID.
* @param {Object} props.inputProps - Additional props to spread on InputMask.
* @return {JSX.Element} The rendered component.
*/
function PaymentCardNumberInput ({ value, onChange, id, ...inputProps }) {
  const cursorPositionRef = useRef(null);
  const previousMaskRef = useRef(null);

  const mask = useMemo(
    () => getCardNumberMask(value),
    [value]
  );

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

  return (
    <InputMask
      {...inputProps}
      placeholder={browser.i18n.getMessage('placeholder_payment_card_number')}
      className={S.paymentCardNumberInput}
      type='text'
      mask={mask}
      autoClear={false}
      value={value}
      id={id}
      onChange={handleChange}
    />
  );
}

export default memo(PaymentCardNumberInput);
