// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';

const UriTempIdsContext = createContext(null);

/**
* Generates tempIds for an array of URIs.
* @param {Array} uris - Array of URI objects.
* @return {Array} Array of URI objects with _tempId property.
*/
const generateTempIds = uris => {
  if (!uris || uris.length === 0) {
    return [];
  }

  return uris.map(uri => ({
    text: uri.text,
    matcher: uri.matcher,
    new: uri.new || false,
    _tempId: uri._tempId || uuidv4()
  }));
};

/**
* Provider component for managing URI tempIds locally in the Details view.
* @param {Object} props - The component props.
* @param {Array} props.initialUris - Initial URIs from the item.
* @param {React.ReactNode} props.children - Child components.
* @return {JSX.Element} The provider component.
*/
export function UriTempIdsProvider ({ initialUris, children }) {
  const { data, setData } = usePopupState();

  const [urisWithTempIds, setUrisWithTempIds] = useState(() => {
    if (data?.urisWithTempIds && data.urisWithTempIds.length > 0) {
      return data.urisWithTempIds;
    }

    return generateTempIds(initialUris);
  });

  const addUri = useCallback((text = '', matcher = 0) => {
    const newUri = {
      text,
      matcher,
      new: true,
      _tempId: uuidv4()
    };

    setUrisWithTempIds(prev => [...prev, newUri]);

    return newUri;
  }, []);

  const updateUri = useCallback((tempId, updates) => {
    setUrisWithTempIds(prev => prev.map(uri => {
      if (uri._tempId === tempId) {
        return { ...uri, ...updates };
      }

      return uri;
    }));
  }, []);

  const removeUri = useCallback(tempId => {
    setUrisWithTempIds(prev => prev.filter(uri => uri._tempId !== tempId));
  }, []);

  const resetUri = useCallback((tempId, originalUri) => {
    setUrisWithTempIds(prev => prev.map(uri => {
      if (uri._tempId === tempId) {
        return {
          text: originalUri?.text || '',
          matcher: originalUri?.matcher ?? 0,
          new: false,
          _tempId: tempId
        };
      }

      return uri;
    }));
  }, []);

  const getUriByTempId = useCallback(tempId => {
    return urisWithTempIds.find(uri => uri._tempId === tempId);
  }, [urisWithTempIds]);

  const getUriByIndex = useCallback(index => {
    return urisWithTempIds[index];
  }, [urisWithTempIds]);

  useEffect(() => {
    setData('urisWithTempIds', urisWithTempIds);
  }, [urisWithTempIds, setData]);

  const value = useMemo(() => ({
    urisWithTempIds,
    addUri,
    updateUri,
    removeUri,
    resetUri,
    getUriByTempId,
    getUriByIndex
  }), [urisWithTempIds, addUri, updateUri, removeUri, resetUri, getUriByTempId, getUriByIndex]);

  return (
    <UriTempIdsContext.Provider value={value}>
      {children}
    </UriTempIdsContext.Provider>
  );
}

/**
* Hook to access the URI tempIds context.
* @return {Object} The context value with urisWithTempIds and management functions.
*/
export function useUriTempIds () {
  const context = useContext(UriTempIdsContext);

  if (!context) {
    throw new Error('useUriTempIds must be used within a UriTempIdsProvider');
  }

  return context;
}

export default UriTempIdsContext;
