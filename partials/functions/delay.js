// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Delays the execution of a function for a specified amount of time.
* @param {Function} f - The function to be executed after the delay.
* @param {Number} t - The time to wait
* @return {Promise} A promise that resolves after the function has been executed.
*/
const delay = (f, t) => {
  return new Promise(resolve => {
    setTimeout(() => {
      f();
      return resolve();
    }, t);
  });
};

export default delay;
