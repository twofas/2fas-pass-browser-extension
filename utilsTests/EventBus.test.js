// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import eventBus from '../utils/EventBus';
import { beforeEach, expect, describe, it, vi } from 'vitest';

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.listeners = {};
  });

  it('should subscribe to an event and call the listener when the event is emitted', () => {
    const listener = vi.fn();

    eventBus.on('testEvent', listener);
    eventBus.emit('testEvent', { message: 'Hello, world!' });

    expect(listener).toHaveBeenCalledWith({ message: 'Hello, world!' });
  });

  it('should unsubscribe from an event and not call the listener', () => {
    const listener = vi.fn();

    eventBus.on('testEvent', listener);
    eventBus.off('testEvent', listener);

    eventBus.emit('testEvent', { message: 'Hello, world!' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle multiple listeners for the same event', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    eventBus.on('testEvent', listener1);
    eventBus.on('testEvent', listener2);

    eventBus.emit('testEvent', { message: 'Hello, world!' });

    expect(listener1).toHaveBeenCalledWith({ message: 'Hello, world!' });
    expect(listener2).toHaveBeenCalledWith({ message: 'Hello, world!' });
  });

  it('should not throw an error when emitting an event with no listeners', () => {
    expect(() => {
      eventBus.emit('testEvent', { message: 'Hello, world!' });
    }).not.toThrow();
  });

  it('should have predefined EVENTS constants', () => {
    expect(eventBus.EVENTS).toBeDefined();
    expect(eventBus.EVENTS.CONNECT).toBeDefined();
    expect(eventBus.EVENTS.CONNECT.CONNECTING).toBe('connect_connecting');
    expect(eventBus.EVENTS.CONNECT.LOADER).toBe('connect_loader');
    expect(eventBus.EVENTS.CONNECT.SOCKET_ERROR).toBe('connect_socket_error');
    expect(eventBus.EVENTS.CONNECT.HEADER_TEXT).toBe('connect_header_text');
    expect(eventBus.EVENTS.FETCH).toBeDefined();
  });

  it('should handle off() when no listeners exist for the event', () => {
    const listener = vi.fn();

    expect(() => {
      eventBus.off('nonExistentEvent', listener);
    }).not.toThrow();
  });

  it('should handle off() when trying to remove a non-existent listener', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    eventBus.on('testEvent', listener1);
    eventBus.off('testEvent', listener2);

    eventBus.emit('testEvent', 'test');

    expect(listener1).toHaveBeenCalledWith('test');
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should handle multiple off() calls for the same listener', () => {
    const listener = vi.fn();

    eventBus.on('testEvent', listener);
    eventBus.off('testEvent', listener);
    eventBus.off('testEvent', listener);

    eventBus.emit('testEvent', 'test');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should maintain singleton instance', () => {
    const anotherEventBusReference = eventBus;

    expect(anotherEventBusReference).toBe(eventBus);
  });
});
