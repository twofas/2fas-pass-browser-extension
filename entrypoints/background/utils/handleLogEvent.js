// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { writeLogDirect } from '@/partials/logger/idb';
import { sanitizeMeta } from '@/partials/logger/sanitize';

const ALLOWED_LEVELS = new Set(Object.values(LOGGER_CONSTANTS.LEVELS));
const ALLOWED_CATEGORIES = new Set(Object.values(LOGGER_CONSTANTS.CATEGORIES));
const ALLOWED_CONTEXTS = new Set(Object.values(LOGGER_CONSTANTS.CONTEXTS));
const MAX_MSG_LEN = 512;
const DEFAULT_CONTEXT = LOGGER_CONSTANTS.CONTEXTS.CONTENT;

const handleLogEvent = async payload => {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  const level = ALLOWED_LEVELS.has(payload.l) ? payload.l : LOGGER_CONSTANTS.LEVELS.INFO;
  const cat = ALLOWED_CATEGORIES.has(payload.c) ? payload.c : LOGGER_CONSTANTS.CATEGORIES.SYSTEM;
  const ctx = ALLOWED_CONTEXTS.has(payload.x) ? payload.x : DEFAULT_CONTEXT;
  const msgRaw = typeof payload.m === 'string' ? payload.m : String(payload.m ?? '');
  const msg = msgRaw.length > MAX_MSG_LEN ? msgRaw.slice(0, MAX_MSG_LEN) : msgRaw;
  const ts = typeof payload.t === 'number' && payload.t > 0 ? payload.t : Date.now();

  await writeLogDirect({
    t: ts,
    l: level,
    c: cat,
    x: ctx,
    m: msg,
    e: sanitizeMeta(payload.e)
  });
};

export default handleLogEvent;
