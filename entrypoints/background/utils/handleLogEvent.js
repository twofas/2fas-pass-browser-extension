// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { writeLogDirect } from '@/partials/logger/idb';
import { sanitizeMeta } from '@/partials/logger/sanitize';

const ALLOWED_LEVELS = new Set(Object.values(LOGGER_CONSTANTS.LEVELS));
const ALLOWED_CATEGORIES = new Set(Object.values(LOGGER_CONSTANTS.CATEGORIES));
const MAX_MSG_LEN = 512;

const handleLogEvent = async payload => {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  const level = ALLOWED_LEVELS.has(payload.level) ? payload.level : LOGGER_CONSTANTS.LEVELS.INFO;
  const cat = ALLOWED_CATEGORIES.has(payload.cat) ? payload.cat : LOGGER_CONSTANTS.CATEGORIES.SYSTEM;
  const ctx = typeof payload.ctx === 'string' ? payload.ctx.slice(0, 32) : 'content';
  const msgRaw = typeof payload.msg === 'string' ? payload.msg : String(payload.msg ?? '');
  const msg = msgRaw.length > MAX_MSG_LEN ? msgRaw.slice(0, MAX_MSG_LEN) : msgRaw;
  const ts = typeof payload.ts === 'number' && payload.ts > 0 ? payload.ts : Date.now();

  await writeLogDirect({
    ts,
    level,
    cat,
    ctx,
    msg,
    meta: sanitizeMeta(payload.meta)
  });
};

export default handleLogEvent;
