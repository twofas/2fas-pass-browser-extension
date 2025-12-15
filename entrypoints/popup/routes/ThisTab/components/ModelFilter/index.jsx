// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/ModelFilter.module.scss';
import { useState, useRef, lazy, useEffect, useCallback, useMemo } from 'react';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';
import ChevronIcon from '@/assets/popup-window/chevron.svg?react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import { getSupportedFeatures } from '@/partials/functions';
import generateItemModelsOptions from './functions/generateItemModelsOptions';
import { supportedFeatures } from '@/constants';
import ModelFilterCustomOption from './components/ModelFilterCustomOption';

const AllIcon = lazy(() => import('@/assets/popup-window/items/all.svg?react'));

const selectComponents = { Option: ModelFilterCustomOption };
const noOptionsMessage = () => null;

/**
* Renders a filter dropdown for selecting item model types (Login, SecureNote, PaymentCard).
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ModelFilter = props => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [itemModelsOptions, setItemModelsOptions] = useState([]);
  const [deviceSupportedFeatures, setDeviceSupportedFeatures] = useState([]);

  const buttonRef = useRef(null);

  const { data, setData } = usePopupState();

  const hasMultipleItemTypes = useMemo(() => {
    return deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote) ||
      deviceSupportedFeatures.includes(supportedFeatures?.items?.paymentCard);
  }, [deviceSupportedFeatures]);

  const selectedOption = useMemo(() => {
    return itemModelsOptions.find(option => option.value === data.itemModelFilter);
  }, [itemModelsOptions, data.itemModelFilter]);

  const modelIcon = useMemo(() => {
    return (
      <span className={`${S.modelFilterButtonIcon} ${selectedOption?.className || ''}`}>
        {selectedOption?.icon || <AllIcon />}
      </span>
    );
  }, [selectedOption]);

  const buttonClassName = useMemo(() => {
    return `${S.modelFilterButton} ${hasMultipleItemTypes ? '' : S.disabled}`;
  }, [hasMultipleItemTypes]);

  const chevronClassName = useMemo(() => {
    return `${S.modelFilterButtonChevron} ${isMenuOpen ? S.open : ''}`;
  }, [isMenuOpen]);

  const filterLabel = useMemo(() => {
    if (props.loading) {
      return browser.i18n.getMessage('this_tab_all_logins_header');
    }

    return selectedOption?.label || browser.i18n.getMessage('this_tab_all_logins_header');
  }, [selectedOption, props.loading]);

  const handleModelChange = useCallback(selectedOpt => {
    const newValue = selectedOpt ? selectedOpt.value : null;
    setData('itemModelFilter', newValue);
  }, [setData]);

  const handleModelBtnClick = useCallback(() => {
    if (hasMultipleItemTypes) {
      setIsMenuOpen(prevState => !prevState);
    }
  }, [hasMultipleItemTypes]);

  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);
  const handleMenuOpen = useCallback(() => setIsMenuOpen(true), []);

  useEffect(() => {
    getSupportedFeatures()
      .then(features => setDeviceSupportedFeatures(features))
      .catch(() => setDeviceSupportedFeatures([]));
  }, []);

  useEffect(() => {
    if (deviceSupportedFeatures.length > 0) {
      setItemModelsOptions(generateItemModelsOptions(deviceSupportedFeatures));
    }
  }, [deviceSupportedFeatures]);

  return (
    <div className={S.modelFilter}>
      <button
        ref={buttonRef}
        className={buttonClassName}
        onClick={handleModelBtnClick}
      >
        {hasMultipleItemTypes && !props.loading && modelIcon}
        <span className={S.modelFilterButtonText}>{filterLabel}</span>
        {hasMultipleItemTypes && !props.loading && <ChevronIcon className={chevronClassName} />}
      </button>
      <AdvancedSelect
        options={itemModelsOptions}
        value={selectedOption}
        menuIsOpen={isMenuOpen}
        onMenuClose={handleMenuClose}
        onMenuOpen={handleMenuOpen}
        onChange={handleModelChange}
        className='react-select-pass-dropdown'
        classNamePrefix='react-select-model-filter'
        isClearable={false}
        isSearchable={false}
        noOptionsMessage={noOptionsMessage}
        triggerRef={buttonRef}
        itemModelFilter={data.itemModelFilter}
        components={selectComponents}
      />
    </div>
  );
};

export default ModelFilter;
