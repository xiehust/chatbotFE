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
      { id: 'id', label: i18n.t('model_id') },
      { id: 'model_name', label: i18n.t('model_name') },
      { id: 'model_size', label: i18n.t('model_size') },
      { id: 'model_type', label:  i18n.t('model_type'), },
      { id: 'description', label: i18n.t('description')},
      { id: 'code_repo', label: i18n.t('code_repo')},
      { id: 'mini_hardware', label: i18n.t('mini_hardware')},
      { id: 'model_published_date', label: i18n.t('model_published_date')},
      { id: 'model_tags', label: i18n.t('model_tags')},
      { id: 'email', label:  i18n.t('created_by'), },
      { id: 'createtime', label:  i18n.t('createtime'), },
      { id: 'geo', label:  i18n.t('geo'), },
    ],
  },
];



export const MODEL_TYPE_LIST = [
  { label: "LLM", value: "LLM" },
  { label: "Mutil-Modal", value: "Mutil-Modal" },
  { label: "Eembedding", value: "Eembedding" },
  { label: "Rerank", value: "Rerank" },
  { label: "Diffusion", value: "Diffusion" },
  { label: "Others", value: "Others" },
]

export const MODEL_SIZE_LIST = [
  { label: "<6B", value: "<6B" },
  { label: "6~7B", value: "6~7B" },
  { label: "13-14B", value: "13-14B" },
  { label: "34B", value: "34B" },
  { label: "70B", value: "70B" },
  { label: ">70B", value: ">70B" },
  { label: "Others", value: "Others" },
]

export const MODEL_TAG_LIST = [
  { label: "Rolling Batch Support", value: "rolling_batch_support" },
  { label: "Batch Support", value: "batch_support" },
  { label: "VLLM support", value: "vllm_support" },

]

export const HW_LIST = [
  { label: "G4dn.xlarge", value: "G4dn.xlarge" },
  { label: "G4dn.2xlarge", value: "G4dn.2xlarge" },
  { label: "G4dn.12xlarge", value: "G4dn.12xlarge" },
  { label: "G5.2xlarge", value: "G5.2xlarge" },
  { label: "G5.12xlarge", value: "G5.12xlarge" },
  { label: "P3.2xlarge", value: "P3.2xlarge" },
  { label: "P3.12xlarge", value: "P3.12xlarge" },
  { label: "P4d.24xlarge", value: "P4d.24xlarge" },
  { label: "P4de.24xlarge", value: "P4de.24xlarge" },
  { label: "CPU instance", value: "CPU instance" },
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
  visibleContent: ['id','model_name','model_published_date','geo','model_type','model_size','email','createtime',],
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
    header: i18n.t('model_id'),
    cell: item => <Link href={`/model_hub/${item?.id}`}>{item?.id}</Link>,
    sortingField: "id",
  },
  {
    id: 'model_name',
    header: i18n.t('model_name'),
    cell: item => <Link href={`/model_hub/${item?.id}`}>{item?.model_name}</Link>,
    sortingField: "model_name",
  },
  {
    id: 'model_type',
    cell: item =>item.model_type?.label||'-',
    header: i18n.t('model_type'),
    sortingField: "model_type",
  },
  {
    id: 'model_published_date',
    cell: item =>item.model_published_date||'-',
    header: i18n.t('model_published_date'),
    sortingField: "model_published_date",
  },
  {
    id: 'code_repo',
    cell: item =>item.code_repo||'-',
    header: i18n.t('code_repo'),
    sortingField: "code_repo",
  },
  {
    id: 'mini_hardware',
    cell: item =>item.mini_hardware||'-',
    header: i18n.t('mini_hardware'),
    sortingField: "mini_hardware",
  },
  {
    id: 'description',
    cell: item =>item.description||'-',
    header: i18n.t('description'),
    sortingField: "description",
  },
  {
    id: 'model_tags',
    cell: item =>item.model_tags||'-',
    header: i18n.t('model_tags'),
    sortingField: "model_tags",
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

