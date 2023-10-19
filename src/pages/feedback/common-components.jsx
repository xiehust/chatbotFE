// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState } from 'react';
import { BreadcrumbGroup, HelpPanel, Icon, SpaceBetween, Button } from '@cloudscape-design/components';
import { ExternalLinkItem } from '../commons/common-components';
import {TableHeader } from '../commons/common-components';
import { useTranslation } from "react-i18next";

import {postFeedback} from '../commons/api-gateway';
import {useAuthUserInfo, useAuthorizedHeader} from "../commons/use-auth";
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';
import { useSimpleNotifications } from "../commons/use-notifications";


const breadcrumbsItems = [
  {
    text: 'Harbor',
    href: '/home',
  },
  {
    text: 'Databases',
    href: '/catalog/databases',
  },
];

export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/",
    },
    {
      text: t("feedback_management"),
    },
  ];
  return (
    <BreadcrumbGroup
      items={breadcrumbs}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};

export const BreadcrumbsDynmic = ({id}) => (
  <BreadcrumbGroup items={[...breadcrumbsItems, 
                          {
                            text: id,
                            href: '/catalog/database/'+id,
                          },]
  } expandAriaLabel="Show path" ariaLabel="Breadcrumbs" />
);

export const FullPageHeader = ({
  resourceName ,
  createButtonText ,
  ...props
}) => {
  const { t } = useTranslation();
  const { setNotificationItems } = useSimpleNotifications();
  const isOnlyOneSelected = props.selectedItems.length === 1;
  const sid = isOnlyOneSelected?props.selectedItems[0].sid:null;
  const msgid = isOnlyOneSelected?props.selectedItems[0].msgid:null;
  const [injectLoading, setInjectLoading] = useState(false);
  const userinfo = useAuthUserInfo();
  const headers = useAuthorizedHeader();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );


  const handleInject = async () =>{
    const body = {
      msgid:msgid,
      session_id:msgid,
      username:username,
      s3_bucket:localStoredParams.s3_bucket,
      obj_prefix:localStoredParams.obj_prefix,
      main_fun_arn:localStoredParams.main_fun_arn,
      apigateway_endpoint:localStoredParams.apigateway_endpoint,
      action:'injected',
    }
    try {
      console.log(body);
      setInjectLoading(true);
      const resp = await postFeedback(headers, body);
      setInjectLoading(false);
      setNotificationItems((item) => [
        ...item,
        {
          header: t("inject_new_faq"),
          type: "success",
          content: t("inject_new_faq"),
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () =>
            setNotificationItems((items) =>
              items.filter((item) => item.id !== msgid)
            ),
          id: msgid,
        },
      ]);
    } catch (error) {
      console.log(error);
      setInjectLoading(false);
    }


  }

  return (
    <TableHeader
      variant="awsui-h1-sticky"
      title={resourceName}
      actionButtons={
        <SpaceBetween size="xs" direction="horizontal">
            <Button name="refresh" onClick={props.refreshAction} iconName="refresh"/>
          <Button disabled={username!=='admin' || !isOnlyOneSelected || props.selectedItems[0].action === 'injected'} /*disable the button when status is injected*/
          name="inject"
           loading={injectLoading}
            onClick={handleInject}
          >{t('inject')}</Button>
          <Button disabled={true} name="delete" > {t('delete')}</Button>
          <Button iconName="add-plus" variant="primary" onClick={props.handleAddClick}>{t('create')}</Button>
        </SpaceBetween>
      }
      {...props}
    />
  );
};

const toolsFooter = (
  <>
    <h3>
      Learn more{' '}
      <span role="img" aria-label="Icon external Link">
        <Icon name="external" />
      </span>
    </h3>
    <ul>
      <li>
        <ExternalLinkItem
          href=""
          text=""
        />
      </li>
    </ul>
  </>
);
export const ToolsContent = () => (
  <HelpPanel footer={toolsFooter} header={<h2>GCR Chatbot</h2>}>
    <p>
      Demo for AWS GCR Chatbot
    </p>
  </HelpPanel>
);
