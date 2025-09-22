// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class Login {
  contentType = 'login';
  contentVersion = 1;

  constructor (data) {
    this.id = data.id;
    this.name = data.content.name;
    this.username = data.content.username;
    this.s_password = data.content.s_password;
    this.uris = data.content.uris || [];
    this.iconType = data.content.iconType || 0; // Check default
    this.iconUriIndex = data.content.iconUriIndex || null;
    this.labelText = data.content.labelText || null; // Generate default
    this.labelColor = data.content.labelColor || null;
    this.customImageUrl = data.content.customImageUrl || null;
    this.notes = data.content.notes || null;
    this.securityType = data.securityType || 0; // Check default
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }
}

export default Login;
