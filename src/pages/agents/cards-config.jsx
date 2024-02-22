import React from 'react';
import { Link, CollectionPreferences, Badge, Button ,Box} from '@cloudscape-design/components';
import i18n from '../../common/i18n';
import toplogo from '../../resources/AWS logo.svg';


export const CARD_DEFINITIONS = {
  header: item => (
    <div>
      <Link fontSize="heading-m"  href={'/agents/'+item.id}>
        {item.agent_name}
      </Link>
    </div>
  ),
  sections: [
    {
      id: 'avatar',
    //   header: 'avatar',
      content: item => (
        <Box>
          <img src={toplogo} alt="avatar" />
        </Box>
      ),
    },
    {
      id: 'description',
      header: i18n.t('description'),
      content: item => item.description||"-",
    },
    {
      id: 'createtime',
      header: i18n.t('createtime'),
      content: item => item.createtime,
    },
    {
      id: 'username',
      header: i18n.t('username'),
      content: item => item.username
      ,
    },
    {
      id: 'buttonurl',
      content: item => (
        <Box float="right"> <Button href={'agentschat/'+item.id}>{i18n.t('start_chat')}</Button></Box>
      ),
    },
  ],
};

export const VISIBLE_CONTENT_OPTIONS = [
    {
      label: 'Main properties',
      options: [
        { id: 'avatar', label: 'Avatar' },
        { id: 'createtime', label: i18n.t('createtime') },
        { id: 'description', label: i18n.t('description') },
        { id: 'buttonurl', label: 'Button' },
        { id: 'username', label: i18n.t('username')},
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
    visibleContent: ['avatar', 'createtime', 'description','username', 'buttonurl'],
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