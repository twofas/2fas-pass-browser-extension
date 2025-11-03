// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to toggle the visibility of the menu.
* @param {boolean} value - The desired visibility state of the menu.
* @param {Object} data - The component data.
* @param {Object} actions - The component actions.
* @return {Promise<void>} A promise that resolves when the menu visibility has been toggled.
*/
const toggleMenu = (value, data, actions) => {
  const { ref, selectRef } = data;
  const { setMore } = actions;

  if (value === false) {
    if (selectRef?.current?.menuListRef?.parentElement) {
      selectRef.current.menuListRef.parentElement.style = '';
    }

    setMore(false);
    return;
  }

  setMore(true);

  return new Promise(resolve => {
    const checkAndPosition = attempts => {
      if (attempts > 10) {
        resolve();
        return;
      }

      if (!ref?.current) {
        resolve();
        return;
      }

      if (!selectRef?.current?.menuListRef?.parentElement) {
        requestAnimationFrame(() => checkAndPosition(attempts + 1));
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      const selectRect = selectRef.current.menuListRef.parentElement.getBoundingClientRect();
      const selectBottom = rect.top + rect.height / 2 + selectRect.height + 40 + 40 + 16;

      if (selectBottom > window.innerHeight) {
        selectRef.current.menuListRef.parentElement.style = `width: 240px; left: ${rect.left + rect.width - 251}px; top: ${rect.top - selectRect.height + 14 + 17}px`;
      } else {
        selectRef.current.menuListRef.parentElement.style = `width: 240px; left: ${rect.left + rect.width - 251}px; top: ${rect.top + rect.height - 17}px`;
      }

      resolve();
    };

    requestAnimationFrame(() => checkAndPosition(1));
  });
};

export default toggleMenu;
