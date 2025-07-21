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

  return new Promise(resolve => resolve(setMore(true)))
    .then(() => {
      let rect, selectRect;

      if (ref?.current === null) {
        return;
      } else {
        rect = ref.current.getBoundingClientRect();
      }

      if (selectRef?.current?.menuListRef?.parentElement === null) {
        return;
      } else {
        selectRect = selectRef.current.menuListRef.parentElement.getBoundingClientRect();
      }
      
      const selectBottom = rect.top + rect.height / 2 + selectRect.height + 40 + 40 + 16;

      if (selectBottom > window.innerHeight) { // 40 footer, 40 padding bottom, 16 padding bottom of list
        // TOP
        selectRef.current.menuListRef.parentElement.style = `width: 240px; left: ${rect.left + rect.width - 251}px; top: ${rect.top - selectRect.height + 14 + 17}px`;
      } else {
        // BOTTOM
        selectRef.current.menuListRef.parentElement.style = `width: 240px; left: ${rect.left + rect.width - 251}px; top: ${rect.top + rect.height - 17}px`;
      }
    });
};

export default toggleMenu;
