// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect, useRef } from 'react';

/**
 * Hook for lazy loading heavy libraries on demand.
 * Follows the useHeavyChart pattern for optimized bundle loading.
 * @param {Function} importFn - Dynamic import function returning the module.
 * @param {string} exportName - Name of the export to extract (default: 'default').
 * @return {Object} Object containing the loaded library and loading state.
 */
const useLazyLibrary = (importFn, exportName = 'default') => {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }

    loadedRef.current = true;

    importFn()
      .then(module => {
        const exportedValue = exportName === 'default' ? module.default : module[exportName];
        setLibrary(() => exportedValue);
        setLoading(false);
      })
      .catch(err => {
        CatchError(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  return { library, loading, error };
};

export default useLazyLibrary;
