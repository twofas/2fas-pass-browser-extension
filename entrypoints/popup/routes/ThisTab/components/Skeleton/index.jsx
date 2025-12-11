// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/Skeleton.module.scss';

/** 
* Function to render a skeleton component.
* @return {JSX.Element} The rendered component.
*/
function Skeleton (props) {
  return <span className={`${S.skeleton} ${props.type ? S[props.type] : ''}`}>&nbsp;</span>;
}

export default Skeleton;
