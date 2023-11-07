// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { COLUMN_DEFINITIONS, DEFAULT_PREFERENCES, Preferences,} from './table-config';
import { Flashbar, Pagination, Table, TextFilter } from '@cloudscape-design/components';
import { FullPageHeader ,Breadcrumbs} from './common-components';
import {
  CustomAppLayout,
  Navigation,
  TableNoMatchState,
  TableEmptyState,
  ToolsContent,
} from '../commons/common-components';
import { paginationLabels,distributionSelectionLabels } from '../../common/labels';
import { getFilterCounterText } from '../../common/tableCounterStrings';
import { useColumnWidths } from '../commons/use-column-widths';
import { useLocalStorage } from '../../common/localStorage';
import {useSimpleNotifications} from '../commons/use-notifications';
import {useAuthUserInfo, useAuthorizedHeader} from "../commons/use-auth";
import {listDocIdx} from '../commons/api-gateway';
import { useTranslation } from 'react-i18next';
import {params_local_storage_key} from "../chatbot/common-components";
import ModelSettings from "../commons/chat-settings";

function TableContent({ 
  resourceName,
  distributions,
  loadingState,
  refreshAction,
  buttonName,
  buttonHref,
 }) {
  const [preferences, setPreferences] = useLocalStorage('Chatbot-Docs-Table-Preferences', DEFAULT_PREFERENCES);
  const [columnDefinitions, saveWidths] = useColumnWidths('Chatbot-React-Table-Widths', COLUMN_DEFINITIONS);
  const {t} = useTranslation();

  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={() => actions.setFiltering('')} />,
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: { defaultState: { sortingColumn: columnDefinitions[0] } },
      selection: {},
    }
  );

  return (
    <div>
    <ModelSettings href={'/docs'}/>
    <Table
     {...collectionProps}
      columnDefinitions={columnDefinitions}
      visibleColumns={preferences.visibleContent}
      items={items}
      selectionType="single"
      loading = {loadingState}
      loadingText = {t("loading")}
      ariaLabels={distributionSelectionLabels}
      variant="full-page"
      stickyHeader={true}
      resizableColumns={true}
      onColumnWidthsChange={saveWidths}
      wrapLines={preferences.wrapLines}
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel="Filter "
          filteringPlaceholder="Find "
          countText={getFilterCounterText(filteredItemsCount)}
        />
      }
      header={
        <FullPageHeader
          selectedItems={collectionProps.selectedItems}
          totalItems={distributions}
          resourceName={resourceName}
          createButtonText={buttonName}
          refreshAction={refreshAction}
          href={buttonHref}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
    </div>
  );
}

export default function DocsTable () {
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  const [toolsOpen, setToolsOpen] = useState(false);
  const {t} = useTranslation();
  const headers = useAuthorizedHeader();
  const [loadingState, setLoadingState] = useState(true);
  const [docitems,setDocsItems] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const refreshAction =()=>{
    setLoadingState(true);
    setRefresh(v => !v);
  };
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;
  const queryParams = {
    main_fun_arn:main_fun_arn,
    apigateway_endpoint:apigateway_endpoint
  }
  useEffect(()=>{
    listDocIdx(headers,queryParams)
    .then(data =>{
      // console.log(data);
      //does display examples index
      const doc_items = data.body.filter((it) =>(it.index_name.S !== 'chatbot-example-index'));
      const items = doc_items.map( it =>({embedding_model:it.embedding_model.S,
        filename:it.filename.S,
        index_name:it.index_name.S,
        username:it.username.S,
      }))
      setDocsItems(items);
        setLoadingState(false);
    })
    .catch(err =>{
      setDocsItems([]);
        setLoadingState(false);
        console.log(JSON.stringify(err))
    }
    )
},[refresh]);

  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={'/docs'} />}
      notifications={<Flashbar items={notificationitems} stackItems/>}
      breadcrumbs={<Breadcrumbs />}
      content={<TableContent 
                resourceName={t('docs')}
                distributions = {docitems}
                loadingState={loadingState}
                refreshAction={refreshAction}
            />}
      contentType="table"
      stickyNotifications
      tools={<ToolsContent />}
      toolsOpen={toolsOpen}
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
    />

  );
}
