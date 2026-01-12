// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/Skeleton.module.scss';

/**
 * Renders a skeleton loading placeholder
 * @param {Object} props - Component props
 * @param {string} props.type - Optional type for additional styling (e.g., 'icon')
 * @param {Object} props.style - Optional inline styles (e.g., { width: '100px' })
 * @returns {JSX.Element} The skeleton element
 */
function Skeleton ({ type, style }) {
  return <span className={`${S.skeleton} ${type ? S[type] : ''}`} style={style}>&nbsp;</span>;
}

export default Skeleton;
