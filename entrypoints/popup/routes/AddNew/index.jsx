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
import { Login, SecureNote, PaymentCard } from '@/models/itemModels';

// Model Views
import LoginView from './modelsViews/LoginAddNewView';
import SecureNoteView from './modelsViews/SecureNoteAddNewView';
import PaymentCardAddNewView from './modelsViews/PaymentCardAddNewView';

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
    switch (params.model.toLowerCase()) {
      case Login.contentType.toLowerCase():
        return <LoginView />;
      case SecureNote.contentType.toLowerCase():
        return <SecureNoteView />;
      case PaymentCard.contentType.toLowerCase():
        return <PaymentCardAddNewView />;
      default:
        return null;
    }
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