// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginJs  from '@eslint/js';
import autoImports from './.wxt/eslint-auto-imports.mjs';
import react from 'eslint-plugin-react';

export default defineConfig([
  globalIgnores([
    'node_modules/**',
    'build/**',
    'dist/**',
    '.output/**/*',
    '.wxt/**/*',
    'mobile-mock/**/*',
    '2FAS Pass Browser Extension/**/*',
    '2FAS Pass BE - Dev/**/*',
    'testFiles/**/*'
  ]),
  autoImports,
  {
    ...pluginJs.configs.recommended,
    languageOptions: {
       ...pluginJs.configs.recommended.languageOptions,
       globals: { ...globals.browser },
    }
  },
	{
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: { ...globals.browser },
    },
		rules: {
			semi: "error",
			"prefer-const": "error",
      "no-unused-vars": "warn",
      "no-empty": [
        "error",
        {
          "allowEmptyCatch": true
        }
      ]
    }
	},
  {
    files: ['**/*.jsx'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react
    },
    rules: {
			semi: "error",
			"prefer-const": "error",
      "no-unused-vars": "warn",
      "no-empty": [
        "error",
        {
          "allowEmptyCatch": true
        }
      ],
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error"
		},
  }
]);
