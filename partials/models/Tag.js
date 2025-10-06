// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

class Tag {
  static contentType = 'tag';
  static contentVersion = 1;

  constructor (data) {
    this.id = data.id;
    this.name = data.content.name;
    this.color = data?.content?.color || null;
    this.position = data?.content?.position || null;
    this.updatedAt = data.updatedAt || null;
  }
}

export default Tag;
