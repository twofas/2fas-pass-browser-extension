// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global process */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

let envPath, envExamplePath;

const envFiles = {
  DEVELOPMENT: '.env.development',
  PRODUCTION: '.env'
};

/** 
* Function to generate unique encryption keys for environment variables.
* @return {void}
*/
const generateEncKeys = () => {
  const mode = process.argv[2].split('=')[1] || 'DEVELOPMENT';
  console.log(`Generating new encryption keys for ${mode} mode...\n`);

  try {
    envPath = path.resolve(process.cwd(), envFiles[mode]);
    envExamplePath = path.resolve(process.cwd(), '.env.example');
  } catch (err) {
    console.error('Error resolving env paths:', err);
    return;
  }

  try {
    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        try {
          fs.copyFileSync(envExamplePath, envPath);
        } catch (err) {
          console.error(`Error copying .env.example to ${envFiles[mode]}:`, err);
          return;
        }
      } else {
        try {
          fs.writeFileSync(envPath, '');
        } catch (err) {
          console.error(`Error creating empty ${envFiles[mode]} file:`, err);
          return;
        }
      }
    }
  } catch (err) {
    console.error(`Error checking/creating ${envFiles[mode]} files:`, err);
    return;
  }

  // Read .env file content to variable ENV
  let ENV;
  try {
    ENV = fs.readFileSync(envPath, 'utf8');
  } catch (err) {
    console.error(`Error reading ${envFiles[mode]} file:`, err);
    return;
  }
  try {
    ENV = ENV
      .split('\n')
      .filter(line => line.trim() !== '' && !line.trim().startsWith('#'))
      .map(line => line.replace(/\r$/, ''))
      .map(line => {
        const idx = line.indexOf('=');
        const key = line.slice(0, idx);
        let value = line.slice(idx + 1);
        // Remove surrounding quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        return [key, value];
      });
    ENV = Object.fromEntries(ENV);
  } catch (err) {
    console.error(`Error parsing ${envFiles[mode]} file:`, err);
    return;
  }

  // Generate fresh, unique, 128-character keys for every VITE_STORAGE_* value.
  // In DEVELOPMENT mode existing valid keys are PRESERVED so the dev encryption
  // keys stay stable across `yarn dev` restarts. The browser session storage is
  // kept between restarts via the persistent profile (web-ext.config.ts); if
  // these keys changed mid-session, every previously-synced item would become
  // unreadable because getKey derives all storage locations from them. PRODUCTION
  // mode always regenerates - there is no live session to invalidate there.
  try {
    const isDevelopment = mode === 'DEVELOPMENT';
    const isValidKey = value => typeof value === 'string' && /^[0-9a-f]{128}$/i.test(value);
    const storageKeys = Object.keys(ENV).filter(key => key.startsWith('VITE_STORAGE_'));
    const keysToGenerate = isDevelopment ? storageKeys.filter(key => !isValidKey(ENV[key])) : storageKeys;
    const existingValues = new Set(storageKeys.map(key => ENV[key]).filter(isValidKey));
    const newValues = new Set();

    while (newValues.size < keysToGenerate.length) {
      const candidate = crypto.randomBytes(64).toString('hex');

      if (!existingValues.has(candidate)) {
        newValues.add(candidate);
      }
    }

    const generated = Array.from(newValues);
    let generatedIndex = 0;

    for (const key of keysToGenerate) {
      ENV[key] = generated[generatedIndex++];
    }

    if (isDevelopment) {
      console.log(`Storage keys: preserved ${storageKeys.length - keysToGenerate.length}, generated ${keysToGenerate.length}.`);
    }
  } catch (err) {
    console.error('Error generating storage keys:', err);
    return;
  }

  // Regenerate VITE_BEACON for unique beacon URL per build
  try {
    if ('VITE_BEACON' in ENV) {
      ENV['VITE_BEACON'] = crypto.randomBytes(64).toString('hex');
    }
  } catch (err) {
    console.error('Error generating VITE_BEACON:', err);
    return;
  }

  // Save updated ENV as .env file
  try {
    const envString = Object.entries(ENV)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    fs.writeFileSync(envPath, envString, 'utf8');
    console.log(`New encryption keys generated and saved to ${envFiles[mode]} file.\n`);
  } catch (err) {
    console.error(`Error writing updated ${envFiles[mode]} file:`, err);
  }
};

generateEncKeys();
