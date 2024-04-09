import React from 'react';
import { Link, CollectionPreferences, Badge, Button ,Box, SpaceBetween} from '@cloudscape-design/components';
import i18n from '../../common/i18n';


export const CARD_DEFINITIONS = {
  header: item => (
    <div>
      <Link fontSize="heading-m"  href={`/prompt_hub/${item?.id}`}>
      {item?.template_name}
      </Link>
    </div>
  ),
  sections: [
    {
      id: 'prompt_category',
      header: i18n.t('prompt_category'),
      content: item => item.prompt_category?.label||'-',
    },
    {
      id: 'industry',
      header: i18n.t('select_industry'),
      content: item => item.industry?.map(it => it.label).join(" | ") || '-',
    },
    {
      id: 'description',
      header: i18n.t('description'),
      content: item => item.description||"-",
    },
    {
      id: 'is_recommended',
      // header: i18n.t('recommend'),
      content: item =>(<SpaceBetween direction="horizontal" size='m'>
            {item.is_recommended&&<Badge color="green">{i18n.t('is_recommended')}</Badge>}
            {item.is_external&&<Badge color="blue">{i18n.t('is_external')}</Badge>}
      </SpaceBetween>),
    },
    // {
    //   id: 'is_external',
    //   // header: i18n.t('recommend'),
    //   content: item =>(item.is_external&&<Badge color="blue">{i18n.t('is_external')}</Badge>),
    // },
    {
      id: 'createtime',
      header: i18n.t('createtime'),
      content: item => item.createtime||"-",
    },
    {
      id: 'buttonurl',
      content: item => (
        <Box float="right">{item.is_external ?<Button iconAlign="right" iconName="external" target="_blank" href={item.link}>{i18n.t('start_chat')}</Button> : 
        <Button href={`/prompt_playground/${item.id}`}>{i18n.t('start_chat')}</Button>}
        
        </Box>
      ),
    },
  ],
};

export const VISIBLE_CONTENT_OPTIONS = [
    {
      label: 'Main properties',
      options: [
        { id: 'template_name', label: 'template_name' },
        { id: 'createtime', label: i18n.t('createtime') },
        { id: 'description', label: i18n.t('description') },
        { id: 'buttonurl', label: 'Button' },
        { id: 'prompt_category', label: i18n.t('prompt_category')},
      ],
    },
  ];
  
  export const CARD_CONFIG = [
      {cards: 4}
  ];
  
  export const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 Distributions' },
    { value: 30, label: '30 Distributions' },
    { value: 50, label: '50 Distributions' },
  ];
  
  export const DEFAULT_PREFERENCES = {
    pageSize: 30,
    visibleContent: ['template_name', 'createtime', 'description','prompt_category', 'buttonurl'],
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