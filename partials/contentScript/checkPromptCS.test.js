// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Finding #58: on Safari the save-prompt pipeline is dead — submit detection
// relies on browser.webRequest.onBeforeRequest, registered only outside Safari
// (nonSafariBackground.js), and the Safari manifest lacks the 'webRequest'
// permission. savePromptActions are therefore never produced on Safari, so the
// prompt can never fire (the setting is hidden too). Yet checkPromptCS still
// injected prompt.js, which captures and encrypts every typed credential and
// ships it to the background where it sits unused. checkPromptCS must early-return
// on Safari so the input-capturing script is never injected there.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./injectPromptCSIntoFrames', () => ({ default: vi.fn(async () => true) }));

import checkPromptCS from './checkPromptCS.js';
import injectPromptCSIntoFrames from './injectPromptCSIntoFrames';

describe('checkPromptCS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await storage.removeItem('local:savePrompt');
  });

  describe('Safari (finding #58: dead save-prompt pipeline)', () => {
    it('does not inject the prompt content script on Safari even when savePrompt is default', async () => {
      vi.stubEnv('BROWSER', 'safari');
      await storage.setItem('local:savePrompt', 'default');

      await checkPromptCS(123);

      expect(injectPromptCSIntoFrames).not.toHaveBeenCalled();
    });

    it.each(['default', 'default_encrypted', 'enabled', undefined])(
      'does not inject on Safari when savePrompt is %s',
      async value => {
        vi.stubEnv('BROWSER', 'safari');

        if (value === undefined) {
          await storage.removeItem('local:savePrompt');
        } else {
          await storage.setItem('local:savePrompt', value);
        }

        await checkPromptCS(123);

        expect(injectPromptCSIntoFrames).not.toHaveBeenCalled();
      }
    );
  });

  // tabs.onActivated and tabs.onUpdated can both reach checkPromptCS for the same tab at
  // the same moment; only one injection may run.
  describe('concurrent calls', () => {
    it('shares one injection for concurrent calls on the same tab', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.setItem('local:savePrompt', 'default');
      let release;
      injectPromptCSIntoFrames.mockImplementationOnce(() => new Promise(resolve => {
        release = resolve;
      }));

      const first = checkPromptCS(5);
      const second = checkPromptCS(5);

      await vi.waitFor(() => expect(injectPromptCSIntoFrames).toHaveBeenCalledTimes(1));
      release();
      await Promise.all([first, second]);

      expect(injectPromptCSIntoFrames).toHaveBeenCalledTimes(1);
    });

    it('runs again once the previous call has finished', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.setItem('local:savePrompt', 'default');

      await checkPromptCS(5);
      await checkPromptCS(5);

      expect(injectPromptCSIntoFrames).toHaveBeenCalledTimes(2);
    });

    it('does not share calls between tabs', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.setItem('local:savePrompt', 'default');

      await Promise.all([checkPromptCS(5), checkPromptCS(6)]);

      expect(injectPromptCSIntoFrames).toHaveBeenCalledWith(5);
      expect(injectPromptCSIntoFrames).toHaveBeenCalledWith(6);
    });
  });

  describe('non-Safari browsers (unchanged behaviour)', () => {
    it('injects the prompt content script when savePrompt is default', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.setItem('local:savePrompt', 'default');

      await checkPromptCS(123);

      expect(injectPromptCSIntoFrames).toHaveBeenCalledWith(123);
    });

    it('injects the prompt content script when savePrompt is default_encrypted', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.setItem('local:savePrompt', 'default_encrypted');

      await checkPromptCS(123);

      expect(injectPromptCSIntoFrames).toHaveBeenCalledWith(123);
    });

    it('injects the prompt content script when savePrompt is unset', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.removeItem('local:savePrompt');

      await checkPromptCS(123);

      expect(injectPromptCSIntoFrames).toHaveBeenCalledWith(123);
    });

    it('does not inject when savePrompt is explicitly set to a non-default value', async () => {
      vi.stubEnv('BROWSER', 'chrome');
      await storage.setItem('local:savePrompt', 'enabled');

      await checkPromptCS(123);

      expect(injectPromptCSIntoFrames).not.toHaveBeenCalled();
    });
  });
});
