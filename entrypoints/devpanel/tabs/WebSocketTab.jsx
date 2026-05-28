// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './WebSocketTab.module.scss';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const DIRECTIONS = ['in', 'out', 'in-decrypted', 'out-decrypted'];

const padTwo = n => String(n).padStart(2, '0');

const formatTimestamp = ts => {
  const d = new Date(ts);

  return `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}:${padTwo(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
};

function WebSocketTab () {
  const [frames, setFrames] = useState([]);
  const [filterDir, setFilterDir] = useState(new Set(DIRECTIONS));
  const [filterAction, setFilterAction] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);

  const listRef = useRef(null);
  const portRef = useRef(null);

  const handleToggleDir = useCallback(dir => () => {
    setFilterDir(prev => {
      const next = new Set(prev);

      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }

      return next;
    });
  }, []);

  const handleToggleExpand = useCallback(idx => () => {
    setExpanded(prev => {
      const next = new Set(prev);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }

      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setFrames([]);
    setExpanded(new Set());
  }, []);

  useEffect(function connectDevPanelPort() {
    let port;

    try {
      port = browser.runtime.connect({ name: 'devpanel-ws' });
      portRef.current = port;

      port.onMessage.addListener(msg => {
        if (msg?.type === 'snapshot' && Array.isArray(msg.frames)) {
          setFrames(msg.frames);
          setConnected(true);
        } else if (msg?.type === 'frame' && msg.entry) {
          setFrames(prev => [...prev, msg.entry]);
        }
      });

      port.onDisconnect.addListener(() => {
        setConnected(false);
      });
    } catch (e) {
      CatchError(e);
    }

    return function disconnectDevPanelPort() {
      try {
        if (port) {
          port.disconnect();
        }
      } catch {}

      portRef.current = null;
    };
  }, []);

  const actions = useMemo(() => {
    const set = new Set();

    for (let i = 0; i < frames.length; i++) {
      if (frames[i]?.action) {
        set.add(frames[i].action);
      }
    }

    return Array.from(set).sort();
  }, [frames]);

  const filtered = useMemo(() => {
    const filterActionLower = filterAction.trim().toLowerCase();

    return frames.filter(entry => {
      if (!filterDir.has(entry.direction)) {
        return false;
      }

      if (filterActionLower && !(entry.action || '').toLowerCase().includes(filterActionLower)) {
        return false;
      }

      return true;
    });
  }, [frames, filterDir, filterAction]);

  useEffect(function scrollToBottomOnFramesChange() {
    if (!autoScroll || !listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [filtered, autoScroll]);

  return (
    <div className={S.wsTab}>
      <div className={S.wsToolbar}>
        <div className={S.wsToolbarGroup}>
          <span className={S.wsToolbarLabel}>Direction:</span>
          {DIRECTIONS.map(dir => (
            <button
              key={dir}
              type='button'
              className={`${S.wsChip} ${filterDir.has(dir) ? S.wsChipActive : ''} ${S[`wsChip_${dir}`] || ''}`}
              onClick={handleToggleDir(dir)}
            >
              {dir}
            </button>
          ))}
        </div>

        <div className={S.wsToolbarGroup}>
          <span className={S.wsToolbarLabel}>Action:</span>
          <input
            type='text'
            className={S.wsSearch}
            placeholder='filter action…'
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            list='ws-actions'
          />
          <datalist id='ws-actions'>
            {actions.map(a => <option key={a} value={a} />)}
          </datalist>
        </div>

        <div className={`${S.wsToolbarGroup} ${S.wsToolbarRight}`}>
          <label className={S.wsToggle}>
            <input type='checkbox' checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
            Auto-scroll
          </label>

          <button type='button' className={S.wsButton} onClick={handleClear}>Clear view</button>
        </div>
      </div>

      <div className={S.wsStats}>
        <span className={connected ? S.wsConnected : S.wsDisconnected}>
          {connected ? '● connected to background' : '○ no connection'}
        </span>
        <span>{frames.length} frames in buffer</span>
        {filtered.length !== frames.length && (
          <span>· showing {filtered.length}</span>
        )}
      </div>

      <div className={S.wsList} ref={listRef}>
        {filtered.length === 0 && (
          <div className={S.wsEmpty}>
            No frames yet. Trigger a WebSocket sync from the popup to see live traffic.
          </div>
        )}

        {filtered.map((entry, idx) => {
          const isOpen = expanded.has(idx);
          const payload = entry.frame ?? entry.decrypted ?? null;

          return (
            <div
              key={`${entry.ts}-${idx}`}
              className={`${S.wsEntry} ${S[`wsEntry_${entry.direction}`] || ''}`}
              onClick={handleToggleExpand(idx)}
            >
              <div className={S.wsEntryHeader}>
                <span className={S.wsEntryTs}>{formatTimestamp(entry.ts)}</span>
                <span className={S.wsEntryDir}>{entry.direction}</span>
                <span className={S.wsEntryAction}>{entry.action || '<no action>'}</span>
                {entry.id && <span className={S.wsEntryId}>id: {entry.id}</span>}
                {payload && <span className={S.wsEntryArrow}>{isOpen ? '▾' : '▸'}</span>}
              </div>

              {isOpen && payload && (
                <pre className={S.wsEntryPayload}>{JSON.stringify(payload, null, 2)}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WebSocketTab;
