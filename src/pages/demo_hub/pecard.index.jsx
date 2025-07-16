// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from 'react';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { DEFAULT_PREFERENCES, Preferences, CARD_CONFIG, CARD_DEFINITIONS ,SEARCHABLE_COLUMNS} from './cards-config';
import {
  Flashbar,
  Pagination,
  Cards,
  TextFilter,
  Select,
  Input,
} from '@cloudscape-design/components';
import { CardPageHeader } from './common-components';
import {
  CustomAppLayout,
  Navigation,
  TableNoMatchState,
  TableEmptyState,
} from '../commons/common-components';
import { paginationLabels, distributionSelectionLabels } from '../../common/labels';
import { getFilterCounterText } from '../../common/tableCounterStrings';
import { useLocalStorage } from '../../common/localStorage';
import { useSimpleNotifications } from '../commons/use-notifications';
import { useAuthUserInfo, useAuthorizedHeader } from "../commons/use-auth";
import { getPrompts } from '../commons/api-gateway';
import { useTranslation } from 'react-i18next';
import { params_local_storage_key, Breadcrumbs } from "./common-components";
// import ModelSettings from "../commons/chat-settings";
import {
  DEMO_TYPE_CATS,
  DEMO_CATS,
  INSTRUSTRY_LIST
} from './table-config';

import '../../styles/table-select.scss';
const defaultCategory = { value: '0', label: 'Any Category' };
const defaultDemoType= { value: '0', label: 'Any Type' };
const defaultIndustry= { value: '0', label: 'Any Industry' };

const selectCategoryOptions = [...DEMO_CATS, defaultCategory];
const selectDemoTypeOptions = [...DEMO_TYPE_CATS, defaultDemoType];

const selectIndustryOptions = [...INSTRUSTRY_LIST, defaultIndustry];


const Filters = ({ filterProps, actions, filteredItemsCount, cat, setCat, demoType, setDemoType, industry, setIndustry }) => {
  const { t } = useTranslation();


  return (
    <div className="input-container">
      <div className="input-filter">
        <Input
          data-testid="input-filter"
          type="search"
          value={filterProps.filteringText}
          onChange={event => {
            actions.setFiltering(event.detail.value);
          }}
          ariaLabel="Find"
          placeholder="Find"
          clearAriaLabel="clear"
          ariaDescribedby={null}
        />
      </div>
      <div className="select-filter">
        <Select
          data-testid="engine-filter"
          options={selectCategoryOptions}
          selectedAriaLabel="Selected"
          selectedOption={cat}
          onChange={event => {
            setCat(event.detail.selectedOption);
          }}
          ariaDescribedby={null}
          expandToViewport={true}
        />
      </div>
      <div className="select-filter">
        <Select
          data-testid="class-filter"
          options={selectIndustryOptions}
          selectedAriaLabel="Selected"
          selectedOption={industry}
          onChange={event => {
            setIndustry(event.detail.selectedOption);
          }}
          ariaDescribedby={null}
          expandToViewport={true}
        />

      </div>
      <div className="select-filter">
        <Select
          data-testid="class-filter"
          options={selectDemoTypeOptions}
          selectedAriaLabel="Selected"
          selectedOption={demoType}
          onChange={event => {
            setDemoType(event.detail.selectedOption);
          }}
          ariaDescribedby={null}
          expandToViewport={true}
        />

      </div>
      <div aria-live="polite">
        {(filterProps.filteringText || cat !== defaultCategory || industry !== defaultIndustry || demoType !== defaultDemoType) && (
          <span className="filtering-results">{getFilterCounterText(filteredItemsCount)}</span>
        )}
      </div>
    </div>
  )
}


function matchesCategory(item, selectedCategory) {
  return selectedCategory === defaultCategory || item.category === selectedCategory.value;
}

function matchesIndustry(item, selectedIndustry) {
  const industries = item.industry?.map(it => it).join('|') || '';
  return selectedIndustry === defaultIndustry || industries.includes(selectedIndustry.value);
}

function matchesDemoType(item, selectedDemoType) {
  return selectedDemoType === defaultDemoType || item.demo_type === selectedDemoType.value;
}


