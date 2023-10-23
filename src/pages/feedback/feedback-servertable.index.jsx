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
} from '../commons/common-components';
import { paginationLabels,  } from '../../common/labels';
import { getServerFilterCounterText } from '../../common/tableCounterStrings';
import { useColumnWidths } from '../commons/use-column-widths';
import { useLocalStorage } from '../../common/localStorage';
import {useSimpleNotifications} from '../commons/use-notifications';
import {useAuthorizedHeader} from "../commons/use-auth";
import {useDistributions} from "./hooks";
import intersection from 'lodash/intersection';
import { FILTERING_PROPERTIES,} from './table-config';
import { useTranslation } from 'react-i18next';
import CreateQAModal from './addfeedback';
import {PROPERTY_FILTERING_I18N_CONSTANTS} from '../../common/i18nStrings';


const DEFAULT_FILTERING_QUERY = { tokens: [], operation: 'and' };

export function TableContent({ 
  resourceName,
  buttonName,
  buttonHref,
 }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [preferences, setPreferences] = useLocalStorage('Chatbot-Feedback-Table-Preferences', DEFAULT_PREFERENCES);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [filteringText, setFilteringText] = useState('');
  const [delayedFilteringText, setDelayedFilteringText] = useState('');
  const [sortingColumn, setSortingColumn] = useState(COLUMN_DEFINITIONS);
  const [descendingSorting, setDescendingSorting] = useState(false);
  const [filteringQuery, setFilteringQuery] = useState(DEFAULT_FILTERING_QUERY);
  const headers = useAuthorizedHeader();
  const [columnDefinitions, saveWidths] = useColumnWidths('Chatbot-React-Table-Widths', COLUMN_DEFINITIONS);
  const pageSize = preferences.pageSize;
  const [qAModalVisible,setQAModalVisible] = useState(false);
  const onClearFilter = () => {
    setFilteringText('');
    setDelayedFilteringText('');
    setFilteringQuery(DEFAULT_FILTERING_QUERY);
  };
  const onSortingChange = event => {
    setDescendingSorting(event.detail.isDescending);
    setSortingColumn(event.detail.sortingColumn);
  };

  const params = {
    pagination: {
      currentPageIndex,
      pageSize,
    },
    sorting: {
      sortingColumn,
      sortingDescending: descendingSorting,
    },
    header:headers,
    filtering: {
      filteringText: delayedFilteringText,
      filteringTokens: filteringQuery.tokens,
      filteringOperation: filteringQuery.operation,
    },
  };
  const { items, loading, totalCount, pagesCount, currentPageIndex: serverPageIndex,refreshAction } = useDistributions(params);
  useEffect(() => {
    setSelectedItems(oldSelected => intersection(items, oldSelected));
  }, [items]);

  const handlePropertyFilteringChange = ({ detail }) => { setFilteringQuery(detail)};

  function handleAddClick(event){
    event.preventDefault();
    console.log('handleAddClick')
    setQAModalVisible(true);
  }
  return (
    <SpaceBetween size="l">
    <CreateQAModal visible={qAModalVisible} setVisible={setQAModalVisible} />
    <Table
      onSelectionChange={({ detail }) =>
        setSelectedItems(detail.selectedItems)
      }
      onSortingChange={onSortingChange}
      sortingColumn={sortingColumn}
      sortingDescending={descendingSorting}
      
      selectedItems={selectedItems}
      ariaLabels={{
        selectionGroupLabel: "Items selection",
        allItemsSelectionLabel: ({ selectedItems }) =>
          `${selectedItems.length} ${
            selectedItems.length === 1 ? "item" : "items"
          } selected`,
        itemSelectionLabel: ({ selectedItems }, item) => {
          const isItemSelected = selectedItems.filter(
            i => i.name === item.name
          ).length;
          return `${item.name} is ${
            isItemSelected ? "" : "not"
          } selected`;
        }
      }}
      columnDefinitions={columnDefinitions}
      visibleColumns={preferences.visibleContent}
      items={items}
      selectionType="single"
      loading = {loading}
      loadingText = {"Loading"}
      empty={<TableNoMatchState onClearFilter={onClearFilter} />}
      filter={
        <PropertyFilter
          i18nStrings={PROPERTY_FILTERING_I18N_CONSTANTS}
          filteringProperties={FILTERING_PROPERTIES}
          query={filteringQuery}
          onChange={handlePropertyFilteringChange}
          countText={`${getServerFilterCounterText(items, pagesCount, pageSize)}`}
          expandToViewport={true}
        />
      }
      variant="full-page"
      stickyHeader={true}
      resizableColumns={true}
      onColumnWidthsChange={saveWidths}
      wrapLines={preferences.wrapLines}
      header={
        <FullPageHeader
          selectedItems={selectedItems}
          totalItems={totalCount}
          serverSide={true}
          resourceName={resourceName}
          createButtonText={buttonName}
          handleAddClick={handleAddClick}
          refreshAction = {refreshAction}
          href={buttonHref}
        />
      }

      
      pagination={<Pagination 
                  currentPageIndex={serverPageIndex}
                  pagesCount={pagesCount} 
                  onChange={({ detail }) =>
                      setCurrentPageIndex(detail.currentPageIndex)
                  }
                  ariaLabels={paginationLabels} />}
      preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
    />
    </SpaceBetween>
  );
}

export default function FeedbackTable () {
  const {t} = useTranslation();

  const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  const {notificationitems} = useSimpleNotifications();
  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={'/feedback'} />}
      notifications={<Flashbar items={notificationitems} />}
      breadcrumbs={<Breadcrumbs />}
      content={<TableContent 
                resourceName={t('feedback_management')}
                buttonName = "Add"
                buttonHref=""
            />}
      contentType="table"
      toolsOpen={toolsOpen}
      tools={<ToolsContent />}
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
      stickyNotifications
    />
  );
}
