// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Select from 'react-select';
import { useRef, useCallback, useEffect } from 'react';

/**
* Function component for an advanced select dropdown that closes when clicking outside.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AdvancedSelect (props) {
  const selectContainerRef = useRef(null);

  const handleClickOutside = useCallback(event => {
    if (
      props &&
      props?.onMenuClose &&
      typeof props?.onMenuClose === 'function' &&
      props?.menuIsOpen &&
      selectContainerRef?.current &&
      !selectContainerRef?.current?.contains(event.target) &&
      !(props?.additionalButtonRefs && Array.isArray(props?.additionalButtonRefs) && props?.additionalButtonRefs.some(ref => ref?.current && ref?.current.contains(event.target)))
    ) {
      props.onMenuClose(false);
    }
  }, [props]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div ref={selectContainerRef}>
      <Select
        {...props}
        additionalButtonRefs={undefined}
      />
    </div>
  );
}

export default AdvancedSelect;
