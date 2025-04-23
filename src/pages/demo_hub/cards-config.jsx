import React from 'react';
import { Link, CollectionPreferences, Badge,HelpPanel, Button ,Box,Grid, SpaceBetween} from '@cloudscape-design/components';
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";

import i18n from '../../common/i18n';


export const CARD_DEFINITIONS = {
  header: item => (
    <div>
      <Link fontSize="heading-m" href={`/asset_hub/${item.id}`}>
      {item?.demo_name}
      </Link>
    </div>
  ),
  sections: [
    // {
    //   id: 'title',
    //   header: i18n.t('title'),
    //   content: item => item.demo_name||"-",
    // },
    {
      id: 'description',
      header: i18n.t('description'),
      content: item => item.description||"-",
    },
    {
      id: 'category',
      content: item => (
        <KeyValuePairs
        columns={2}
        items={[
          {
            label: i18n.t('category'),
            value: item.category||'-',
          },
          {
            label: i18n.t('industry'),
            value: item.industry?.map(it => it).join(" | ") || '-',
          },
        ]}
        />
      ),
    },
    {
      id: 'detail',
      // header: i18n.t('deck_link'),
      content: item => (
        <KeyValuePairs
        columns={2}
        items={[
          {
            label: i18n.t('demo_type'),
            value: (item.demo_type === 'Simple Demo Asset'? 
                  <Badge color="blue">{item.demo_type}</Badge> :
                  <Badge color="green">{item.demo_type||'-'}</Badge> 
                  ),
          },
          {
              label: i18n.t('china_region_support'),
              value: (item.china_region_support === 'YES' ? <Badge color="green">{"YES"}</Badge>:<Badge color="blue">{"NO"}</Badge>),
          },
          {
            label: i18n.t('createtime'),
            value: (item.createtime||"-"),
          },
          {
            label: i18n.t('deck_link'),
            value: item.deck_link? 
                  (item.deck_link.split(/[,，]/).map((it,k) => <Link key={k+1} external href={it}>{`${i18n.t('link')}${k+1}`}</Link>))
                  :"-",
          },
          {
            label: i18n.t('code_repo_link'),
            value: item.code_repo_link? 
                  (item.code_repo_link.split(/[,，]/).map((it,k) => <Link key={k+1} external href={it}>{`${i18n.t('link')}${k+1}`}</Link>))
                  :"-",
          },
          {
            label: i18n.t('demo_link'),
            value: item.demo_link? 
                  (item.demo_link.split(/[,，]/).map((it,k) => <Link key={k+1} external href={it}>{`${i18n.t('link')}${k+1}`}</Link>))
                  :"-",
          },
          {
            label: i18n.t('contact'),
            value: (`${item.contact||"-"}|${item.team||"-"}`),
          },
          {
            // label: i18n.t('feedback_us'),
            value:(<Link>{i18n.t('feedback_us_notes')}</Link>)
            // info: (<Link>{i18n.t('feedback_us_notes')}</Link>),
          },
        ]}
        />
      ),
    },
  ],
};

export const VISIBLE_CONTENT_OPTIONS = [
    {
      label: 'Main properties',
      options: [
        { id: 'category', label: i18n.t('category') },
        // { id: 'title', label: i18n.t('title') },
        { id: 'description', label: i18n.t('description') },
        { id: 'detail', label: i18n.t('detail')},
        // { id: 'code_repo_link', label: i18n.t('code_repo_link')},
        // { id: 'demo_type', label: i18n.t('demo_type')},

      ],
    },
  ];
  
  export const CARD_CONFIG = [
      {cards: 3}
  ];
  
  export const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 Records' },
    { value: 30, label: '30 Records' },
    { value: 50, label: '50 Records' },
  ];
  
  export const DEFAULT_PREFERENCES = {
    pageSize: 30,
    visibleContent: ['category', 'description','detail'],
  };
  
  export const Preferences = ({
    preferences,
    setPreferences,
    disabled,
    pageSizeOptions = PAGE_SIZE_OPTIONS,
    visibleContentOptions = VISIBLE_CONTENT_OPTIONS,
  }) => (
    <CollectionPreferences
      title={i18n.t('preferences')}
      confirmLabel={i18n.t('confirm')}
      cancelLabel={i18n.t('cancel')}
      disabled={disabled}
      preferences={preferences}
      onConfirm={({ detail }) => setPreferences(detail)}
      pageSizePreference={{
        title: i18n.t('page_size'),
        options: pageSizeOptions,
      }}
      wrapLinesPreference={{
        label: 'Wrap lines',
        description: 'Check to see all the text and wrap the lines',
      }}
      visibleContentPreference={{
        title: i18n.t('select_visible_columns'),
        options: visibleContentOptions,
      }}
    />
  );

  export const SEARCHABLE_COLUMNS = ['demo_name','description','contact'];
