// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './AddNew.module.scss';
import { useRef, useMemo } from 'react';
import { useParams } from 'react-router';
import useScrollPosition from '../../hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import { getModelClass, Login, SecureNote, PaymentCard, Wifi } from '@/models/itemModels';

const MODEL_BY_PARAM = {
  [Login.contentType.toLowerCase()]: Login.contentType,
  [SecureNote.contentType.toLowerCase()]: SecureNote.contentType,
  [PaymentCard.contentType.toLowerCase()]: PaymentCard.contentType,
  [Wifi.contentType.toLowerCase()]: Wifi.contentType
};

/**
* AddNew component for creating a new item entry.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered component.
*/
function AddNew(props) {
  const params = useParams();
  const scrollableRef = useRef(null);

  useScrollPosition(scrollableRef, true);

  const modelComponent = useMemo(() => {
    const contentType = MODEL_BY_PARAM[params.model?.toLowerCase()];
    const AddNewView = getModelClass(contentType)?.AddNewComponent;

    if (!AddNewView) {
      return null;
    }

    return <AddNewView />;
  }, [params.model]);

  if (!modelComponent) {
    return null;
  }

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.addNew}>
          <div className={S.addNewContainer}>
            <NavigationButton type='cancel' />
            {modelComponent}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AddNew;