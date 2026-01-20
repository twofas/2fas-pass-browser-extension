// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import getTags from '@/partials/sessionStorage/getTags';

const CACHE_DURATION = 30000;

let tagsCache = {
  tags: [],
  loading: true,
  error: null,
  lastFetchTime: null
};

const listeners = new Set();

const emitChange = () => {
  listeners.forEach(listener => listener());
};

const subscribe = listener => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => tagsCache;

const setTagsCache = updates => {
  tagsCache = { ...tagsCache, ...updates };
  emitChange();
};

/**
 * Validates tag IDs from items against available tags and logs error for missing tags.
 * Logs once with all missing tag IDs.
 * @param {Array} tags - Array of available tags.
 * @param {Array} items - Array of items with tags.
 */
const validateTagsInItems = async (tags, items) => {
  if (!Array.isArray(tags) || tags.length === 0 || !Array.isArray(items)) {
    return;
  }

  const tagIdSet = new Set(tags.map(tag => tag.id));
  const missingTagIds = new Set();
  const itemsWithTags = items.filter(item => item?.tags && Array.isArray(item?.tags) && item?.tags?.length > 0);

  for (const item of itemsWithTags) {
    for (const tagId of item.tags) {
      if (!tagIdSet.has(tagId)) {
        missingTagIds.add(tagId);
      }
    }
  }

  if (missingTagIds.size > 0) {
    await CatchError(new TwoFasError(TwoFasError.internalErrors.tagIndexError, { additional: { tagIds: Array.from(missingTagIds) }, apiLog: false }));
  }
};

/**
 * Custom hook for centralized tags fetching and caching.
 * @param {Object} options - Hook options.
 * @param {boolean} options.autoFetch - Whether to automatically fetch tags on mount (default: true).
 * @return {Object} Object containing tags, loading state, error, validateTagsInItems function, and refetch function.
 */
const useTags = (options = {}) => {
  const { autoFetch = true } = options;

  const cache = useSyncExternalStore(subscribe, getSnapshot);

  const fetchTags = useCallback(async (force = false) => {
    const now = Date.now();
    const isCacheValid = cache.lastFetchTime && (now - cache.lastFetchTime) < CACHE_DURATION;

    if (!force && isCacheValid && cache.tags.length > 0) {
      return cache.tags;
    }

    setTagsCache({ loading: true });

    try {
      const fetchedTags = await getTags();
      setTagsCache({ tags: fetchedTags, loading: false, error: null, lastFetchTime: Date.now() });
      return fetchedTags;
    } catch (e) {
      setTagsCache({ error: e, loading: false });
      await CatchError(e);
      return [];
    }
  }, [cache.lastFetchTime, cache.tags]);

  const refetch = useCallback(() => fetchTags(true), [fetchTags]);

  useEffect(() => {
    if (autoFetch) {
      fetchTags();
    }
  }, []);

  return {
    tags: cache.tags,
    loading: cache.loading,
    error: cache.error,
    fetchTags,
    refetch,
    validateTagsInItems
  };
};

export default useTags;
