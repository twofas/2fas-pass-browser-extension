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
function PasswordInput(props) {
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
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartIndex, setSelectionStartIndex] = useState(null);
  const [selectionAnchor, setSelectionAnchor] = useState(null); // For Shift+Arrow selection
  const [forceRenderKey, setForceRenderKey] = useState(0); // Force re-render when selection clears
  const inputRef = useRef(null);
  const displayRef = useRef(null);
  const textWrapperRef = useRef(null);
  const previousValueRef = useRef(value);
  const isTypingRef = useRef(false);
  const lastInteractionRef = useRef(null);
  const scrollLeftRef = useRef(0); // Keep real-time scroll value in ref
  const isCopyOperationRef = useRef(false); // Track if copy/cut just happened

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
    // Don't process changes when disabled
    if (disabled) {
      return;
    }

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
  }, [onChange, value, disabled, selection]);

  const handleKeyDown = useCallback((e) => {
    // Don't process any keyboard events if input is disabled
    if (disabled) {
      return;
    }

    // Check for modifier keys alone (Ctrl, Cmd, Option, Alt, Shift)
    const modifierKeyRegex = /^(Control|Meta|Shift|Alt)$/;
    const isModifierKeyAlone = modifierKeyRegex.test(e.key);

    if (isModifierKeyAlone) {
      return; // Don't process modifier keys alone
    }

    // Clear copy operation flag on any other keyboard interaction (except copy/cut)
    if (!(e.ctrlKey || e.metaKey) || (e.key !== 'c' && e.key !== 'x')) {
      // Only reset flag if we're doing something other than copy/cut
      if (e.key.length === 1 || ['Backspace', 'Delete'].includes(e.key)) {
        isCopyOperationRef.current = false;
      }
    }

    // Don't handle Ctrl+V here - let the paste event handler and browser handle it
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Allow default behavior - paste event will be handled by onPaste
      isCopyOperationRef.current = false; // Clear copy flag on paste
      return;
    }

    // Handle regular typing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && inputRef.current) {
      e.preventDefault();

      // Stop any ongoing mouse selection when typing
      setIsSelecting(false);
      setSelectionStartIndex(null);

      // Clear selection anchor when typing
      setSelectionAnchor(null);

      // Use the selection from React state since that's what's being displayed
      const start = selection.start;
      const end = selection.end;

      // Replace selected text (or insert at cursor if no selection)
      const newValue = value.substring(0, start) + e.key + value.substring(end);
      const newCursorPos = start + 1;

      // Clear the selection before calling onChange
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);

      // Force a complete re-render by updating selection and incrementing the key
      setSelection({ start: newCursorPos, end: newCursorPos });
      setForceRenderKey(prev => prev + 1);

      // Create a synthetic event for onChange
      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: newCursorPos,
          selectionEnd: newCursorPos
        }
      };

      handleChange(syntheticEvent);
      return;
    }

    // Clear selection on any non-Shift key press if there's a selection
    // But don't clear for Ctrl+A/Cmd+A as it's meant to select all
    // And don't clear for Ctrl+C/Cmd+C or Ctrl+X/Cmd+X (copy/cut operations)
    const isCopyOrCutKey = (e.key === 'c' || e.key === 'x') && (e.ctrlKey || e.metaKey);
    if (!e.shiftKey && selection.start !== selection.end && !(e.key === 'a' && (e.ctrlKey || e.metaKey)) && !isCopyOrCutKey) {
      // Keys that we handle explicitly below
      const handledKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Backspace', 'Delete'];

      // For any key not explicitly handled, just clear the selection
      if (!handledKeys.includes(e.key)) {
        // Stop any ongoing mouse selection
        setIsSelecting(false);
        setSelectionStartIndex(null);
        setSelectionAnchor(null);

        const pos = selection.end;
        if (inputRef.current) {
          inputRef.current.setSelectionRange(pos, pos);
          setSelection({ start: pos, end: pos });
        }
      }
    }

    // Handle backspace
    if (e.key === 'Backspace' && inputRef.current) {
      e.preventDefault();

      // Stop any ongoing mouse selection
      setIsSelecting(false);
      setSelectionStartIndex(null);

      // Clear selection anchor when deleting
      setSelectionAnchor(null);

      // Use the selection from React state since that's what's being displayed
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

      // Update input and selection BEFORE calling onChange
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(newPos, newPos);
      setSelection({ start: newPos, end: newPos });
      setForceRenderKey(prev => prev + 1); // Force re-render when selection clears

      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: newPos,
          selectionEnd: newPos
        }
      };

      handleChange(syntheticEvent);

      return;
    }

    // Handle Delete key
    if (e.key === 'Delete' && inputRef.current) {
      e.preventDefault();

      // Stop any ongoing mouse selection
      setIsSelecting(false);
      setSelectionStartIndex(null);

      // Clear selection anchor when deleting
      setSelectionAnchor(null);

      // Use the selection from React state since that's what's being displayed
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

      // Update input and selection BEFORE calling onChange
      inputRef.current.value = newValue;
      inputRef.current.setSelectionRange(start, start);
      setSelection({ start: start, end: start });
      setForceRenderKey(prev => prev + 1); // Force re-render when selection clears

      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: start,
          selectionEnd: start
        }
      };

      handleChange(syntheticEvent);

      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();

      if (inputRef.current && value) {
        inputRef.current.setSelectionRange(0, value.length);
        setSelection({ start: 0, end: value.length });
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();

      if (inputRef.current && selection.start !== selection.end) {
        const selectedText = value.substring(selection.start, selection.end);

        // Mark that a copy operation is happening - this prevents blur from clearing selection
        isCopyOperationRef.current = true;

        // Force re-render immediately to show selection highlight
        setForceRenderKey(prev => prev + 1);

        navigator.clipboard.writeText(selectedText).finally(() => {
          // Reset copy flag after clipboard operation completes
          // Use a longer timeout to ensure blur event can check the flag
          // The selection will remain visible until this timeout fires
          setTimeout(() => {
            isCopyOperationRef.current = false;
          }, 2000);
        });
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
      e.preventDefault();

      if (inputRef.current && selection.start !== selection.end) {
        const selectedText = value.substring(selection.start, selection.end);
        const start = selection.start;
        const end = selection.end;

        // Mark that a copy operation is happening (for cut as well)
        isCopyOperationRef.current = true;

        navigator.clipboard.writeText(selectedText).then(() => {

          const newValue = value.substring(0, start) + value.substring(end);
          inputRef.current.value = newValue;
          inputRef.current.setSelectionRange(start, start);
          setSelection({ start: start, end: start });
          setForceRenderKey(prev => prev + 1);

          const syntheticEvent = {
            target: {
              value: newValue,
              selectionStart: start,
              selectionEnd: start
            }
          };

          handleChange(syntheticEvent);
          lastInteractionRef.current = 'typing';

          // Reset copy flag after cut completes
          // For cut, we can reset sooner since selection is already cleared
          setTimeout(() => {
            isCopyOperationRef.current = false;
          }, 200);
        }).catch(() => {
          // Handle clipboard write error silently
          isCopyOperationRef.current = false;
        });
      }
    }

    // Handle End key or Ctrl/Cmd+Right to jump to end
    if (e.key === 'End' || ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight')) {
      e.preventDefault();
      if (inputRef.current && displayRef.current && textWrapperRef.current) {
        if (e.shiftKey) {
          // Select from current position to end
          const anchor = selectionAnchor !== null ? selectionAnchor : selection.start;
          if (selectionAnchor === null) {
            setSelectionAnchor(selection.start);
          }
          inputRef.current.setSelectionRange(anchor, value.length);
          setSelection({ start: anchor, end: value.length });
        } else {
          // Just move cursor to end
          setSelectionAnchor(null);
          const endPos = value.length;
          inputRef.current.setSelectionRange(endPos, endPos);
          setSelection({ start: endPos, end: endPos });
        }

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
        if (e.shiftKey) {
          // Select from current position to beginning
          const anchor = selectionAnchor !== null ? selectionAnchor : selection.end;
          if (selectionAnchor === null) {
            setSelectionAnchor(selection.end);
          }
          inputRef.current.setSelectionRange(0, anchor);
          setSelection({ start: 0, end: anchor });
        } else {
          // Just move cursor to beginning
          setSelectionAnchor(null);
          inputRef.current.setSelectionRange(0, 0);
          setSelection({ start: 0, end: 0 });
        }

        // Scroll to beginning
        displayRef.current.scrollLeft = 0;
        scrollLeftRef.current = 0;
        setScrollLeft(0);
      }
      lastInteractionRef.current = 'keyboard';
      return;
    }

    // Handle arrow keys with Shift for selection
    // ONLY process arrow keys if they're not combined with Ctrl/Cmd alone
    // (Ctrl/Cmd+Arrow is handled above for Home/End functionality)
    const isCtrlOrCmdAlone = (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;

    if (e.key === 'ArrowLeft' && inputRef.current && !(isCtrlOrCmdAlone)) {
      e.preventDefault();

      if (e.shiftKey) {
        // Set anchor if not already set
        const anchor = selectionAnchor !== null ? selectionAnchor : selection.start;
        if (selectionAnchor === null) {
          setSelectionAnchor(selection.start);
        }

        // Move the focus point left
        let newFocus;
        if (selection.start === anchor) {
          // Moving left from the anchor
          newFocus = Math.max(0, selection.end - 1);
        } else {
          // Already left of anchor, keep moving left
          newFocus = Math.max(0, selection.start - 1);
        }

        const newStart = Math.min(anchor, newFocus);
        const newEnd = Math.max(anchor, newFocus);

        inputRef.current.setSelectionRange(newStart, newEnd);
        setSelection({ start: newStart, end: newEnd });
      } else {
        // Clear anchor when not using Shift
        setSelectionAnchor(null);
        // If there's a selection, collapse it to the start
        const hasSelection = selection.start !== selection.end;
        const newPos = hasSelection ? selection.start : Math.max(0, selection.start - 1);
        inputRef.current.setSelectionRange(newPos, newPos);
        setSelection({ start: newPos, end: newPos });
      }
      lastInteractionRef.current = 'keyboard';

      return;
    }

    if (e.key === 'ArrowRight' && inputRef.current && !(isCtrlOrCmdAlone)) {
      e.preventDefault();

      if (e.shiftKey) {
        // Set anchor if not already set
        const anchor = selectionAnchor !== null ? selectionAnchor : selection.end;
        if (selectionAnchor === null) {
          setSelectionAnchor(selection.end);
        }

        // Move the focus point right
        let newFocus;
        if (selection.end === anchor) {
          // Moving right from the anchor
          newFocus = Math.min(value.length, selection.start + 1);
        } else {
          // Already right of anchor, keep moving right
          newFocus = Math.min(value.length, selection.end + 1);
        }

        const newStart = Math.min(anchor, newFocus);
        const newEnd = Math.max(anchor, newFocus);

        inputRef.current.setSelectionRange(newStart, newEnd);
        setSelection({ start: newStart, end: newEnd });
      } else {
        // Clear anchor when not using Shift
        setSelectionAnchor(null);
        // If there's a selection, collapse it to the end
        const hasSelection = selection.start !== selection.end;
        const newPos = hasSelection ? selection.end : Math.min(value.length, selection.end + 1);
        inputRef.current.setSelectionRange(newPos, newPos);
        setSelection({ start: newPos, end: newPos });
      }
      lastInteractionRef.current = 'keyboard';

      return;
    }
  }, [value, selection, selectionAnchor, handleChange, disabled]);

  const handlePaste = useCallback((e) => {
    // Clear copy flag on paste
    isCopyOperationRef.current = false;

    // Don't process paste when disabled
    if (disabled) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    if (!inputRef.current) {
      return;
    }

    // Get pasted text from clipboard via event
    const pastedText = e.clipboardData?.getData('text') || '';

    if (!pastedText) {
      return;
    }

    // Stop any ongoing mouse selection when pasting
    setIsSelecting(false);
    setSelectionStartIndex(null);
    setSelectionAnchor(null);

    // If input is not focused, paste at the end of the value
    // If input is focused, paste at cursor position from React state
    let start;
    let end;

    if (!isFocused) {
      // Not focused - paste at the end
      start = value.length;
      end = value.length;
    } else {
      // Focused - use React state selection (NOT hidden input's selection)
      // The hidden input's selectionStart/selectionEnd don't reflect our custom selection
      start = selection.start;
      end = selection.end;
    }

    // Replace selected text (or insert at cursor if no selection)
    const newValue = value.substring(0, start) + pastedText + value.substring(end);
    const newCursorPos = start + pastedText.length;

    // Update input and selection
    inputRef.current.value = newValue;
    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);

    // Force a complete re-render
    setSelection({ start: newCursorPos, end: newCursorPos });
    setForceRenderKey(prev => prev + 1);

    // Focus the input after pasting if it wasn't focused
    if (!isFocused) {
      setIsFocused(true);
      inputRef.current.focus();
    }

    // Create a synthetic event for onChange
    const syntheticEvent = {
      target: {
        value: newValue,
        selectionStart: newCursorPos,
        selectionEnd: newCursorPos
      }
    };

    handleChange(syntheticEvent);
    lastInteractionRef.current = 'typing';
  }, [value, isFocused, disabled, handleChange, selection]);

  const handleWheel = useCallback((e) => {
    // Don't allow scrolling when disabled
    if (disabled) {
      return;
    }

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
  }, [disabled]);

  const handleDisplayScroll = useCallback(() => {
    // Don't process scroll when disabled
    if (disabled || !displayRef.current) {
      return;
    }

    const newScrollLeft = displayRef.current.scrollLeft;
    scrollLeftRef.current = newScrollLeft;
    setScrollLeft(newScrollLeft);
    lastInteractionRef.current = 'scroll';
  }, [disabled]);

  const getCharacterIndexFromMousePosition = useCallback((e) => {
    if (!displayRef.current || !textWrapperRef.current) {
      return null;
    }

    const displayRect = displayRef.current.getBoundingClientRect();
    const currentScroll = displayRef.current.scrollLeft;
    const clickXInViewport = e.clientX - displayRect.left;
    const clickX = clickXInViewport + currentScroll;

    const spans = textWrapperRef.current.querySelectorAll(`span[class*="${S.passwordInputCharacter}"]`);

    if (spans.length === 0) {
      return 0;
    }

    const lastSpan = spans[spans.length - 1];
    const lastSpanEnd = lastSpan.offsetLeft + lastSpan.offsetWidth;

    if (clickX >= lastSpanEnd) {
      return value.length;
    }

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      const spanLeft = span.offsetLeft;
      const spanRight = spanLeft + span.offsetWidth;

      if (clickX >= spanLeft && clickX <= spanRight) {
        const spanMid = spanLeft + span.offsetWidth / 2;
        return clickX < spanMid ? i : i + 1;
      } else if (clickX < spanLeft) {
        return i;
      }
    }

    return value.length;
  }, [value, S.passwordInputCharacter]);

  const handleMouseDown = useCallback((e) => {
    // Don't allow mouse interactions when disabled
    if (disabled) {
      e.preventDefault();
      return;
    }

    // Clear copy flag on mouse interaction (user clicked somewhere)
    isCopyOperationRef.current = false;

    lastInteractionRef.current = 'mouse';

    // Clear selection anchor when starting new selection with mouse
    setSelectionAnchor(null);

    const clickedIndex = getCharacterIndexFromMousePosition(e);

    if (clickedIndex !== null && inputRef.current) {
      // Start selection
      setIsSelecting(true);
      setSelectionStartIndex(clickedIndex);

      // Set initial cursor position
      inputRef.current.setSelectionRange(clickedIndex, clickedIndex);
      setSelection({ start: clickedIndex, end: clickedIndex });

      if (displayRef.current) {
        const currentScroll = displayRef.current.scrollLeft;
        scrollLeftRef.current = currentScroll;
        setScrollLeft(currentScroll);
      }
    }
  }, [getCharacterIndexFromMousePosition, disabled, selection]);

  const handleMouseMove = useCallback((e) => {
    // Don't allow mouse interactions when disabled
    if (disabled || !isSelecting || selectionStartIndex === null) {
      return;
    }

    const currentIndex = getCharacterIndexFromMousePosition(e);

    if (currentIndex !== null && inputRef.current) {
      // Update selection range
      const start = Math.min(selectionStartIndex, currentIndex);
      const end = Math.max(selectionStartIndex, currentIndex);

      inputRef.current.setSelectionRange(start, end);
      setSelection({ start, end });
    }
  }, [isSelecting, selectionStartIndex, getCharacterIndexFromMousePosition, disabled]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);
  useEffect(() => {
    const display = displayRef.current;
    if (!display) {
      return;
    }

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
    testSpan.style.fontFamily = 'monospace'; // Ensure monospace for consistent width
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

      // Include forceRenderKey in the key to ensure React re-renders when selection changes
      const uniqueKey = `${index}-${forceRenderKey}-${isSelected}`;

      const finalClassName = `${S.passwordInputCharacter} ${shouldColorize ? S[`passwordInputCharacter${charType.charAt(0).toUpperCase() + charType.slice(1)}`] : ''} ${isSelected ? S.passwordInputCharacterSelected : ''}`;

      return (
        <span
          key={uniqueKey}
          className={finalClassName}
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
        onMouseDown={(e) => {
          if (!disabled) {
            inputRef.current?.focus();
            handleMouseDown(e);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => {
          if (!disabled) {
            setIsFocused(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          type='text'
          {...inputProps}
          id={id}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            !disabled && setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);

            // Don't clear selection if a copy operation just happened
            // The flag should still be true during copy, so we preserve selection
            if (!isCopyOperationRef.current) {
              setSelection({ start: 0, end: 0 });
            }
          }}
          disabled={disabled}
          className={S.passwordInputHiddenInput}
          tabIndex={disabled ? -1 : 0}
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            opacity: 0,
            pointerEvents: 'auto',
            zIndex: '2',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '0',
            margin: '0',
            font: 'inherit',
            color: 'transparent',
            caretColor: 'transparent'
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