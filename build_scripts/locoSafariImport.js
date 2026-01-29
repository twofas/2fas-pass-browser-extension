// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/* global process */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.LOCO_SAFARI_KEY) {
  console.error('LOCO_SAFARI_KEY environment variable is not set.');
  process.exit(1);
}

const url = `https://localise.biz/api/export/all.xcstrings?key=${process.env.LOCO_SAFARI_KEY}`;

const outputPaths = [
  './2FAS Pass Browser Extension/2FAS Pass Browser Extension/Localizable.xcstrings',
  './2FAS Pass BE - Dev/Shared (App)/Localizable.xcstrings'
];

/**
 * Downloads the xcstrings file from the Loco API.
 * @async
 * @param {string} url - The URL to download the xcstrings file from.
 * @return {Promise<Object>} A promise that resolves to the parsed JSON data.
 */
const downloadXcstrings = async url => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse xcstrings response: ${err.message}`));
        }
      });
    }).on('error', err => {
      reject(err);
    });
  });
};

/**
 * Ensures that the directory for a file path exists.
 * @param {string} filePath - The file path to check.
 * @return {void}
 */
const ensureDirectoryExists = filePath => {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

/**
 * Saves the xcstrings data to multiple output paths.
 * @param {Object} data - The parsed xcstrings JSON data.
 * @param {Array<string>} paths - An array of file paths to save the data to.
 * @return {void}
 */
const saveXcstrings = (data, paths) => {
  paths.forEach(outputPath => {
    ensureDirectoryExists(outputPath);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`Saved: ${outputPath}`);
  });
};

/**
 * Logs information about the downloaded xcstrings file.
 * @param {Object} data - The parsed xcstrings JSON data.
 * @return {void}
 */
const logXcstringsInfo = data => {
  const sourceLanguage = data.sourceLanguage || 'unknown';
  const stringKeys = Object.keys(data.strings || {});
  const languages = new Set();

  stringKeys.forEach(key => {
    const localizations = data.strings[key]?.localizations;

    if (localizations) {
      Object.keys(localizations).forEach(lang => languages.add(lang));
    }
  });

  console.log(`\nSource language: ${sourceLanguage}`);
  console.log(`Languages found: ${[...languages].join(', ')}`);
  console.log(`Total string keys: ${stringKeys.length}`);
};

console.log('Downloading xcstrings from Loco...\n');

downloadXcstrings(url)
  .then(data => {
    logXcstringsInfo(data);
    console.log('');
    saveXcstrings(data, outputPaths);
    console.log(`\nSuccessfully updated ${outputPaths.length} Localizable.xcstrings files.`);
  })
  .catch(err => {
    console.error('Error downloading xcstrings:', err);
    process.exit(1);
  });
