// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class SecureNote {
  static contentType = 'secureNote';
  static contentVersion = 1;

  contentVersion = 1;

  constructor (data) {
    this.id = data.id;
    this.name = data.content.name;
    this.s_text = data.content.s_text;
    this.securityType = data.content.securityType || 0; // Check default
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }
}

export default SecureNote;
