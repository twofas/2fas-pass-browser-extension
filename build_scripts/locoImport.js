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

const urls = {
  en: `https://localise.biz/api/export/locale/en.json?format=chrome&key=${process.env.LOCO_KEY}`
};

const excludedDirs = [
  '.output',
  '.wxt',
  'assets',
  'mobile-mock',
  'node_modules',
  'testFiles',
  'public'
];

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
      } else if (!excludedDirs.includes(file)) {
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
  locoFiles.forEach(locoFile => {
    const { language, data } = locoFile;
    const localFilesForLanguage = messagesContent.filter(file => file.language === language);
    const dataKeys = Object.keys(data);

    dataKeys.forEach(key => {
      let used = false;

      localFilesForLanguage.forEach(file => {
        const fileKeys = Object.keys(file.data);
        
        if (fileKeys.includes(key)) {
          file.data[key] = data[key];
          used = true;
        }
      });

      if (!used) {
        console.log(`${key} not used!`);
      }
    });
  });

  messagesContent.forEach(file => {
    fs.writeFileSync(file.path, JSON.stringify(file.data, null, 2), 'utf8');
  });
};

const localesFolders = getLocalesFolders('./', excludedDirs);
const languages = getLanguages(urls);
const messagesFiles = getMessagesFiles(localesFolders, languages);
const messagesContent = getMessagesContent(messagesFiles);

downloadFiles(urls).then(downloadedFiles => {
  updateFiles(downloadedFiles, messagesContent);
}).catch(err => {
  console.error('Error downloading files:', err);
});

