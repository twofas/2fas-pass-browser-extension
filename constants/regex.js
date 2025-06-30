// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

export const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const SERVICE_REGEX = /^2fas\-pass\-autofill\-(.*)$/;
export const FETCH_REGEX = /^2fas\-pass\-fetch\-(.*)\|(.*)$/;
export const PASSWORD_T2_RESET_REGEX = /^passwordT2Reset\-(.*)$/;
export const PROTOCOL_REGEX = /^(?:f|ht)tps?\:\/\//i;
export const URL_REGEX = /^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?\S{1,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?/;
export const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?::\d{0,4})?\b/;
export const LOCAL_DOMAIN_WO_TLD_REGEX = /^(https:\/\/|http:\/\/)[a-zA-Z]*(\:\d{0,5})?/;