function CardsContent({
  resourceName,
  distributions,
  loadingState,
  refreshAction,
  buttonName,
  buttonHref,
}) {
  const [preferences, setPreferences] = useLocalStorage('PE-Hub-Table-Preferences', DEFAULT_PREFERENCES);
  // const [columnDefinitions, saveWidths] = useColumnWidths('PE-Hub-Table-Widths', COLUMN_DEFINITIONS);
  const { t } = useTranslation();

  const [cat,setCat] = useState(defaultCategory);
  const [demoType,setDemoType] = useState(defaultDemoType);
  const [industry,setIndustry] = useState(defaultIndustry);

  const { items, actions, filteredItemsCount, collectionProps, filterProps, paginationProps } = useCollection(
    distributions,
    {
      filtering: {
        empty: <TableEmptyState resourceName={resourceName} />,
        noMatch: <TableNoMatchState onClearFilter={clearFilter} />,
        filteringFunction: (item, filteringText) => {
          if (!matchesCategory(item, cat)) {
            return false;
          }
          if (!matchesIndustry(item, industry)) {
            return false;
          }
          if (!matchesDemoType(item, demoType)) {
            return false;
          }
          const filteringTextLowerCase = filteringText.toLowerCase();
  
          return SEARCHABLE_COLUMNS.map(key => item[key]).some(
            value => typeof value === 'string' && value.toLowerCase().indexOf(filteringTextLowerCase) > -1
          );
        }
      },
      pagination: { pageSize: preferences.pageSize },
      // sorting: {defaultState: {sortingDescending:true, sortingColumn: columnDefinitions[5], isDescending:true }},
      selection: {},
    }
  );

  function clearFilter() {
    actions.setFiltering('');
    setCat(defaultCategory);
    setIndustry(defaultIndustry);
    setDemoType(defaultDemoType);
  }

  return (
    <div>
      <Cards
        {...collectionProps}
        cardDefinition={CARD_DEFINITIONS}
        visibleColumns={preferences.visibleContent}
        cardsPerRow={CARD_CONFIG}
        entireCardClickable
        items={items}
        selectionType="single"
        loading={loadingState}
        loadingText={t("loading")}
        ariaLabels={distributionSelectionLabels}
        variant="full-page"
        // onColumnWidthsChange={saveWidths}
        wrapLines={preferences.wrapLines}
        filter = {
          <Filters filterProps={filterProps} 
              actions={actions} 
              filteredItemsCount = {filteredItemsCount}
              cat={cat} 
              setCat={setCat}
              industry = {industry} 
              setIndustry={setIndustry}
              demoType={demoType}
              setDemoType={setDemoType}
              />
        }
        header={
          <CardPageHeader
            selectedItems={collectionProps.selectedItems}
            totalItems={distributions}
            resourceName={resourceName}
            refreshAction={refreshAction}
            // handleAddClick={handleAddClick}
            href={buttonHref}
          />
        }
        pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
        preferences={<Preferences preferences={preferences} setPreferences={setPreferences} />}
      />
    </div>
  );
}

function sortItemsByCreateTimeDesc(items) {
  return items.sort((a, b) => {
    // Convert date strings to Date objects for comparison
    const dateA = new Date(a.createtime);
    const dateB = new Date(b.createtime);
    
    // Sort in descending order (newest first)
    return dateB - dateA;
  });
}

export default function PEPlayCard() {
  const appLayout = useRef();
  const { notificationitems } = useSimpleNotifications();
  const [toolsOpen, setToolsOpen] = useState(false);
  const { t } = useTranslation();
  const headers = useAuthorizedHeader();
  const [loadingState, setLoadingState] = useState(true);
  const [docitems, setDocsItems] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const refreshAction = () => {
    setRefresh(v => !v);
  };
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const company = userinfo?.company || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;
  const queryParams = {
    main_fun_arn: main_fun_arn,
    apigateway_endpoint: apigateway_endpoint,
    company: company,
    demo_version: '2025v1'
  }
  useEffect(() => {
    setLoadingState(true);
    getPrompts(headers, queryParams)
      .then(data => {
        const items = sortItemsByCreateTimeDesc(data);

        // const items = data.map(it => (it))
        // console.log(items);

        setDocsItems(items);
        setLoadingState(false);
      })
      .catch(err => {
        setDocsItems([]);
        setLoadingState(false);
        console.log(JSON.stringify(err))
      }
      )
  }, [refresh]);

  return (

    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref={'/prompt_playground'} />}
      notifications={<Flashbar items={notificationitems} stackItems />}
      breadcrumbs={<Breadcrumbs />}
      content={<CardsContent
        resourceName={t('demo_hub')}
        distributions={docitems}
        loadingState={loadingState}
        refreshAction={refreshAction}
      />}
      contentType="table"
      stickyNotifications
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
    />

  );
}
