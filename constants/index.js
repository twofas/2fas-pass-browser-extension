// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Files with default exports
export { default as allowedSavePromptRequests } from './allowedSavePromptRequests.js';
export { default as badgeIcons } from './badgeIcons.js';
export { default as correctProtocols } from './correctProtocols.js';
export { default as ENCRYPTION_KEYS } from './encryptionKeys.js';
export { default as ignoredSavePromptRequestBodyTexts } from './ignoredSavePromptRequestBodyTexts.js';
export { default as ignoredSavePromptUrls } from './ignoredSavePromptUrls.js';
export { default as ignoredTypes } from './ignoredTypes.js';
export { default as passwordSelectors } from './passwordSelectors.js';
export { default as secIconColors } from './secIconColors.js';
export { default as secIconSVGs } from './secIconSVGs.js';
export { default as selectors } from './selectors.js';
export { default as userNameAttributes } from './userNameAttributes.js';
export { default as userNameDeniedKeywords } from './userNameDeniedKeywords.js';
export { default as userNameFormTexts } from './userNameFormTexts.js';
export { default as userNameSelectors } from './userNameSelectors.js';
export { default as userNameTexts } from './userNameTexts.js';
export { default as userNameWords } from './userNameWords.js';

// Re-export all named exports from regex.js
export {
  HEX_REGEX,
  SERVICE_REGEX,
  FETCH_REGEX,
  PASSWORD_T2_RESET_REGEX,
  AUTO_CLEAR_CLIPBOARD_REGEX,
  URL_REGEX,
  IP_REGEX
} from './regex.js';

// Re-export named export from savePromptActions.js
export { SAVE_PROMPT_ACTIONS } from './savePromptActions.js';
