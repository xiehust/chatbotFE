// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useRef, useState,useEffect } from "react";
import {
    FormField,
    Container,
    Grid,
    Box,
    SpaceBetween,
    Toggle,
    Input,
    Button,
    Modal,
  } from "@cloudscape-design/components";
import { useChatData } from "./common-components";
import { useSettingCtx } from "../commons/common-components";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import {params_local_storage_key} from "./common-components";
import { defaultModelParams } from "./prompt-panel";
import { useAuthUserInfo } from "../commons/use-auth";


const SettingsPanel = ()=>{
    const { t } = useTranslation();
    const userinfo = useAuthUserInfo();
    const username = userinfo?.username || 'default';
    const [localStoredParams, setLocalStoredParams] = useLocalStorage(
      params_local_storage_key+username,
      null
    );
    const {modelParams, setModelParams } = useChatData();
    const [embedding_endpoint, setEmbEndpoint] = useState(
        localStoredParams?.embedding_endpoint || ''
      );
      const [apigateway_endpoint, setApiGwEndpoint] = useState(
        localStoredParams?.apigateway_endpoint || ''
      );
      const [openai_api_key, setOpenAIApiKey] = useState(
        localStoredParams?.OPENAI_API_KEY || ''
      );
      const [ak, setAWSAk] = useState(
        localStoredParams?.ak || ''
      );
      const [sk, setAWSSk] = useState(
        localStoredParams?.sk || ''
      );
      const [s3_region, setS3Region] = useState(
        localStoredParams?.s3_region || ''
      );
      const [s3_bucket, setS3Bucket] = useState(
        localStoredParams?.s3_bucket || ''
      );
      const [obj_prefix, setObjPrefix] = useState(
        localStoredParams?.obj_prefix || defaultModelParams.obj_prefix
      );
      const [main_fun_arn, setMainFunArn] = useState(
        localStoredParams?.main_fun_arn || ''
      );
    useEffect(() => {
        setModelParams( prev => ({ 
          ...prev,
          ...localStoredParams,
          embedding_endpoint:localStoredParams?.embedding_endpoint||'',
          apigateway_endpoint:localStoredParams?.apigateway_endpoint||'',
          OPENAI_API_KEY:localStoredParams?.OPENAI_API_KEY||'',
          s3_region:localStoredParams?.s3_region||'',
          s3_bucket:localStoredParams?.s3_bucket||'',
          ak:localStoredParams?.ak||'',
          sk:localStoredParams?.sk||'',
          obj_prefix:localStoredParams?.obj_prefix||defaultModelParams.obj_prefix,
          main_fun_arn:localStoredParams?.main_fun_arn || '',
          }));
      }, []);

    return (
        <SpaceBetween direction="vertical" size="l">
<FormField label={t("embedding_endpoint")}>
          <Input
            onChange={({ detail }) => {
              setEmbEndpoint(detail.value);
              setModelParams((prev) => ({
                ...prev,
                embedding_endpoint: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                embedding_endpoint: detail.value,
              });
            }}
            value={embedding_endpoint}
          />
        </FormField>
        <FormField label={t("apigateway_endpoint")}>
          <Input
            onChange={({ detail }) => {
              setApiGwEndpoint(detail.value);
              setModelParams((prev) => ({
                ...prev,
                apigateway_endpoint: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                apigateway_endpoint: detail.value,
              });
            }}
            value={apigateway_endpoint}
          />
        </FormField>
        <FormField label={"Main Function ARN"}>
          <Input
            onChange={({ detail }) => {
              setMainFunArn(detail.value);
              setModelParams((prev) => ({
                ...prev,
                main_fun_arn: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                main_fun_arn: detail.value,
              });
            }}
            value={main_fun_arn}
          />
        </FormField>
        <FormField label={t("openai_api_key")}>
          <Input
            onChange={({ detail }) => {
              setOpenAIApiKey(detail.value);
              setModelParams((prev) => ({
                ...prev,
                OPENAI_API_KEY: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                OPENAI_API_KEY: detail.value,
              });
            }}
            value={openai_api_key}
          />
        </FormField>
        <FormField label={"AWS_ACCESS_KEY_ID"}>
          <Input
            onChange={({ detail }) => {
              setAWSAk(detail.value);
              setModelParams((prev) => ({
                ...prev,
                ak: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                ak: detail.value,
              });
            }}
            value={ak}
          />
        </FormField>
        <FormField label={"AWS_SECRET_KEY"}>
          <Input
            onChange={({ detail }) => {
              setAWSSk(detail.value);
              setModelParams((prev) => ({
                ...prev,
                sk: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                sk: detail.value,
              });
            }}
            value={sk}
          />
        </FormField>
        <FormField label={"S3 Region"}>
          <Input
            onChange={({ detail }) => {
              setS3Region(detail.value);
              setModelParams((prev) => ({
                ...prev,
                s3_region: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                s3_region: detail.value,
              });
            }}
            value={s3_region}
          />
        </FormField>
        <FormField label={"S3 Bucket"}>
          <Input
            onChange={({ detail }) => {
              setS3Bucket(detail.value);
              setModelParams((prev) => ({
                ...prev,
                s3_bucket: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                s3_bucket: detail.value,
              });
            }}
            value={s3_bucket}
          />
        </FormField>
        <FormField label={"S3 Object prefix"}>
          <Input
            onChange={({ detail }) => {
              setObjPrefix(detail.value);
              setModelParams((prev) => ({
                ...prev,
                obj_prefix: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                obj_prefix: detail.value,
              });
            }}
            value={obj_prefix}
          />
        </FormField>
</SpaceBetween>
    );
}

const ModelSettings =() =>{
    const { t } = useTranslation();
    const { modelSettingVisible, setModelSettingVisible } = useSettingCtx();
    return (
        <Modal
          onDismiss={() => setModelSettingVisible(false)}
          visible={modelSettingVisible}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={ ()=> setModelSettingVisible(false)}>{t('close')}</Button>
                <Button variant="primary" href = '/chat' onClick={ ()=> setModelSettingVisible(false)}>{t('confirm')}</Button>
              </SpaceBetween>
            </Box>
          }
          header={t('settings')}
        >
          <SettingsPanel/>
        </Modal>
      );
}

export default ModelSettings;