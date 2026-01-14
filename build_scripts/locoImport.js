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

if (!process.env.LOCO_KEY) {
  console.error('LOCO_KEY environment variable is not set.');
  process.exit(1);
}

const urls = {
  en: `https://localise.biz/api/export/locale/en.json?format=chrome&key=${process.env.LOCO_KEY}`,
  pl: `https://localise.biz/api/export/locale/pl.json?format=chrome&key=${process.env.LOCO_KEY}`
};

const excludedDirsSet = new Set([
  '.output',
  '.wxt',
  'assets',
  'mobile-mock',
  'node_modules',
  'testFiles',
  'public'
]);

/** 
* Function to get all `_locales` folders in the directory recursively.
* @param {string} dir - The directory to search in.
* @param {Array<string>} excludedDirs - An array of directory names to exclude from the search.
* @return {Array<string>} An array of paths to the `_locales` folders found.
*/
const getLocalesFolders = (dir, excludedDirs) => {
  let results = [];

  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (file === '_locales') {
        results.push(filePath);
      } else if (!excludedDirs.has(file)) {
        results = results.concat(getLocalesFolders(filePath, excludedDirs));
      }
    }
  });

  return results;
};

/**
 * Function to get the languages from the URLs object.
 * @param {Object} urls - An object containing language codes as keys and their corresponding URLs as values.
 * @return {Array<string>} An array of language codes.
 */
const getLanguages = urls => {
  return Object.keys(urls);
};

/**
 * Function to ensure language directories and messages.json files exist for all languages.
 * Creates missing directories and files based on the English (en) version structure.
 * @param {Array<string>} localesFolders - An array of paths to the `_locales` folders.
 * @param {Array<string>} languages - An array of language codes.
 * @return {void}
 */
const ensureLanguageFilesExist = (localesFolders, languages) => {
  localesFolders.forEach(folder => {
    const enMessagesPath = path.join(folder, 'en', 'messages.json');

    if (!fs.existsSync(enMessagesPath)) {
      return;
    }

    const enContent = fs.readFileSync(enMessagesPath, 'utf8');
    const enData = JSON.parse(enContent);

    languages.forEach(language => {
      if (language === 'en') {
        return;
      }

      const languageDir = path.join(folder, language);
      const messagesFilePath = path.join(languageDir, 'messages.json');

      if (!fs.existsSync(languageDir)) {
        fs.mkdirSync(languageDir, { recursive: true });
        console.log(`Created directory: ${languageDir}`);
      }

      if (!fs.existsSync(messagesFilePath)) {
        fs.writeFileSync(messagesFilePath, JSON.stringify(enData, null, 2), 'utf8');
        console.log(`Created file: ${messagesFilePath}`);
      }
    });
  });
};

/**
 * Function to get the paths of messages files for each language in the `_locales` folders.
 * @param {Array<string>} localesFolders - An array of paths to the `_locales` folders.
 * @param {Array<string>} languages - An array of language codes.
 * @return {Object} An object mapping language codes to their corresponding messages file paths.
 */
const getMessagesFiles = (localesFolders, languages) => {
  const messagesFiles = {};

  localesFolders.forEach(folder => {
    languages.forEach(language => {
      const messagesFilePath = path.join(folder, language, 'messages.json');

      if (fs.existsSync(messagesFilePath)) {
        if (!messagesFiles[language]) {
          messagesFiles[language] = [];
        }

        messagesFiles[language].push(messagesFilePath);
      }
    });
  });

  return messagesFiles;
};

/**
 * Function to read the content of messages files for each language.
 * @param {Object} messagesFiles - An object mapping language codes to their corresponding messages file paths.
 * @return {Array<Object>} An array of objects containing the path, language, and parsed data of each messages file.
 */
const getMessagesContent = messagesFiles => {
  const messagesContent = [];

  Object.keys(messagesFiles).forEach(language => {
    messagesFiles[language].forEach(filePath => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      messagesContent.push({ path: filePath, language, data: JSON.parse(fileContent) });
    });
  });

  return messagesContent;
};

/**
 * Function to download files from the URLs provided.
 * @async
 * @param {Object} urls - An object containing language codes as keys and their corresponding URLs as values.
 * @return {Promise<Array<Object>>} A promise that resolves to an array of objects containing the language and downloaded data.
 */
const downloadFiles = async urls => {
  const downloadPromises = Object.keys(urls).map(language => {
    return new Promise((resolve, reject) => {
      const url = urls[language];
      https.get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ language, data: JSON.parse(data) });
        });
      }).on('error', err => {
        reject(err);
      });
    });
  });

  return Promise.all(downloadPromises);
};

/**
 * Function to update the messages files with the downloaded data.
 * @param {Array<Object>} locoFiles - An array of objects containing the language and downloaded data.
 * @param {Array<Object>} messagesContent - An array of objects containing the path, language, and parsed data of each messages file.
 * @return {void}
 */
const updateFiles = (locoFiles, messagesContent) => {
  const unusedKeysByLanguage = {};

  locoFiles.forEach(locoFile => {
    const { language, data } = locoFile;
    const localFilesForLanguage = messagesContent.filter(file => file.language === language);
    const dataKeys = Object.keys(data);

    dataKeys.forEach(key => {
      let used = false;

      localFilesForLanguage.forEach(file => {
        const fileKeys = Object.keys(file.data);
        const fileKeysSet = new Set(fileKeys);

        if (fileKeysSet.has(key)) {
          file.data[key] = data[key];
          used = true;
        }
      });

      if (!used) {
        if (!unusedKeysByLanguage[language]) {
          unusedKeysByLanguage[language] = [];
        }

        unusedKeysByLanguage[language].push(key);
      }
    });
  });

  Object.keys(unusedKeysByLanguage).forEach(language => {
    const unusedKeys = unusedKeysByLanguage[language];

    if (unusedKeys.length > 0) {
      console.log(`\n[${language}] ${unusedKeys.length} keys from Loco not found in local files:`);
      unusedKeys.forEach(key => {
        console.log(`  - ${key}`);
      });
    }
  });

  messagesContent.forEach(file => {
    fs.writeFileSync(file.path, JSON.stringify(file.data, null, 2), 'utf8');
  });

  console.log(`\nUpdated ${messagesContent.length} messages.json files.`);
};

const localesFolders = getLocalesFolders('./', excludedDirsSet);
const languages = getLanguages(urls);

console.log(`Found ${localesFolders.length} _locales folders.`);
console.log(`Languages to process: ${languages.join(', ')}\n`);

ensureLanguageFilesExist(localesFolders, languages);

const messagesFiles = getMessagesFiles(localesFolders, languages);
const messagesContent = getMessagesContent(messagesFiles);

downloadFiles(urls).then(downloadedFiles => {
  updateFiles(downloadedFiles, messagesContent);
}).catch(err => {
  console.error('Error downloading files:', err);
});

