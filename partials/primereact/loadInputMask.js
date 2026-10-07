// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

let loadedInputMask = null;
let inputMaskPromise = null;

/**
* Returns the PrimeReact InputMask component when its chunk has already been loaded on this page, so a field
* mounted later renders the masked input at once instead of a disabled placeholder first.
* @return {Function|null} The InputMask component, or null until loadInputMask() resolves.
*/
const getLoadedInputMask = () => loadedInputMask;

/**
* Loads the PrimeReact InputMask chunk once per page; every caller shares the same load. A failed load is
* forgotten, so the next call retries it.
* @return {Promise<Function>} The InputMask component.
*/
const loadInputMask = () => {
  if (!inputMaskPromise) {
    inputMaskPromise = import('primereact/inputmask')
      .then(module => {
        loadedInputMask = module.InputMask;

        return loadedInputMask;
      })
      .catch(e => {
        inputMaskPromise = null;
        throw e;
      });
  }

  return inputMaskPromise;
};

export { getLoadedInputMask, loadInputMask };
