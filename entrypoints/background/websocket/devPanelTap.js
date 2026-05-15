// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const MAX_BUFFER = 200;

const wsFrameBuffer = [];
const subscribers = new Set();

const broadcast = msg => {
  subscribers.forEach(port => {
    try {
      port.postMessage(msg);
    } catch {}
  });
};

export const recordWsFrame = ({ direction, frame }) => {
  const entry = {
    ts: Date.now(),
    direction,
    action: frame?.action || null,
    id: frame?.id || null,
    scheme: frame?.scheme || null,
    frame
  };

  wsFrameBuffer.push(entry);

  if (wsFrameBuffer.length > MAX_BUFFER) {
    wsFrameBuffer.splice(0, wsFrameBuffer.length - MAX_BUFFER);
  }

  broadcast({ type: 'frame', entry });
};

export const recordDecryptedPayload = ({ direction, frame, decrypted }) => {
  const entry = {
    ts: Date.now(),
    direction: direction === 'in' ? 'in-decrypted' : 'out-decrypted',
    action: frame?.action || null,
    id: frame?.id || null,
    decrypted
  };

  wsFrameBuffer.push(entry);

  if (wsFrameBuffer.length > MAX_BUFFER) {
    wsFrameBuffer.splice(0, wsFrameBuffer.length - MAX_BUFFER);
  }

  broadcast({ type: 'frame', entry });
};

export const registerDevPanelPort = port => {
  subscribers.add(port);

  try {
    port.postMessage({ type: 'snapshot', frames: [...wsFrameBuffer] });
  } catch {}

  port.onDisconnect.addListener(() => {
    subscribers.delete(port);
  });
};

export const getWsFrameBufferSnapshot = () => [...wsFrameBuffer];
