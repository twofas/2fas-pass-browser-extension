// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getServices from '@/partials/sessionStorage/getServices';
import URIMatcher from '@/partials/URIMatcher';

/** 
* Function to configure the context menu for the 2FAS Pass Browser Extension.
* @async
* @return {void}
*/
const contextMenuConfigured = async () => {
  const contexts = ['page', 'editable'];

  if (import.meta.env.BROWSER !== 'safari')  {
    contexts.push('page_action');
  }

  let contextMenuSetting, services;

  try {
    contextMenuSetting = await storage.getItem('local:contextMenu');
  } catch (e) {
    await CatchError(e);
  }

  if (contextMenuSetting === false) {
    return;
  }

  try {
    services = await getServices();
  } catch (e) {
    await CatchError(e);
  }

  await browser.contextMenus.removeAll();

  // Top context menu
  try {
    browser.contextMenus.create({
      id: '2fas-pass-configured',
      enabled: true,
      title: '2FAS Pass Browser Extension',
      type: 'normal',
      visible: true,
      contexts
    });
  } catch (e) {
    await CatchError(e);
  }

  services.forEach(async service => {
    if (service.securityType !== SECURITY_TIER.HIGHLY_SECRET && service.securityType !== SECURITY_TIER.SECRET) {
      return;
    }

    const uris = service.uris;
    let recognizedURIs = [];
    let documentUrlPatterns = [];

    try {
      recognizedURIs = URIMatcher.recognizeURIs(uris);

      if (recognizedURIs?.urls && recognizedURIs?.urls.length > 0) {
        documentUrlPatterns = recognizedURIs.urls.map(uri => {
          return URIMatcher.generateDocumentUrlPatterns(uri);
        }).flat();
      }
    } catch {}

    if (!documentUrlPatterns || documentUrlPatterns.length <= 0) {
      return;
    }

    if (
      service?.securityType === SECURITY_TIER.SECRET ||
      (service?.securityType === SECURITY_TIER.HIGHLY_SECRET && service?.password && service?.password?.length > 0)
    ) {
      try {
        browser.contextMenus.create({
          id: `2fas-pass-autofill-${service.id}`,
          enabled: true,
          title: `${browser.i18n.getMessage('autofill')} ${service.username || service.name}`,
          type: 'normal',
          visible: true,
          parentId: '2fas-pass-configured',
          documentUrlPatterns,
          contexts
        });
      } catch (e) {
        await CatchError(e);
      }
    } else if (service?.securityType === SECURITY_TIER.HIGHLY_SECRET && !service?.password || service?.password?.length <= 0) {
      try {
        browser.contextMenus.create({
          id: `2fas-pass-fetch-${service.id}|${service.deviceId}`,
          enabled: true,
          title: `${browser.i18n.getMessage('fetch')} ${service.username || service.name}...`,
          type: 'normal',
          visible: true,
          parentId: '2fas-pass-configured',
          documentUrlPatterns,
          contexts
        });
      } catch (e) {
        await CatchError(e);
      }
    } else {
      throw new TwoFasError(TwoFasError.internalErrors.wrongSecurityType, {
        additional: {
          securityType: service.securityType,
          func: 'contextMenuConfigured'
        }
      });
    }
  });

  // No accounts item
  try {
    browser.contextMenus.create({
      id: '2fas-pass-no-accounts',
      enabled: false,
      title: browser.i18n.getMessage('background_contextMenuConfigured_no_accounts'),
      type: 'normal',
      visible: false,
      parentId: '2fas-pass-configured',
      contexts
    });
  } catch (e) {
    await CatchError(e);
  }

  // Separator
  try {
    browser.contextMenus.create({
      id: '2fas-pass-separator',
      type: 'separator',
      parentId: '2fas-pass-configured',
      contexts
    });
  } catch (e) {
    await CatchError(e);
  }

  // Add account
  try {
    browser.contextMenus.create({
      id: '2fas-pass-add-account',
      enabled: true,
      title: browser.i18n.getMessage('background_contextMenuConfigured_add_account'),
      type: 'normal',
      visible: true,
      parentId: '2fas-pass-configured',
      contexts
    });
  } catch (e) {
    await CatchError(e);
  }
};

export default contextMenuConfigured;
