// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Imports the AddNew route chunk (with the add-new views and their form libraries). Used both by the lazy
* route and by the prefetch, so both resolve to the same module.
* @return {Promise<Object>} The route module.
*/
export const loadAddNewRoute = () => import('../routes/AddNew');

/**
* Imports the Details route chunk (with the details views). Used both by the lazy route and by the prefetch,
* so both resolve to the same module.
* @return {Promise<Object>} The route module.
*/
export const loadDetailsRoute = () => import('../routes/Details');

let prefetchPromise = null;

/**
* Loads the AddNew and Details route chunks ahead of navigation, once per popup, so opening an item or the
* add-new form renders without waiting for its chunk. A failed prefetch is forgotten; the route then loads on
* navigation as usual.
* @return {Promise<void>} Settles when both chunks are loaded.
*/
export const prefetchItemRoutes = () => {
  if (!prefetchPromise) {
    prefetchPromise = Promise.all([loadAddNewRoute(), loadDetailsRoute()])
      .then(() => {})
      .catch(e => {
        prefetchPromise = null;
        CatchError(e);
      });
  }

  return prefetchPromise;
};
