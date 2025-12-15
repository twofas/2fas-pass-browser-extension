// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { defineConfig } from 'wxt';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  imports: {
    eslintrc: {
      enabled: 9
    }
  },
  vite: configEnv => ({
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    },
    build: configEnv.command === 'serve' ? {} : {
      cssMinify: true,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          defaults: true,
          booleans: true,
          collapse_vars: true,
          comparisons: true,
          computed_props: true,
          conditionals: true,
          dead_code: false,
          directives: false,
          drop_console: false,
          drop_debugger: false,
          evaluate: true,
          if_return: true,
          join_vars: true,
          keep_classnames: false,
          keep_fargs: false,
          keep_fnames: false,
          keep_infinity: false,
          lhs_constants: true,
          loops: true,
          passes: 3,
          properties: true
        },
        mangle: {
          eval: false,
          keep_classnames: true,
          keep_fnames: false,
        },
        format: {
          ascii_only: false,
          braces: false,
          comments: false,
          indent_level: 0,
          indent_start: 0,
          keep_numbers: false,
          keep_quoted_props: false,
          max_line_len: false
        },
        keep_classnames: false,
        keep_fnames: false
      }
    },
    plugins: [svgr()]
  }),
  manifest: ({ browser, manifestVersion }) => {
    const manifestObj = {
      manifest_version: manifestVersion,
      name: '2FAS Pass Browser Extension',
      short_name: '2FAS Pass',
      author: 'Two Factor Authentication Service, Inc.',
      description: '__MSG_appDesc__',
      default_locale: 'en',
      icons: { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 96: 'icons/icon96.png', 128: 'icons/icon128.png' },
      action: {
        default_icon: { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 96: 'icons/icon96.png', 128: 'icons/icon128.png' },
        default_title: '2FAS Pass'
      },
      content_security_policy: {
        "extension_pages": "script-src 'self'; object-src 'self'"
      }
    };

    if (browser !== 'safari') {
      manifestObj.permissions = [
        "activeTab",
        "tabs",
        "storage",
        "notifications",
        "contextMenus",
        "clipboardWrite",
        "webNavigation",
        "alarms",
        "idle",
        "privacy",
        "scripting",
        "webRequest"
      ];

      manifestObj.optional_permissions = [
        "clipboardRead",
      ];

      manifestObj.commands = {
        "2fas_pass_shortcut_autofill": {
          "description": "__MSG_autofillCommand__",
          "suggested_key": {
            "default": "Ctrl+Shift+1",
            "mac": "MacCtrl+Shift+1"
          }
        }
      };

      manifestObj.incognito = 'spanning';
    } else {
      // Safari
      manifestObj.permissions = [
        "activeTab",
        "tabs",
        "storage",
        "contextMenus",
        "clipboardWrite",
        "webNavigation",
        "alarms",
        "scripting"
      ];

      manifestObj.commands = {
        "2fas_pass_shortcut_autofill": {
          "description": "__MSG_autofillCommand__",
          "suggested_key": {
            "default": "Ctrl+Shift+Comma",
            "mac": "MacCtrl+Shift+Comma"
          }
        }
      };
    }

    // Chrome, Opera, Edge
    if (browser !== 'firefox' && browser !== 'safari') {
      manifestObj.minimum_chrome_version = '135';
    }

    if (browser === 'firefox') {
      manifestObj.browser_specific_settings = {
        gecko: {
          id: '{2fa5f682-d4c4-40e3-8ad2-c8404283d4f9}',
          strict_min_version: '131.0'
        }
      };
    }

    return manifestObj;
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      delete manifest.background;

      if (wxt?.config?.browser === 'safari') {
        manifest.background = {
          scripts: ['background.js']
        };
      } else if (wxt?.config?.browser === 'firefox') {
        manifest.background = {
          scripts: ['background.js'],
          type: 'module'
        };
      } else {
        manifest.background = {
          service_worker: 'background.js'
        };
      }
    }
  },
  zip: {
    artifactTemplate: '{{name}}-{{version}}-{{browser}}-{{mode}}.zip',
    sourcesTemplate: '{{name}}-{{version}}-{{browser}}-{{mode}}-sources.zip'
  }
});
