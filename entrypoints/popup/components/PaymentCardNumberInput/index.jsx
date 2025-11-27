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

  const cardMaskData = useMemo(
    () => getCardNumberMask(value),
    [value]
  );

  useLayoutEffect(() => {
    if (previousMaskRef.current && previousMaskRef.current !== cardMaskData.mask) {
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

    previousMaskRef.current = cardMaskData.mask;
  }, [cardMaskData.mask, id]);

  const handleChange = useCallback(e => {
    const domInput = document.getElementById(id);

    cursorPositionRef.current = domInput?.selectionStart;
    onChange(e);
  }, [id, onChange]);

  return (
    <InputMask
      {...inputProps}
      className={S.paymentCardNumberInput}
      type='text'
      mask={cardMaskData.mask}
      autoClear={false}
      value={value}
      placeholder={cardMaskData.placeholder}
      id={id}
      onChange={handleChange}
    />
  );
}

export default memo(PaymentCardNumberInput);
