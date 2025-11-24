// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import { useState, useRef, lazy } from 'react';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';
import ChevronIcon from '@/assets/popup-window/chevron.svg?react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import { components } from 'react-select';
import { getSupportedFeatures } from '@/partials/functions';
import generateItemModelsOptions from './functions/generateItemModelsOptions';
import { supportedFeatures } from '@/constants';

const AllIcon = lazy(() => import('@/assets/popup-window/items/all.svg?react'));

const ModalFilterCustomOption = option => {
  return (
    <components.Option
      {...option}
      className={`react-select-model-filter__option ${option.isSelected || (!option?.itemModelFilter && option.data.value === null) ? 'react-select-model-filter__option--is-selected' : ''}`}
      title={option.data.label}
      onClick={() => {}}
    >
      <span className={`react-select-model-filter__option-icon ${option.data.className}`}>{option.data.icon}</span>
      <span className='react-select-model-filter__option-label'>{option.data.label}</span>
    </components.Option>
  );
};

/** 
* Function to render the ModelFilter component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ModelFilter = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [itemModelsOptions, setItemModelsOptions] = useState([]);
  const [deviceSupportedFeatures, setDeviceSupportedFeatures] = useState([]);

  const buttonRef = useRef(null);

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const generateModelIcon = () => {
    const selectedModel = itemModelsOptions.find(option => option.value === data.itemModelFilter);

    return (
      <span className={`${S.thisTabAllLoginsHeaderModelFilterIcon} ${selectedModel?.className || ''}`}>
        {selectedModel?.icon || <AllIcon />}
      </span>
    );
  };

  const handleModelChange = selectedOption => {
    const newValue = selectedOption ? selectedOption.value : null;
    setData('itemModelFilter', newValue);
  };

  const handleModelBtnClick = () => {
    if (deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote)) {
      setIsMenuOpen(prevState => !prevState);
    }
  };

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
    <>
      <button
        ref={buttonRef}
        className={`${S.thisTabAllLoginsHeaderModelFilter} ${deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote) ? '' : S.disabled}`}
        onClick={handleModelBtnClick}
      > 
        {
          deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote) ? (
            <>
              {generateModelIcon()}
              <span className={S.thisTabAllLoginsHeaderModelFilterText}>{itemModelsOptions.find(option => option.value === data.itemModelFilter)?.label || browser.i18n.getMessage('this_tab_all_logins_header')}</span>
              <ChevronIcon className={`${S.thisTabAllLoginsHeaderModelFilterChevron} ${isMenuOpen ? S.open : ''}`} />
            </>
          ) : (
            <span className={S.thisTabAllLoginsHeaderModelFilterText}>{browser.i18n.getMessage('this_tab_all_logins_header')}</span>
          )
        }
      </button>
      <AdvancedSelect
        options={itemModelsOptions}
        value={itemModelsOptions.find(option => option.value === data.itemModelFilter)}
        menuIsOpen={isMenuOpen}
        onMenuClose={() => setIsMenuOpen(false)}
        onMenuOpen={() => setIsMenuOpen(true)}
        onChange={selectedOption => handleModelChange(selectedOption)}
        className='react-select-pass-dropdown'
        classNamePrefix='react-select-model-filter'
        isClearable={false}
        isSearchable={false}
        noOptionsMessage={() => null}
        triggerRef={buttonRef}
        components={{
          Option: props => <ModalFilterCustomOption {...props} itemModelFilter={data.itemModelFilter} />
        }}
      />
    </>
  );
};

export default ModelFilter;
