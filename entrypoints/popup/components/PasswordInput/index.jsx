// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useRef, useEffect, useCallback } from 'react';
import S from './PasswordInput.module.scss';
import usePopupStateStore from '../../store/popupState';

/**
 * PasswordInput component that displays each character with different colors
 * Numbers: blue, Special characters: green, Letters: default text color
 * @param {Object} props - Component props
 * @return {JSX.Element} The rendered component
 */
function PasswordInput (props) {
  const {
    value = '',
    onChange,
    disabled = false,
    disabledColors = false,
    showPassword = false,
    isDecrypted = false,
    passwordDecryptError = false,
    id,
    state = '',
    className = '',
    ...inputProps
  } = props;

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);
  
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef(null);
  const displayRef = useRef(null);
  const textWrapperRef = useRef(null);
  const previousValueRef = useRef(value);
  const isTypingRef = useRef(false);
  
  const getCharacterType = useCallback((char) => {
    if (/[0-9]/.test(char)) {
      return 'number';
    } else if (/[^a-zA-Z0-9]/.test(char)) {
      return 'special';
    } else {
      return 'letter';
    }
  }, []);
  
  const handleChange = useCallback((e) => {
    isTypingRef.current = true;

    if (onChange) {
      onChange(e);
    }

    if (!data?.passwordEdited) {
      setData('passwordEdited', true);
    }

    data.item.s_password = e.target.value;
    setData('item', data.item);

    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  }, [onChange, data]);
  
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();

      if (inputRef.current && value) {
        inputRef.current.setSelectionRange(0, value.length);
        setTimeout(() => {
          setSelection({ start: 0, end: value.length });
        }, 0);
      }
    }
  }, [value]);
  
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setSelection({ start: 0, end: 0 });
  }, []);
  
  const updateSelection = useCallback(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      const start = Math.min(inputRef.current.selectionStart || 0, value.length);
      const end = Math.min(inputRef.current.selectionEnd || 0, value.length);
      setSelection({ start, end });
    }
  }, [value]);
  
  const handleMouseDown = useCallback(() => {
    setTimeout(updateSelection, 0);
  }, [updateSelection]);
  
  const handleMouseMove = useCallback((e) => {
    if (e.buttons === 1) {
      updateSelection();
    }
  }, [updateSelection]);
  
  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    
    const handleSelectionChange = () => updateSelection();
    const handleMouseUp = () => {
      setTimeout(updateSelection, 0);
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    input.addEventListener('select', handleSelectionChange);
    input.addEventListener('mouseup', handleMouseUp);
    input.addEventListener('keyup', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      input.removeEventListener('select', handleSelectionChange);
      input.removeEventListener('mouseup', handleMouseUp);
      input.removeEventListener('keyup', handleSelectionChange);
    };
  }, [updateSelection]);
  
  const getCursorPixelPosition = useCallback(() => {
    const cursorPos = selection.end;

    if (!value || cursorPos === 0) {
      return 0;
    }

    const validCursorPos = Math.min(cursorPos, value.length);

    const tempSpan = document.createElement('span');
    tempSpan.style.cssText = 'visibility:hidden;position:absolute;font-size:14px;font-weight:400;font-family:monospace;white-space:pre;letter-spacing:normal';

    const displayText = showPassword ? value : '•'.repeat(value.length);
    tempSpan.textContent = displayText.substring(0, validCursorPos);

    document.body.appendChild(tempSpan);
    const width = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);

    return width;
  }, [selection.end, value, showPassword]);
  
  const getCharWidth = useCallback(() => {
    const tempSpan = document.createElement('span');
    tempSpan.style.cssText = 'visibility:hidden;position:absolute;font-size:14px;font-weight:400;font-family:monospace';
    tempSpan.textContent = showPassword ? 'a' : '•';
    document.body.appendChild(tempSpan);
    const width = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    return width;
  }, [showPassword]);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    const prevLength = previousValueRef.current?.length || 0;
    const newLength = value?.length || 0;
    const isExternalChange = !isTypingRef.current && Math.abs(newLength - prevLength) > 1;

    if (isFocused && value && isExternalChange) {
      setTimeout(() => {
        if (inputRef.current && isFocused) {
          inputRef.current.setSelectionRange(newLength, newLength);
          setSelection({ start: newLength, end: newLength });
        }
      }, 0);
    }

    previousValueRef.current = value;
  }, [value, isFocused]);

  useEffect(() => {
    if (!isFocused || !displayRef.current || !textWrapperRef.current) {
      return;
    }

    const cursorPosition = getCursorPixelPosition();
    const displayWidth = displayRef.current.clientWidth;
    const scrollLeft = displayRef.current.scrollLeft;
    const charWidth = getCharWidth();

    const visibleCursorPosition = cursorPosition - scrollLeft;

    if (visibleCursorPosition < 0 && selection.end > 0) {
      displayRef.current.scrollLeft = Math.max(0, scrollLeft - charWidth);
    } else if (visibleCursorPosition > displayWidth - 20) {
      displayRef.current.scrollLeft = cursorPosition - displayWidth + 20;
    }
  }, [selection, getCursorPixelPosition, isFocused, getCharWidth]);
  
  const renderColoredText = () => {
    if (!value) {
      return null;
    }
    
    const characters = value.split('');
    const shouldColorize = isDecrypted && showPassword;
    const hasSelection = selection.start !== selection.end;
    const minSelection = Math.min(selection.start, selection.end);
    const maxSelection = Math.max(selection.start, selection.end);
    
    return characters.map((char, index) => {
      const charType = shouldColorize ? getCharacterType(char) : 'default';
      const isPassword = !showPassword;
      const isSelected = hasSelection && index >= minSelection && index < maxSelection;
      
      return (
        <span
          key={index}
          className={`${S.passwordInputCharacter} ${shouldColorize ? S[`passwordInputCharacter${charType.charAt(0).toUpperCase() + charType.slice(1)}`] : ''} ${isSelected ? S.passwordInputCharacterSelected : ''}`}
          data-index={index}
        >
          {isPassword ? '•' : char}
        </span>
      );
    });
  };
  
  return (
    <div className={`${S.passwordInput} ${className} ${disabled ? (disabledColors ? S.disabledColors : S.disabled) : ''}`}>
      <div 
        ref={displayRef}
        className={`${S.passwordInputDisplay} ${isFocused ? S.passwordInputDisplayFocused : ''}`}
      >
        <input
          ref={inputRef}
          type='text'
          {...inputProps}
          id={id}
          value={value}
          onChange={handleChange}
          onInput={updateSelection}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={updateSelection}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={S.passwordInputHiddenInput}
        />

        <div ref={textWrapperRef} className={`${S.passwordInputTextWrapper} ${passwordDecryptError || state === 'hidden' ? S.passwordInputHidden : ''}`}>
          {renderColoredText()}
          {isFocused && selection.start === selection.end ? (
            <span
              className={S.passwordInputCursor}
              style={{
                left: `${getCursorPixelPosition()}px`,
                transition: 'none'
              }}
            />
          ) : null}
        </div>
        {!value && (
          <span className={S.passwordInputPlaceholder}>
            {inputProps.placeholder || ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default PasswordInput;