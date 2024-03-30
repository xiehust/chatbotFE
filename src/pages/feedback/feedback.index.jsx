// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import {  COLUMN_DEFINITIONS, DEFAULT_PREFERENCES, Preferences } from './table-config';
import { Flashbar, Pagination, Table, TextFilter,PropertyFilter ,SpaceBetween} from '@cloudscape-design/components';
import { FullPageHeader ,Breadcrumbs,ToolsContent} from './common-components';
import {
  CustomAppLayout,
  Navigation,
  TableNoMatchState,
  TableEmptyState
} from '../commons/common-components';
import { paginationLabels,distributionSelectionLabels  } from '../../common/labels';
import { getFilterCounterText } from '../../common/tableCounterStrings';
import { useColumnWidths } from '../commons/use-column-widths';
import { useLocalStorage } from '../../common/localStorage';
import {useSimpleNotifications} from '../commons/use-notifications';
import {useAuthorizedHeader,useAuthUserInfo} from "../commons/use-auth";
import { useCollection } from '@cloudscape-design/collection-hooks';
import intersection from 'lodash/intersection';
import { FILTERING_PROPERTIES,} from './table-config';
import { useTranslation } from 'react-i18next';
import CreateQAModal from './addfeedback';
import {PROPERTY_FILTERING_I18N_CONSTANTS} from '../../common/i18nStrings';
import ModelSettings from "../commons/chat-settings";
import {listFeedback} from '../commons/api-gateway';



const DEFAULT_FILTERING_QUERY = { tokens: [], operation: 'and' };

export function TableContent({ 
  resourceName,
  buttonName,
  distributions,
  loadingState,
  buttonHref,
  refreshAction,
 }) {
  const [preferences, setPreferences] = useLocalStorage('Chatbot-Feedback-Table-Preferences', DEFAULT_PREFERENCES);
//   const headers = useAuthorizedHeader();
  const {t} = useTranslation();
  const [columnDefinitions, saveWidths] = useColumnWidths('Chatbot-React-Table-Widths', COLUMN_DEFINITIONS);
  const [qAModalVisible,setQAModalVisible] = useState(false);
  

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


  function handleAddClick(event){
    event.preventDefault();
    setQAModalVisible(true);
  }
  return (
    <SpaceBetween size="l">
    <ModelSettings href={'/feedback'}/>
    <CreateQAModal visible={qAModalVisible} setVisible={setQAModalVisible} />
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
          handleAddClick={handleAddClick}
          href={buttonHref}
        />
      }
      pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
    </SpaceBetween>
  );
}

export default function FeedbackTable () {
  const {t} = useTranslation();

  const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  const [docitems,setDocsItems] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const {notificationitems} = useSimpleNotifications();
  const [refresh, setRefresh] = useState(false);
  const userinfo = useAuthUserInfo();
  const headers = useAuthorizedHeader();
  const username = userinfo?.username || 'default';
  const company = userinfo?.company || 'default';

  const refreshAction =()=>{
    setLoadingState(true);
    setRefresh(v => !v);
  };

  const queryParams = {
    company:company
  }
  useEffect(()=>{
    const controller = new AbortController();
    listFeedback(headers,queryParams)
    .then(data =>{
        
      const items = data.map( it =>(
        {
        msgid:it.id,
        title:it.title,
        description:it.description,
        createtime:it.createtime,
        status:it.status,
        username:it.username
        }
      ))
      setDocsItems(items);
        setLoadingState(false);
    })
    .catch(err =>{
      setDocsItems([]);
        setLoadingState(false);
        console.log(JSON.stringify(err))
    }
    )
    return () => {
        controller.abort();
      };
},[refresh]);


  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={'/feedback_us'} />}
      notifications={<Flashbar items={notificationitems} stackItems/>}
      breadcrumbs={<Breadcrumbs />}
      content={<TableContent 
                resourceName={t('feedback_us')}
                buttonName = "Add"
                distributions = {docitems}
                loadingState={loadingState}
                refreshAction={refreshAction}

            />}
      contentType="table"
      toolsOpen={toolsOpen}
      tools={<ToolsContent />}
      stickyNotifications
    />
  );
}
