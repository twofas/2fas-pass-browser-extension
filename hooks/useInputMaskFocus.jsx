// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback, useRef } from 'react';
import { getInputClickPosition } from '@/partials/functions';

/**
 * Calculates the maximum allowed cursor position based on actual value content.
 * For InputMask with slotChar=' ', finds the position after the last non-space character.
 * @param {string} value - The input value including slot characters.
 * @param {string} slotChar - The slot character used by InputMask (default: ' ').
 * @return {number} The maximum allowed cursor position.
 */
const getMaxCursorPosition = (value, slotChar = ' ') => {
  if (!value) {
    return 0;
  }

  let lastNonSlotIndex = -1;

  for (let i = value.length - 1; i >= 0; i--) {
    if (value[i] !== slotChar) {
      lastNonSlotIndex = i;
      break;
    }
  }

  return lastNonSlotIndex + 1;
};

/**
 * Hook for handling InputMask focus behavior to prevent select-all on focus.
 * PrimeReact InputMask selects all text when focused and mask is complete.
 * This hook overrides that behavior and positions cursor at click location.
 * Also restricts cursor position to not exceed the actual value length (excluding slot characters).
 * @param {string} slotChar - The slot character used by InputMask (default: ' ').
 * @return {Object} Object containing handleMouseDown, handleFocus, handleClick callbacks, and clickPositionRef.
 */
const useInputMaskFocus = (slotChar = ' ') => {
  const clickPositionRef = useRef(null);

  const handleMouseDown = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      clickPositionRef.current = null;
      return;
    }

    if (document.activeElement === inputElement) {
      clickPositionRef.current = null;
      return;
    }

    clickPositionRef.current = getInputClickPosition(inputElement, e.clientX);
  }, []);

  const handleFocus = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const savedClickPosition = clickPositionRef.current;

    clickPositionRef.current = null;

    setTimeout(() => {
      if (inputElement !== document.activeElement) {
        return;
      }

      const valueLength = inputElement.value.length;
      const selectionStart = inputElement.selectionStart;
      const selectionEnd = inputElement.selectionEnd;
      const maxPosition = getMaxCursorPosition(inputElement.value, slotChar);

      if (selectionStart === 0 && selectionEnd === valueLength) {
        if (savedClickPosition !== null) {
          const clampedPosition = Math.min(savedClickPosition, maxPosition);
          inputElement.setSelectionRange(clampedPosition, clampedPosition);
        } else {
          inputElement.setSelectionRange(maxPosition, maxPosition);
        }
      }
    }, 101);
  }, [slotChar]);

  const handleClick = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const maxPosition = getMaxCursorPosition(inputElement.value, slotChar);
    const currentPosition = inputElement.selectionStart;

    if (currentPosition > maxPosition) {
      inputElement.setSelectionRange(maxPosition, maxPosition);
    }
  }, [slotChar]);

  const handleDoubleClick = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const maxPosition = getMaxCursorPosition(inputElement.value, slotChar);
    const selectionStart = inputElement.selectionStart;
    const selectionEnd = inputElement.selectionEnd;

    if (selectionEnd > maxPosition) {
      e.preventDefault();
      const clampedStart = Math.min(selectionStart, maxPosition);
      inputElement.setSelectionRange(clampedStart, maxPosition);
    }
  }, [slotChar]);

  const handleKeyDown = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const maxPosition = getMaxCursorPosition(inputElement.value, slotChar);
    const currentPosition = inputElement.selectionStart;

    if (e.key === 'ArrowRight' || e.key === 'End') {
      if (currentPosition >= maxPosition) {
        e.preventDefault();
      } else if (e.key === 'End') {
        e.preventDefault();
        inputElement.setSelectionRange(maxPosition, maxPosition);
      }
    }
  }, [slotChar]);

  const handleKeyUp = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const maxPosition = getMaxCursorPosition(inputElement.value, slotChar);
    const currentPosition = inputElement.selectionStart;

    if (currentPosition > maxPosition) {
      inputElement.setSelectionRange(maxPosition, maxPosition);
    }
  }, [slotChar]);

  const handleSelect = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const maxPosition = getMaxCursorPosition(inputElement.value, slotChar);
    const selectionStart = inputElement.selectionStart;
    const selectionEnd = inputElement.selectionEnd;

    if (selectionStart > maxPosition || selectionEnd > maxPosition) {
      const clampedStart = Math.min(selectionStart, maxPosition);
      const clampedEnd = Math.min(selectionEnd, maxPosition);
      inputElement.setSelectionRange(clampedStart, clampedEnd);
    }
  }, [slotChar]);

  return { handleMouseDown, handleFocus, handleClick, handleDoubleClick, handleKeyDown, handleKeyUp, handleSelect, clickPositionRef };
};

export default useInputMaskFocus;
