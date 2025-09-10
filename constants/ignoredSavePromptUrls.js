// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const ignoredSavePromptUrls = Object.freeze([
  'captcha',
  'google-analytics',
  'analytics',
  'analytics.google.com',
  'i.clarity.ms',
  'bat.bing.com',
  'bat.bing-int.com',
  'ib.adnxs.com',
  'grid-bidder.criteo.com',
  '/search',
  '/weltpixel_ga4',
  'sentry',
  'hotjar',
  '/SendEventData',
  'cdn.concert.io',
  'wizardstrategy.com',
  'browser-intake-datadoghq.com',
  'api.statsig.com',
  'featuregates.org',
  'statsigapi.net',
  'events.statsigapi.net',
  'api.statsigcdn.com',
  'featureassets.org',
  'assetsconfigcdn.org',
  'prodregistryv2.org',
  'beyondwickedmapping.org'
]);

export default ignoredSavePromptUrls;
