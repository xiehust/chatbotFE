// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  RadioGroup,
  ColumnLayout,
  ContentLayout,
  Spinner,
  StatusIndicator,
  Link,
  Textarea,
  TextContent,
} from "@cloudscape-design/components";
import { BreadcrumbsDynmic } from "./common-components";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import {getTemplate} from '../commons/api-gateway';
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';
import { useTranslation } from "react-i18next";


function ContentPanel({ id,item }) {
  const {t} = useTranslation();
  // const payload = JSON.parse(item.payload.S);
  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          >
          {`${id}`}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Container>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('template_name')}</Box>
              <div>{item.template_name.S||'-'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('created_by')}</Box>
              <div>{item.username.S||'-'}</div>
            </div>
          </ColumnLayout>
        </Container>
        <Container>
          <ColumnLayout columns={1} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">{t('template')}</Box>
              <div>{item.template.S||'-'}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">{t('comment')}</Box>
              <div>{item.comment.S||'-'}</div>
            </div>
          </ColumnLayout>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}


export default function TemplateDetail() {
  const { templateId } = useParams();
  const [details, setDetail] = useState(null);
  const headers = useAuthorizedHeader();
  const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  const userInfo = useAuthUserInfo();
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;

  useEffect(() => {
    getTemplate(headers,{
      id:templateId,
      main_fun_arn:main_fun_arn,
      apigateway_endpoint:apigateway_endpoint,
    })
    .then(data =>{
      setDetail(data.body);
        console.log(data);
    })
    .catch(err =>{
      setDetail({});
        console.log(JSON.stringify(err))
    }
    )
    return () => {
      };
  }, []);

  return (
    <CustomAppLayout
      ref={appLayout}
      navigation={<Navigation activeHref="/template" />}
      breadcrumbs={<BreadcrumbsDynmic id={templateId} />}
      content={
        details ? (
          <ContentPanel id={templateId} item={details} />
        ) : (
          <Spinner size="large"/>
        )
      }
      contentType="table"
      stickyNotifications
      // toolsOpen={toolsOpen}
      onToolsChange={({ detail }) => setToolsOpen(detail.open)}
    />
  );
}