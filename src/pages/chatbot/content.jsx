// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createContext, useState, useEffect } from "react";
import { Grid } from "@cloudscape-design/components";
import { ChatDataCtx } from "./common-components";
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Spinner,
  ColumnLayout,
  ContentLayout,
  StatusIndicator,
  Alert,
} from "@cloudscape-design/components";
import ConversationsPanel from "./conversations";
import { useTranslation } from "react-i18next";
import ModelSettings from "../commons/chat-settings";
import { useLocalStorage } from "../../common/localStorage";
import {params_local_storage_key} from "./common-components";
import { useAuthUserInfo } from "../commons/use-auth";
import { defaultModelParams } from "./prompt-panel";
import {useSettingCtx} from "../commons/common-components";

const Content = () => {
  
  const [hideRefDoc, setHideRefDoc] = useState(false);

  const [modelParams, setModelParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [img2txtUrl, setImg2txtUrl] = useState(null);
  const [feedBackModalVisible,setFeedBackModalVisible] = useState(false);
  const [modalData,setModalData] = useState({});
  const [stopFlag,setStopFlag] = useState(false);
  const [newChatLoading, setNewChatLoading] = useState(false);

  const { t } = useTranslation();
  const [alertopen, setAlertOpen] = useState(false);
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );
  const [localStoredMsgItems, setLocalStoredMsgItems] = useLocalStorage(
    params_local_storage_key + '-msgitems-'+userinfo.username,
    []
  );
  const [msgItems, setMsgItems] = useState(localStoredMsgItems);
  const [useTrace, setUseTrace] = useState( 
    localStoredParams?.use_trace !== undefined
    ? localStoredParams?.use_trace
    : defaultModelParams.use_trace);
  const { modelSettingVisible } = useSettingCtx();


  useEffect(()=>{
    setModelParams(prev =>({
      ...prev,
      apigateway_endpoint:localStoredParams?.apigateway_endpoint||'',
      OPENAI_API_KEY:localStoredParams?.OPENAI_API_KEY||'',
      s3_region:localStoredParams?.s3_region||'',
      s3_bucket:localStoredParams?.s3_bucket||'',
      ak:localStoredParams?.ak||'',
      sk:localStoredParams?.sk||'',
      obj_prefix:localStoredParams?.obj_prefix||defaultModelParams.obj_prefix,
    }))
  },[modelSettingVisible]);


  return (
    <ChatDataCtx.Provider
      value={{
        msgItems,
        setMsgItems,
        modelParams,
        setModelParams,
        loading,
        hideRefDoc,
        setHideRefDoc,
        setLoading,
        conversations,
        setConversations,
        alertopen,
        setAlertOpen,
        img2txtUrl,
        setImg2txtUrl,
        feedBackModalVisible,
        setFeedBackModalVisible,
        modalData,
        setModalData,
        stopFlag,
        setStopFlag,
        newChatLoading, 
        setNewChatLoading,
        useTrace,
        setUseTrace
      }}
    >
      <ModelSettings href={'/chat'}/>
      <ContentLayout header={<Header variant="h1">{t("chatbot")}</Header>}>
        <SpaceBetween size="l">
          {alertopen && (
            <Alert statusIconAriaLabel="Error" dismissible type="error">
              {t("connection_retrying")}
            </Alert>
          )}

          <ConversationsPanel />
        </SpaceBetween>
      </ContentLayout>
    </ChatDataCtx.Provider>
  );
};

export default Content;
