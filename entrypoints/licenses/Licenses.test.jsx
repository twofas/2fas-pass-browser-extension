// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createElement } from 'react';

const getMessage = key => key;

vi.mock('@/partials/context/I18nContext', () => ({ useI18n: () => ({ getMessage }) }));
vi.mock('@/assets/logo.svg?react', () => ({ default: () => createElement('svg') }));
vi.mock('@/assets/logo-dark.svg?react', () => ({ default: () => createElement('svg') }));

import Licenses from './Licenses.jsx';

const ENTRIES = Object.freeze([
  {
    name: 'react',
    installedVersion: '19.3.1',
    definedVersion: '^19.3.1',
    licenseType: 'MIT',
    dependencyType: 'dependencies',
    repository: 'https://github.com/react/react.git',
    requiredBy: { 'root@1.0.0': '^19.3.1' },
    licenseFiles: { LICENSE: 'MIT License\n\nCopyright (c) [year] Meta' }
  },
  { name: 'eslint', installedVersion: '10.13.0', licenseType: 'MIT', dependencyType: 'devDependencies', licenseFiles: { LICENSE: 'MIT' } },
  { name: 'winreg', installedVersion: '0.0.12', licenseType: 'BSD', dependencyType: 'devDependencies', licenseFiles: {} },
  { name: 'Inter (font)', installedVersion: '4.001', licenseType: 'OFL-1.1', dependencyType: 'font', licenseFiles: { 'OFL-Inter.txt': 'SIL OPEN FONT LICENSE' } }
]);

/**
 * Returns the names of the listed entries.
 * @return {string[]} Entry names.
 */
const listedNames = () => {
  return screen.getAllByRole('button', { expanded: false }).map(button => button.querySelector('span')?.textContent).filter(Boolean);
};

afterEach(() => {
  cleanup();
});

describe('Licenses page', () => {
  it('summarizes the list', () => {
    render(createElement(Licenses, { entries: ENTRIES }));

    const summary = screen.getByRole('region', { name: 'licenses_summary_label' });

    expect(within(summary).getByText('licenses_summary_total').previousSibling.textContent).toBe('4');
    expect(within(summary).getByText('licenses_summary_extension').previousSibling.textContent).toBe('1');
    expect(within(summary).getByText('licenses_summary_development').previousSibling.textContent).toBe('2');
    expect(within(summary).getByText('licenses_summary_fonts').previousSibling.textContent).toBe('1');
    expect(screen.queryByText('licenses_summary_license_types')).toBeNull();
    expect(screen.queryByText('licenses_summary_without_text')).toBeNull();
    expect(screen.queryByRole('region', { name: 'licenses_types_label' })).toBeNull();
    expect(listedNames()).toEqual(['react', 'eslint', 'winreg', 'Inter (font)']);
  });

  it('filters by group and search, and clears the filters', async () => {
    render(createElement(Licenses, { entries: ENTRIES }));

    fireEvent.click(screen.getByText('licenses_summary_development').closest('button'));
    expect(listedNames()).toEqual(['eslint', 'winreg']);

    fireEvent.click(screen.getByText('licenses_clear_filters'));
    expect(listedNames()).toEqual(['react', 'eslint', 'winreg', 'Inter (font)']);

    await act(async () => {
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inter' } });
    });

    expect(listedNames()).toEqual(['Inter (font)']);

    await act(async () => {
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing-matches' } });
    });

    expect(screen.getByText('licenses_no_results')).toBeTruthy();
  });

  it('expands an entry to its details and full license texts', () => {
    render(createElement(Licenses, { entries: ENTRIES }));

    expect(screen.queryByText(/Copyright \(c\) \[year\] Meta/)).toBeNull();

    fireEvent.click(screen.getByTitle('react').closest('button'));

    expect(screen.getByText(/Copyright \(c\) \[year\] Meta/).tagName).toBe('PRE');
    expect(screen.getByText('licenses_field_required_by')).toBeTruthy();
    expect(screen.getByText('root@1.0.0')).toBeTruthy();
    expect(screen.getByText('https://github.com/react/react.git').closest('a').getAttribute('href')).toBe('https://github.com/react/react');
    expect(screen.getByText('licenses_group_extension', { selector: 'dd span' })).toBeTruthy();
  });

  it('tells when an entry has no license text', () => {
    render(createElement(Licenses, { entries: ENTRIES }));

    fireEvent.click(screen.getByTitle('winreg').closest('button'));

    expect(screen.getByText('licenses_no_license_text')).toBeTruthy();
  });
});
