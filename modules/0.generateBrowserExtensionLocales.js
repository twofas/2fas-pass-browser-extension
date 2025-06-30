// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import fs from 'node:fs';
import path from 'node:path';
import { defineWxtModule } from 'wxt/modules';

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
* Function to get all `_locales` folders in the project directory.
* @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
* @return {Array<string>} The list of `_locales` folders found.
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
* Function to get all languages from the `_locales` folders.
* @param {Array<string>} localesFolders - The list of `_locales` folders.
* @return {Array<string>} The list of languages found.
*/
const getLanguages = localesFolders => {
  const languages = new Set();

  localesFolders.forEach(folder => {
    const subfolders = fs.readdirSync(folder);
    subfolders.forEach(subfolder => {
      const subfolderPath = path.join(folder, subfolder);
      if (fs.statSync(subfolderPath).isDirectory()) {
        languages.add(subfolder);
      }
    });
  });

  return Array.from(languages);
};

 /** 
* Function to get all messages files from the `_locales` folders.
* @param {Array<string>} localesFolders - The list of `_locales` folders.
* @return {Object} The messages files found.
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
* Function to concatenate messages from multiple files.
* @param {Object} messagesFiles - The messages files found.
* @return {Object} The concatenated messages.
*/
const concatMessagesFiles = messagesFiles => {
  const allMessages = {};

  Object.keys(messagesFiles).forEach(language => {
    allMessages[language] = {};

    messagesFiles[language].forEach(filePath => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonContent = JSON.parse(fileContent);
      Object.assign(allMessages[language], jsonContent);
    });
  });

  return allMessages;
};

 /** 
* Function to clean a directory by removing all files and subdirectories.
* @param {string} dir - The directory to clean.
* @return {void}
*/
const cleanDirectory = dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        cleanDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dir);
  }
};

 /** 
* Function to save messages to a file.
* @param {Object} allMessages - The concatenated messages.
* @param {string} outputDir - The output directory.
* @return {void}
*/
const saveMessagesToFile = (allMessages, outputDir) => {
  cleanDirectory(outputDir);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  Object.keys(allMessages).forEach(language => {
    const languageDir = path.join(outputDir, language);
    if (!fs.existsSync(languageDir)) {
      fs.mkdirSync(languageDir);
    }
    const outputFilePath = path.join(languageDir, 'messages.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(allMessages[language], null, 2), 'utf8');
  });
};

export default defineWxtModule({
  setup (wxt) {
    wxt.hook('build:before', () => {
      const localesFolders = getLocalesFolders('./', excludedDirs);
      const languages = getLanguages(localesFolders);
      const messagesFiles = getMessagesFiles(localesFolders, languages);
      const allMessages = concatMessagesFiles(messagesFiles);

      saveMessagesToFile(allMessages, path.join('./', 'public', '_locales'));
    });
  }
});
