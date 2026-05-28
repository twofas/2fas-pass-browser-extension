// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './StorageTab.module.scss';
import { useState, useEffect, useCallback } from 'react';

function StorageSessionTab () {
  const [data, setData] = useState({});
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const refresh = useCallback(async () => {
    try {
      const all = await browser.storage.session.get(null);
      setData(all || {});
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const handleDelete = useCallback(key => async () => {
    if (!window.confirm(`Delete key "${key}" from storage.session?`)) {
      return;
    }

    try {
      await browser.storage.session.remove(key);
      await refresh();
    } catch (e) {
      CatchError(e);
    }
  }, [refresh]);

  const handleToggle = useCallback(key => () => {
    setExpanded(prev => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }, []);

  useEffect(function loadAndWatchSessionStorage() {
    refresh();

    const handleChange = (_change, area) => {
      if (area === 'session') {
        refresh();
      }
    };

    browser.storage.onChanged.addListener(handleChange);

    return function unwatchSessionStorage() {
      browser.storage.onChanged.removeListener(handleChange);
    };
  }, [refresh]);

  const keys = Object.keys(data).sort();
  const filteredKeys = keys.filter(k => k.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={S.storageTab}>
      <div className={S.storageToolbar}>
        <input
          type='text'
          className={S.storageSearch}
          placeholder='Filter keys…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className={S.storageStats}>{filteredKeys.length} / {keys.length} keys</span>
        <button type='button' className={S.storageButton} onClick={refresh}>Refresh</button>
      </div>

      <div className={S.storageNote}>
        Session storage holds in-memory state used by background and popup. Values are already deserialized — encrypted item buffers appear as base64/hex strings as stored.
      </div>

      <div className={S.storageList}>
        {filteredKeys.length === 0 && (
          <div className={S.storageEmpty}>No keys match the filter.</div>
        )}

        {filteredKeys.map(key => {
          const isOpen = expanded.has(key);

          return (
            <div key={key} className={S.storageEntry}>
              <div className={S.storageEntryHeader} onClick={handleToggle(key)}>
                <span className={S.storageEntryKey}>{key}</span>
                <span className={S.storageEntryArrow}>{isOpen ? '▾' : '▸'}</span>
                <button
                  type='button'
                  className={S.storageEntryDelete}
                  onClick={e => { e.stopPropagation(); handleDelete(key)(); }}
                >Delete</button>
              </div>

              {isOpen && (
                <pre className={S.storageEntryValue}>{JSON.stringify(data[key], null, 2)}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StorageSessionTab;
