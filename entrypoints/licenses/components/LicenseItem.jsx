// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Licenses.module.scss';
import { memo, useCallback, useId, useMemo, useState } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import getEntryDetails, { getSafeUrl } from '../functions/getEntryDetails';
import { getLicenseGroup } from '../functions/licenseGroups';

const GROUP_LABELS = /* @__PURE__ */ Object.freeze({
  extension: 'licenses_group_extension',
  development: 'licenses_group_development',
  fonts: 'licenses_group_fonts',
  other: 'licenses_group_other'
});

/**
* Renders a text value, as a link when it is a web URL.
* @param {Object} props - The component props.
* @param {string} props.value - Value to render.
* @return {JSX.Element} The rendered value.
*/
function DetailText ({ value }) {
  const url = getSafeUrl(value);

  if (!url) {
    return <span>{value}</span>;
  }

  return <a href={url} target='_blank' rel='noopener noreferrer' title={value}>{value}</a>;
}

/**
* Renders one entry of the open source license list: a summary row that expands to every detail and the full license texts.
* @param {Object} props - The component props.
* @param {Object} props.entry - License entry.
* @return {JSX.Element} The rendered entry.
*/
function LicenseItem ({ entry }) {
  const { getMessage } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const group = getLicenseGroup(entry);

  const details = useMemo(() => {
    return expanded ? getEntryDetails(entry) : [];
  }, [expanded, entry]);

  const licenseFiles = useMemo(() => {
    return expanded ? Object.entries(entry.licenseFiles || {}) : [];
  }, [expanded, entry]);

  const handleToggle = useCallback(() => {
    setExpanded(value => !value);
  }, []);

  /**
  * Formats a text detail for display.
  * @param {Object} detail - Detail from getEntryDetails.
  * @return {string} Display value.
  */
  const formatText = detail => {
    if (detail.key === 'direct') {
      return getMessage(detail.value === 'true' ? 'licenses_yes' : 'licenses_no');
    }

    if (detail.key === 'dependencyType') {
      return getMessage(GROUP_LABELS[group]);
    }

    return detail.value;
  };

  return (
    <li className={`${S.licensesItem} ${expanded ? S.expanded : ''}`}>
      <button type='button' className={S.licensesItemHeader} onClick={handleToggle} aria-expanded={expanded} aria-controls={panelId}>
        <span className={S.licensesItemName} title={entry.name}>{entry.name}</span>
        <span className={S.licensesItemVersion} title={entry.installedVersion}>{entry.installedVersion}</span>
        <span className={`${S.licensesItemGroup} ${S[group]}`}>{getMessage(GROUP_LABELS[group])}</span>
        <span className={S.licensesItemLicense} title={entry.licenseType}>{entry.licenseType}</span>
        <span className={S.licensesItemChevron} aria-hidden='true' />
      </button>

      {expanded && (
        <div id={panelId} className={S.licensesItemBody}>
          <dl className={S.licensesItemDetails}>
            {details.map(detail => (
              <div key={detail.key} className={S.licensesItemDetail}>
                <dt>{getMessage(detail.label)}</dt>
                <dd>
                  {detail.kind === 'pairs' ? (
                    <ul>
                      {detail.value.map(([name, value]) => (
                        <li key={name}>
                          <span className={S.licensesItemPairName}>{name}</span>
                          <DetailText value={value} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <DetailText value={formatText(detail)} />
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className={S.licensesItemFiles}>
            {licenseFiles.length === 0 && <p className={S.licensesItemNoFile}>{getMessage('licenses_no_license_text')}</p>}
            {licenseFiles.map(([fileName, text]) => (
              <section key={fileName} className={S.licensesItemFile}>
                <h3>{fileName}</h3>
                <pre>{text}</pre>
              </section>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export default memo(LicenseItem);
