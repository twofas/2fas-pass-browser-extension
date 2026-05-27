// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './LogsTab.module.scss';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { readAllLogs, clearLogs as clearLogsIdb, getLogStats } from '@/partials/logger/idb';
import { exportLogsToFile } from '@/partials/logger/exportLogs';

const LEVEL_IDS = Object.values(LOGGER_CONSTANTS.LEVELS);
const MAX_RENDER = 1000;
const FILTER_ALL = -1;

const levelLabel = id => LOGGER_CONSTANTS.LEVEL_NAMES[id] ?? String(id);
const categoryLabel = id => LOGGER_CONSTANTS.CATEGORY_NAMES[id] ?? String(id);
const contextLabel = id => LOGGER_CONSTANTS.CONTEXT_NAMES[id] ?? String(id);

const padTwo = n => String(n).padStart(2, '0');

const formatTimestamp = ts => {
  const d = new Date(ts);

  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())} ${padTwo(d.getHours())}:${padTwo(d.getMinutes())}:${padTwo(d.getSeconds())}`;
};

const formatBytes = bytes => {
  if (!bytes || bytes < 1024) {
    return `${bytes || 0} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function LogsTab () {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ entryCount: 0, bytesUsed: 0 });
  const [filterLevel, setFilterLevel] = useState(new Set(LEVEL_IDS));
  const [filterCat, setFilterCat] = useState(FILTER_ALL);
  const [filterCtx, setFilterCtx] = useState(FILTER_ALL);
  const [search, setSearch] = useState('');
  const [verbose, setVerbose] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const listRef = useRef(null);

  const refresh = useCallback(async () => {
    const [allLogs, statResult] = await Promise.all([readAllLogs(), getLogStats()]);
    setLogs(allLogs);
    setStats(statResult);
  }, []);

  const handleClear = useCallback(async () => {
    await clearLogsIdb();
    setLogs([]);
    setStats({ entryCount: 0, bytesUsed: 0 });
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await exportLogsToFile({ bytesUsed: stats.bytesUsed });
    } catch (e) {
      CatchError(e);
    } finally {
      setSaving(false);
    }
  }, [saving, stats.bytesUsed]);

  const handleToggleLevel = useCallback(level => () => {
    setFilterLevel(prev => {
      const next = new Set(prev);

      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }

      return next;
    });
  }, []);

  const handleToggleExpand = useCallback(id => () => {
    setExpandedIds(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set();

    for (let i = 0; i < logs.length; i++) {
      if (typeof logs[i]?.c === 'number') {
        set.add(logs[i].c);
      }
    }

    return [FILTER_ALL, ...Array.from(set).sort((a, b) => a - b)];
  }, [logs]);

  const contexts = useMemo(() => {
    const set = new Set();

    for (let i = 0; i < logs.length; i++) {
      if (typeof logs[i]?.x === 'number') {
        set.add(logs[i].x);
      }
    }

    return [FILTER_ALL, ...Array.from(set).sort((a, b) => a - b)];
  }, [logs]);

  const filtered = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    const result = [];

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];

      if (!filterLevel.has(entry.l)) {
        continue;
      }

      if (filterCat !== FILTER_ALL && entry.c !== filterCat) {
        continue;
      }

      if (filterCtx !== FILTER_ALL && entry.x !== filterCtx) {
        continue;
      }

      if (searchLower && !(entry.m || '').toLowerCase().includes(searchLower)) {
        continue;
      }

      result.push(entry);
    }

    if (result.length > MAX_RENDER) {
      return result.slice(result.length - MAX_RENDER);
    }

    return result;
  }, [logs, filterLevel, filterCat, filterCtx, search]);

  useEffect(function loadAndSubscribeLogs() {
    let active = true;
    let channel = null;

    refresh();

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(LOGGER_CONSTANTS.BROADCAST_CHANNEL);

        channel.onmessage = e => {
          if (!active) {
            return;
          }

          const msg = e?.data;

          if (msg?.type === 'append' && msg.entry) {
            setLogs(prev => {
              const next = [...prev, msg.entry];

              if (next.length > MAX_RENDER * 2) {
                return next.slice(next.length - MAX_RENDER * 2);
              }

              return next;
            });

            setStats(prev => ({
              entryCount: prev.entryCount + 1,
              bytesUsed: prev.bytesUsed + (msg.entry.s || 0)
            }));
          } else if (msg?.type === 'trim' || msg?.type === 'clear') {
            refresh();
          }
        };
      }
    } catch {
      channel = null;
    }

    return function teardownLogsSubscription() {
      active = false;

      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  }, [refresh]);

  useEffect(function scrollToBottomOnLogsChange() {
    if (!autoScroll || !listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [filtered, autoScroll]);

  return (
    <div className={S.logsTab}>
      <div className={S.logsToolbar}>
        <div className={S.logsToolbarGroup}>
          <span className={S.logsToolbarLabel}>Level:</span>
          {LEVEL_IDS.map(level => (
            <button
              key={level}
              type='button'
              className={`${S.logsChip} ${filterLevel.has(level) ? S.logsChipActive : ''}`}
              onClick={handleToggleLevel(level)}
            >
              {LOGGER_CONSTANTS.LEVEL_EMOJI[level]} {levelLabel(level)}
            </button>
          ))}
        </div>

        <div className={S.logsToolbarGroup}>
          <span className={S.logsToolbarLabel}>Category:</span>
          <select value={filterCat} onChange={e => setFilterCat(parseInt(e.target.value, 10))}>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === FILTER_ALL ? 'all' : `${LOGGER_CONSTANTS.CATEGORY_EMOJI[cat] || ''} ${categoryLabel(cat)}`}
              </option>
            ))}
          </select>
        </div>

        <div className={S.logsToolbarGroup}>
          <span className={S.logsToolbarLabel}>Context:</span>
          <select value={filterCtx} onChange={e => setFilterCtx(parseInt(e.target.value, 10))}>
            {contexts.map(ctx => (
              <option key={ctx} value={ctx}>{ctx === FILTER_ALL ? 'all' : contextLabel(ctx)}</option>
            ))}
          </select>
        </div>

        <div className={S.logsToolbarGroup}>
          <input
            type='text'
            className={S.logsSearch}
            placeholder='Search msg…'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={`${S.logsToolbarGroup} ${S.logsToolbarRight}`}>
          <label className={S.logsToggle}>
            <input type='checkbox' checked={verbose} onChange={e => setVerbose(e.target.checked)} />
            Verbose
          </label>

          <label className={S.logsToggle}>
            <input type='checkbox' checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
            Auto-scroll
          </label>

          <button type='button' className={S.logsButton} onClick={refresh}>Refresh</button>
          <button
            type='button'
            className={S.logsButton}
            onClick={handleSave}
            disabled={saving || stats.entryCount === 0}
          >
            Download
          </button>
          <button type='button' className={`${S.logsButton} ${S.logsButtonDanger}`} onClick={handleClear}>Clear</button>
        </div>
      </div>

      <div className={S.logsStats}>
        {stats.entryCount} entries · {formatBytes(stats.bytesUsed)} / {formatBytes(LOGGER_CONSTANTS.MAX_BYTES)}
        {filtered.length !== logs.length && (
          <span> · showing {filtered.length}</span>
        )}
      </div>

      <div className={S.logsList} ref={listRef}>
        {filtered.length === 0 && (
          <div className={S.logsEmpty}>No log entries match filters.</div>
        )}

        {filtered.map(entry => {
          const expanded = expandedIds.has(entry.i);
          const levelEmoji = LOGGER_CONSTANTS.LEVEL_EMOJI[entry.l] || '';
          const catEmoji = LOGGER_CONSTANTS.CATEGORY_EMOJI[entry.c] || '';
          const levelName = levelLabel(entry.l);
          const hasMeta = entry.e && Object.keys(entry.e).length > 0;

          return (
            <div
              key={entry.i}
              className={`${S.logsEntry} ${S[`logsEntryLevel_${levelName}`] || ''}`}
              onClick={handleToggleExpand(entry.i)}
            >
              <div className={S.logsEntryHeader}>
                <span className={S.logsEntryTs}>{formatTimestamp(entry.t)}</span>
                <span className={S.logsEntryMarker}>| {levelEmoji}{catEmoji} |</span>
                <span className={S.logsEntryCtx}>[{contextLabel(entry.x)}]</span>
                <span className={S.logsEntryMsg}>{entry.m}</span>
                {hasMeta && (
                  <span className={S.logsEntryArrow}>{expanded ? '▾' : '▸'}</span>
                )}
              </div>

              {(verbose || expanded) && hasMeta && (
                <pre className={S.logsEntryMeta}>{JSON.stringify(entry.e, null, 2)}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LogsTab;
