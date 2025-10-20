// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* A simple event bus for managing events across the application.
*/
class EventBus {
  EVENTS = {
    CONNECT: {
      CONNECTING: 'connect_connecting',
      LOADER: 'connect_loader',
      SOCKET_ERROR: 'connect_socket_error',
      HEADER_TEXT: 'connect_header_text',
      LOGIN: 'connect_login',
      DEVICE_NAME: 'connect_device_name'
    },
    FETCH: {
      SET_FETCH_STATE: 'fetch_set_fetch_state',
      ERROR_TEXT: 'fetch_error_text',
      NAVIGATE: 'fetch_navigate'
    }
  };

  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (listener) => listener !== callback
      );
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(data));
    }
  }
}

const eventBus = new EventBus();

export default eventBus;
