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

  // Generate random, unique, 128-character strings using crypto
  let uniqueRandomStrings;
  try {
    const storageKeysCount = Object.keys(ENV).filter(key => key.startsWith('VITE_STORAGE_')).length;
    const randomStrings = new Set();
    while (randomStrings.size < storageKeysCount) {
      randomStrings.add(crypto.randomBytes(64).toString('hex'));
    }
    uniqueRandomStrings = Array.from(randomStrings);
  } catch (err) {
    console.error('Error generating random strings:', err);
    return;
  }

  // Assign a unique random string to every ENV key that starts with VITE_STORAGE_
  try {
    let randomIndex = 0;
    for (const key in ENV) {
      if (key.startsWith('VITE_STORAGE_')) {
        ENV[key] = uniqueRandomStrings[randomIndex++];
      }
    }
  } catch (err) {
    console.error('Error assigning random strings to ENV:', err);
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
