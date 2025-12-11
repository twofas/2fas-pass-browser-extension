// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback } from 'react';
import S from './PasswordInput.module.scss';

/**
 * PasswordInput component that displays each character with different colors.
 * Numbers: blue, Special characters: green, Letters: default text color.
 * This is a read-only display component used in PasswordGenerator.
 * @param {Object} props - Component props
 * @return {JSX.Element} The rendered component
 */
function PasswordInput(props) {
  const {
    value = '',
    className = '',
    placeholder = '',
    ...restProps
  } = props;

  const getCharacterType = useCallback(char => {
    if (/[0-9]/.test(char)) {
      return 'number';
    }

    if (/[^a-zA-Z0-9]/.test(char)) {
      return 'special';
    }

    return 'letter';
  }, []);

  const renderColoredText = () => {
    if (!value) {
      return null;
    }

    const characters = value.split('');

    return characters.map((char, index) => {
      const charType = getCharacterType(char);
      const finalClassName = `${S.passwordInputCharacter} ${S[`passwordInputCharacter${charType.charAt(0).toUpperCase() + charType.slice(1)}`]}`;

      return (
        <span
          key={index}
          className={finalClassName}
          data-index={index}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className={`${S.passwordInput} ${className}`} {...restProps}>
      <div className={S.passwordInputDisplay}>
        <div
          className={S.passwordInputTextWrapper}
          style={{
            minWidth: value ? 'max-content' : 'auto',
            position: 'relative'
          }}
        >
          {renderColoredText()}
        </div>
        {!value && (
          <span className={S.passwordInputPlaceholder}>
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

export default PasswordInput;
