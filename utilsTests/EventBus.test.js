// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { EventBus } from '../utils/EventBus';
import { beforeEach, expect, describe, it, vi } from 'vitest';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
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
});
