// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useRef, useEffect, useCallback } from 'react';
import S from './PasswordInput.module.scss';

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


  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);
  const inputRef = useRef(null);
  const displayRef = useRef(null);
  const textWrapperRef = useRef(null);
  const previousValueRef = useRef(value);
  const isTypingRef = useRef(false);
  const lastInteractionRef = useRef(null);
  const scrollLeftRef = useRef(0); // Keep real-time scroll value in ref
  
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
    const oldLength = value?.length || 0;
    const newLength = e.target.value?.length || 0;

    isTypingRef.current = true;
    lastInteractionRef.current = 'typing';

    // Track if we're adding characters at the end
    if (newLength > oldLength && inputRef.current) {
      const cursorPos = inputRef.current.selectionEnd;
      if (cursorPos === newLength) {
        // User is typing at the end - ensure cursor will be visible
      }
    }

    if (onChange) {
      onChange(e);
    }

    setTimeout(() => {
      isTypingRef.current = false;
      // Keep typing interaction longer for scroll adjustments
      setTimeout(() => {
        if (lastInteractionRef.current === 'typing') {
          lastInteractionRef.current = null;
        }
      }, 200);
    }, 100);
  }, [onChange, value]);
  
  const updateSelection = useCallback(() => {
    if (inputRef.current) {
      const start = Math.min(inputRef.current.selectionStart || 0, value.length);
      const end = Math.min(inputRef.current.selectionEnd || 0, value.length);

      // Always update selection if it has changed, regardless of focus
      // This ensures mouse clicks update the cursor immediately
      if (start !== selection.start || end !== selection.end) {
        setSelection({ start, end });
      }
    }
  }, [value, selection]);

  const handleKeyDown = useCallback((e) => {
    // Handle regular typing - pass it to the hidden input
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && inputRef.current) {
      e.preventDefault();

      // Simulate the key press on the hidden input
      const start = selection.start;
      const end = selection.end;
      const newValue = value.substring(0, start) + e.key + value.substring(end);

      // Create a synthetic event for onChange
      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: start + 1,
          selectionEnd: start + 1
        }
      };

      handleChange(syntheticEvent);
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(start + 1, start + 1);
      setSelection({ start: start + 1, end: start + 1 });

      return;
    }

    // Handle backspace
    if (e.key === 'Backspace' && inputRef.current) {
      e.preventDefault();

      const start = selection.start;
      const end = selection.end;
      let newValue, newPos;

      if (start !== end) {
        // Delete selection
        newValue = value.substring(0, start) + value.substring(end);
        newPos = start;
      } else if (start > 0) {
        // Delete character before cursor
        newValue = value.substring(0, start - 1) + value.substring(start);
        newPos = start - 1;
      } else {
        return; // Nothing to delete
      }

      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: newPos,
          selectionEnd: newPos
        }
      };

      handleChange(syntheticEvent);
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(newPos, newPos);
      setSelection({ start: newPos, end: newPos });

      return;
    }

    // Handle Delete key
    if (e.key === 'Delete' && inputRef.current) {
      e.preventDefault();

      const start = selection.start;
      const end = selection.end;
      let newValue;

      if (start !== end) {
        // Delete selection
        newValue = value.substring(0, start) + value.substring(end);
      } else if (start < value.length) {
        // Delete character after cursor
        newValue = value.substring(0, start) + value.substring(start + 1);
      } else {
        return; // Nothing to delete
      }

      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: start,
          selectionEnd: start
        }
      };

      handleChange(syntheticEvent);
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(start, start);
      setSelection({ start, end: start });

      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();

      if (inputRef.current && value) {
        inputRef.current.setSelectionRange(0, value.length);
        setSelection({ start: 0, end: value.length });
      }
    }

    // Handle End key or Ctrl/Cmd+Right to jump to end
    if (e.key === 'End' || ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight')) {
      e.preventDefault();
      if (inputRef.current && displayRef.current && textWrapperRef.current) {
        const endPos = value.length;
        inputRef.current.setSelectionRange(endPos, endPos);
        setSelection({ start: endPos, end: endPos });

        // Scroll to show the end
        const displayWidth = displayRef.current.clientWidth;
        const maxScroll = textWrapperRef.current.scrollWidth - displayWidth;
        if (maxScroll > 0) {
          displayRef.current.scrollLeft = maxScroll;
          scrollLeftRef.current = maxScroll;
          setScrollLeft(maxScroll);
        }
      }
      lastInteractionRef.current = 'keyboard';
      return;
    }

    // Handle Home key or Ctrl/Cmd+Left to jump to beginning
    if (e.key === 'Home' || ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft')) {
      e.preventDefault();
      if (inputRef.current && displayRef.current) {
        inputRef.current.setSelectionRange(0, 0);
        setSelection({ start: 0, end: 0 });

        // Scroll to beginning
        displayRef.current.scrollLeft = 0;
        scrollLeftRef.current = 0;
        setScrollLeft(0);
      }
      lastInteractionRef.current = 'keyboard';
      return;
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && inputRef.current) {
      e.preventDefault();
      const newPos = Math.max(0, selection.start - 1);
      inputRef.current.setSelectionRange(newPos, newPos);
      setSelection({ start: newPos, end: newPos });
      lastInteractionRef.current = 'keyboard';

      return;
    }

    if (e.key === 'ArrowRight' && inputRef.current) {
      e.preventDefault();
      const newPos = Math.min(value.length, selection.end + 1);
      inputRef.current.setSelectionRange(newPos, newPos);
      setSelection({ start: newPos, end: newPos });
      lastInteractionRef.current = 'keyboard';

      return;
    }
  }, [value, selection, handleChange]);

  const handleWheel = useCallback((e) => {
    if (displayRef.current && e.deltaX !== 0) {
      // Only handle horizontal scrolling (deltaX)
      // Do NOT convert vertical scrolling to horizontal
      e.preventDefault();
      const newScroll = Math.max(0, displayRef.current.scrollLeft + e.deltaX);
      displayRef.current.scrollLeft = newScroll;
      const actualScroll = displayRef.current.scrollLeft;

      scrollLeftRef.current = actualScroll;
      setScrollLeft(actualScroll);
      lastInteractionRef.current = 'wheel';
    }
  }, []);

  const handleDisplayScroll = useCallback(() => {
    if (displayRef.current) {
      const newScrollLeft = displayRef.current.scrollLeft;

      scrollLeftRef.current = newScrollLeft;
      setScrollLeft(newScrollLeft);
      lastInteractionRef.current = 'scroll';
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    lastInteractionRef.current = 'mouse';

    // Get click position relative to the display div
    if (displayRef.current && textWrapperRef.current) {
      const displayRect = displayRef.current.getBoundingClientRect();
      const currentScroll = displayRef.current.scrollLeft;

      // Update scrollLeftRef to ensure cursor position is correct
      scrollLeftRef.current = currentScroll;

      const displayWidth = displayRef.current.clientWidth;
      const clickXInViewport = e.clientX - displayRect.left;
      const clickX = clickXInViewport + currentScroll;

      // Find which character was clicked
      const spans = textWrapperRef.current.querySelectorAll(`span[class*="${S.passwordInputCharacter}"]`);
      let clickedIndex = value.length; // Default to end

      // Check if clicked beyond visible area (trying to scroll)
      if (clickXInViewport >= displayWidth - 10) {
        // Clicked at the right edge - place cursor at end and scroll to end
        clickedIndex = value.length;

        // Scroll to show the end
        const maxScroll = textWrapperRef.current.scrollWidth - displayWidth;
        if (maxScroll > 0 && currentScroll < maxScroll) {
          displayRef.current.scrollLeft = maxScroll;
          scrollLeftRef.current = maxScroll;
          setScrollLeft(maxScroll);
        }
      } else if (spans.length > 0) {
        const lastSpan = spans[spans.length - 1];
        const lastSpanEnd = lastSpan.offsetLeft + lastSpan.offsetWidth;

        if (clickX >= lastSpanEnd) {
          // Clicked beyond the last character - place cursor at end
          clickedIndex = value.length;
        } else {
          // Find the clicked character
          for (let i = 0; i < spans.length; i++) {
            const span = spans[i];
            const spanLeft = span.offsetLeft;
            const spanRight = spanLeft + span.offsetWidth;

            if (clickX >= spanLeft && clickX <= spanRight) {
              // Clicked on this character - determine if left or right half
              const spanMid = spanLeft + span.offsetWidth / 2;
              clickedIndex = clickX < spanMid ? i : i + 1;
              break;
            } else if (clickX < spanLeft) {
              // Clicked before this character
              clickedIndex = i;
              break;
            }
          }
        }
      }

      // Set cursor position immediately
      if (clickedIndex !== undefined && inputRef.current) {
        // Update both the hidden input's selection (for keyboard events to work)
        // and our internal selection state (for display)
        inputRef.current.setSelectionRange(clickedIndex, clickedIndex);
        setSelection({ start: clickedIndex, end: clickedIndex });

        // Also update scroll state to trigger re-render with correct cursor position
        setScrollLeft(currentScroll);
      }
    }

    // No need for timeout - selection is updated immediately above
  }, [updateSelection, value, S.passwordInputCharacter]);
  
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

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const display = displayRef.current;
    if (!display) {
      return;
    }

    // Add the wheel listener with passive: false
    display.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      display.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  const getCursorAbsolutePosition = useCallback(() => {
    const cursorPos = selection.end;

    if (!value) {
      return 0;
    }

    const validCursorPos = Math.min(cursorPos, value.length);

    if (validCursorPos === 0) {
      return 0;
    }

    // Use offsetLeft which gives us position relative to the parent element
    if (textWrapperRef.current) {
      const spans = textWrapperRef.current.querySelectorAll(`span[class*="${S.passwordInputCharacter}"]`);
      if (spans.length > 0) {
        let absolutePosition = 0;

        if (validCursorPos >= spans.length) {
          // Cursor is at the end - use last character's offsetLeft + offsetWidth
          const lastSpan = spans[spans.length - 1];
          absolutePosition = lastSpan.offsetLeft + lastSpan.offsetWidth;
        } else {
          // Cursor is between characters - use character's offsetLeft
          absolutePosition = spans[validCursorPos].offsetLeft;
        }

        return absolutePosition;
      }
    }

    // Fallback: calculate based on character index and estimated width
    // Measure a sample character to get the actual width
    const testSpan = document.createElement('span');
    testSpan.style.fontFamily = 'monospace';
    testSpan.style.fontSize = '14px';
    testSpan.style.fontWeight = '400';
    testSpan.style.position = 'absolute';
    testSpan.style.visibility = 'hidden';
    testSpan.textContent = '•';
    document.body.appendChild(testSpan);
    const charWidth = testSpan.offsetWidth;
    document.body.removeChild(testSpan);

    // Account for letter-spacing (approximately 0.4-0.5px per character)
    const letterSpacing = 0.45;
    const position = validCursorPos * (charWidth + letterSpacing);

    return position;
  }, [selection.end, value, showPassword]);
  

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
    // Don't auto-scroll if user is manually scrolling with wheel
    if (!isFocused || !displayRef.current || lastInteractionRef.current === 'wheel') {
      return;
    }

    const cursorPosition = getCursorAbsolutePosition();
    const displayWidth = displayRef.current.clientWidth;
    // CRITICAL: Use actual DOM scroll position, not state
    const currentScroll = displayRef.current.scrollLeft;
    const cursorRelativePosition = cursorPosition - currentScroll;

    // Get character width at cursor position for precise scrolling
    let charWidth;
    if (textWrapperRef.current) {
      const spans = textWrapperRef.current.querySelectorAll(`span[class*="${S.passwordInputCharacter}"]`);
      if (spans.length > 0 && selection.end > 0 && selection.end <= spans.length) {
        // Get the width of the character at cursor position
        const charIndex = Math.max(0, selection.end - 1);
        if (spans[charIndex]) {
          // Use offsetWidth for scroll-independent measurement
          charWidth = spans[charIndex].offsetWidth || spans[charIndex].getBoundingClientRect().width;
          // DON'T ROUND - keep fractional width
        }
      }
    }

    // If we couldn't get from DOM, calculate it dynamically
    if (!charWidth) {
      const testChar = document.createElement('span');
      testChar.style.cssText = 'visibility:hidden;position:absolute;font-size:14px;font-weight:400;font-family:monospace;display:inline-block;';
      testChar.textContent = '•';
      document.body.appendChild(testChar);
      charWidth = testChar.offsetWidth; // DON'T ROUND
      document.body.removeChild(testChar);
    }

    let newScroll = currentScroll;

    // For keyboard navigation, scroll character by character
    if (lastInteractionRef.current === 'keyboard') {
      if (cursorRelativePosition < 0) {
        // Cursor is to the left of visible area - scroll to make cursor visible
        newScroll = Math.max(0, cursorPosition - charWidth);
      } else if (cursorRelativePosition >= displayWidth) {
        // Cursor is beyond right edge - scroll to make cursor visible
        newScroll = Math.max(0, cursorPosition - displayWidth + charWidth * 2);
      } else if (cursorRelativePosition < charWidth * 2 && currentScroll > 0) {
        // Cursor too close to left edge - scroll left by one character
        newScroll = Math.max(0, currentScroll - charWidth);
      } else if (cursorRelativePosition >= displayWidth - charWidth * 2) {
        // Cursor too close to right edge - scroll right by one character
        newScroll = Math.min(currentScroll + charWidth, Math.max(0, cursorPosition - displayWidth + charWidth * 2));
      }
    }
    // For typing, ensure cursor is always visible
    else if (lastInteractionRef.current === 'typing' || isTypingRef.current) {
      // When typing at the end of the password
      if (selection.end === value?.length && cursorRelativePosition >= displayWidth - charWidth * 2) {
        // Keep cursor visible with 2 character buffer on the right
        newScroll = Math.max(0, cursorPosition - displayWidth + charWidth * 3);
      }
      // When typing in the middle
      else if (cursorRelativePosition < charWidth || cursorRelativePosition >= displayWidth - charWidth) {
        // Center cursor in view
        newScroll = Math.max(0, cursorPosition - displayWidth / 2);
      }
    }
    // For clicking/other interactions (including 'mouse')
    else if (lastInteractionRef.current === 'mouse') {
      if (cursorRelativePosition < 0) {
        // Cursor is to the left of visible area
        newScroll = Math.max(0, cursorPosition - charWidth * 2);
      } else if (cursorRelativePosition >= displayWidth) {
        // Cursor is to the right of visible area
        newScroll = Math.max(0, cursorPosition - displayWidth + charWidth * 2);
      } else if (cursorRelativePosition < charWidth * 2 && selection.end > 0) {
        // Cursor too close to left edge (within 2 characters)
        newScroll = Math.max(0, cursorPosition - charWidth * 3);
      } else if (cursorRelativePosition > displayWidth - charWidth * 3) {
        // Cursor too close to right edge (within 3 characters)
        newScroll = Math.max(0, cursorPosition - displayWidth + charWidth * 4);
      }
    }
    // Don't auto-scroll for 'scroll' events to prevent loops
    else if (lastInteractionRef.current === 'scroll') {
      // Do nothing - user is manually scrolling
    }
    // For other interactions or no specific interaction
    else {
      // Only adjust if cursor is completely out of view
      if (cursorRelativePosition < 0) {
        newScroll = Math.max(0, cursorPosition - charWidth * 2);
      } else if (cursorRelativePosition >= displayWidth) {
        newScroll = Math.max(0, cursorPosition - displayWidth + charWidth * 2);
      }
    }

    if (newScroll !== currentScroll && displayRef.current) {
      displayRef.current.scrollLeft = newScroll;
      scrollLeftRef.current = newScroll; // Update ref
      setScrollLeft(newScroll);
    }

    // Reset interaction type after auto-scrolling (but not for typing)
    if (lastInteractionRef.current !== 'typing') {
      lastInteractionRef.current = null;
    }
  }, [selection, isFocused, getCursorAbsolutePosition, scrollLeft, value]);
  
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
        className={`${S.passwordInputDisplay} ${isFocused ? S.passwordInputDisplayFocused : ''} ${state === 'nonFetched' ? S.nonFetched : ''}`}
        onScroll={handleDisplayScroll}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={updateSelection}
        onClick={() => setIsFocused(true)}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setSelection({ start: 0, end: 0 });
        }}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          type='text'
          {...inputProps}
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={S.passwordInputHiddenInput}
          tabIndex={-1}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none'
          }}
        />


        <div
          ref={textWrapperRef}
          className={`${S.passwordInputTextWrapper} ${passwordDecryptError || state === 'hidden' ? S.passwordInputHidden : ''}`}
          style={{
            // Ensure text wrapper is wide enough for all characters
            minWidth: value ? 'max-content' : 'auto',
            position: 'relative' // Make this the positioning context for the cursor
          }}
        >
          {renderColoredText()}
          {isFocused && selection.start === selection.end && (
            <span
              className={S.passwordInputCursor}
              style={{
                // Cursor position is absolute within text wrapper
                // It moves automatically when the wrapper scrolls
                left: `${getCursorAbsolutePosition()}px`,
                position: 'absolute',
                top: '0',
                height: '18px',
                width: '1px',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
          )}
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