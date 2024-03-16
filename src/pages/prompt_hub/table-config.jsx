// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React from 'react';
import { CollectionPreferences,Badge,Box,Button, Link ,StatusIndicator} from '@cloudscape-design/components';
import { addColumnSortLabels } from '../../common/labels';
import i18n from '../../common/i18n';


const VISIBLE_CONTENT_OPTIONS = [
  {
    label: i18n.t('info_field'),
    options: [
      { id: 'id', label: i18n.t('template_id') },
      { id: 'template_name', label: i18n.t('template_name') },
      { id: 'description', label: i18n.t('description'),},
      { id: 'email', label:  i18n.t('created_by'), },
      { id: 'createtime', label:  i18n.t('createtime'), },
      { id: 'prompt_category', label:  i18n.t('prompt_category'), },
      { id: 'geo', label:  i18n.t('geo'), },
    ],
  },
];

export const COMPAT_MODELS = [
  { label: "Claude 2", value: "Claude_2" },
  { label: "Claude 3", value: "Claude_3" },
  { label: "GPT", value: "GPT" },
  { label: "Llama2", value: "Llama2" },
  { label: "Baichuan", value: "Baichuan" },
  { label: "Qwen", value: "Qwen" },
  { label: "ChatGLM", value: "ChatGLM" },
  { label: "Titan", value: "Titan" },
  { label: "Others", value: "Others" },
]


export const PROMPT_CATS = [
  { label: "Translation", value: "translation" },
  { label: "Rewrite/Write", value: "Rewrite/Write" },
  { label: "Summary", value: "Summary" },
  { label: "Vision", value: "Vision" },
  { label: "RAG", value: "rag" },
  { label: "Roleplay", value: "roleplay" },
  { label: "Function Call", value: "function call" },
  { label: "Code Generation", value: "Code Generation"},
  { label: "Anthropic Official", value: "anthropic" },
  { label: "other", value: "other" },
  
]

export const GEO_CATS = [
  { label: "GCR", value: "GCR" },
  { label: "APJ", value: "APJ" },
  { label: "AMER", value: "AMER" },
  { label: "EMER Call", value: "EMER" },
  { label: "Global", value: "Global" },
]


export const DEFAULT_PREFERENCES = {
  pageSize: 30,
  visibleContent: ['id','template_name','geo','description','email','createtime','prompt_category',],
  wrapLines: false,
};

export const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
];

export const COLUMN_DEFINITIONS = addColumnSortLabels([
  {
    id: 'id',
    header: i18n.t('template_id'),
    cell: item => <Link href={`/prompt_hub/${item?.id}`}>{item?.id}</Link>,
    sortingField: "id",
  },
  {
    id: 'template_name',
    header: i18n.t('template_name'),
    cell: item => <Link href={`/prompt_hub/${item?.id}`}>{item?.template_name}</Link>,
    sortingField: "template_name",
  },
  {
    id: 'description',
    cell: item =>item.description||'-',
    header: i18n.t('description'),
    sortingField: "description",
  },
  {
    id: 'email',
    cell: item =>item.email||'-',
    header: i18n.t('created_by'),
    sortingField: "email",
  },
  {
    id: 'geo',
    cell: item =>item.geo||'-',
    header: i18n.t('geo'),
    sortingField: "geo",
  },
  {
    id: 'prompt_category',
    cell: item =>item.prompt_category?.label||'-',
    header: i18n.t('prompt_category'),
    sortingField: "prompt_category",
  },
  {
    id: 'createtime',
    cell: item =>item.createtime||'-',
    header: i18n.t('createtime'),
    sortingField: "createtime",
  }
]);




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

