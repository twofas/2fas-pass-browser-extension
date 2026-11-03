// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Licenses.module.scss';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import LicenseItem from './components/LicenseItem';
import { filterLicenses, summarizeLicenses } from './functions/licenseGroups';
import Logo from '@/assets/logo.svg?react';
import LogoDark from '@/assets/logo-dark.svg?react';

const GROUP_TILES = /* @__PURE__ */ Object.freeze([
  ['extension', 'licenses_summary_extension'],
  ['development', 'licenses_summary_development'],
  ['fonts', 'licenses_summary_fonts']
]);

/**
* Reads the extension version from the manifest.
* @return {string} Version or an empty string.
*/
const getVersion = () => {
  try {
    return browser.runtime.getManifest().version;
  } catch {
    return '';
  }
};

/**
* Renders the open source licenses page: a summary of the license list, filters, a search box and the expandable entries.
* @param {Object} props - The component props.
* @param {Object[]} props.entries - License entries (open-source-licenses.json).
* @return {JSX.Element} The rendered page.
*/
function Licenses ({ entries }) {
  const { getMessage } = useI18n();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(null);
  const deferredQuery = useDeferredValue(query);
  const version = useMemo(getVersion, []);

  const list = useMemo(() => {
    return Array.isArray(entries) ? entries : [];
  }, [entries]);

  const summary = useMemo(() => summarizeLicenses(list), [list]);

  const filtered = useMemo(() => {
    return filterLicenses(list, { group, query: deferredQuery });
  }, [list, group, deferredQuery]);

  const hasFilters = group !== null || query !== '';

  const handleQueryChange = useCallback(e => {
    setQuery(e.target.value);
  }, []);

  const handleGroupClick = useCallback(e => {
    const value = e.currentTarget.dataset.group;
    setGroup(current => (current === value ? null : value));
  }, []);

  const handleClearFilters = useCallback(() => {
    setQuery('');
    setGroup(null);
  }, []);

  useEffect(function setDocumentTitle() {
    document.title = getMessage('licenses_page_title');
  }, [getMessage]);

  return (
    <div className={S.licenses}>
      <header className={S.licensesHeader}>
        <div className={S.licensesHeaderLogo}>
          <Logo className='theme-light' />
          <LogoDark className='theme-dark' />
        </div>
        <div className={S.licensesHeaderText}>
          <h1>{getMessage('licenses_page_title')}</h1>
          <p>{getMessage('licenses_page_description').replace('VERSION', version)}</p>
        </div>
      </header>

      <main className={S.licensesMain}>
        <section className={S.licensesSummary} aria-label={getMessage('licenses_summary_label')}>
          <button type='button' className={`${S.licensesSummaryTile} ${group === null ? S.active : ''}`} onClick={handleClearFilters}>
            <strong>{summary.total}</strong>
            <span>{getMessage('licenses_summary_total')}</span>
          </button>

          {GROUP_TILES.map(([value, label]) => (
            <button type='button' key={value} data-group={value} className={`${S.licensesSummaryTile} ${group === value ? S.active : ''}`} onClick={handleGroupClick} aria-pressed={group === value}>
              <strong>{summary.groups[value]}</strong>
              <span>{getMessage(label)}</span>
            </button>
          ))}
        </section>

        <div className={S.licensesToolbar}>
          <input
            type='search'
            className={S.licensesSearch}
            value={query}
            onChange={handleQueryChange}
            placeholder={getMessage('licenses_search_placeholder')}
            aria-label={getMessage('licenses_search_placeholder')}
            spellCheck='false'
            autoComplete='off'
          />
          <p className={S.licensesCount} aria-live='polite'>
            {getMessage('licenses_showing').replace('COUNT', String(filtered.length)).replace('TOTAL', String(summary.total))}
          </p>
          {hasFilters && (
            <button type='button' className={S.licensesClear} onClick={handleClearFilters}>{getMessage('licenses_clear_filters')}</button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className={S.licensesEmpty}>{getMessage('licenses_no_results')}</p>
        ) : (
          <ul className={S.licensesList}>
            {filtered.map(entry => (
              <LicenseItem key={`${entry.name}@${entry.installedVersion}`} entry={entry} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default Licenses;
