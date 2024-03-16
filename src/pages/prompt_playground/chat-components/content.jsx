// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createContext, useState, useEffect } from "react";
import { Grid } from "@cloudscape-design/components";
import { ChatDataCtx } from "./common-components";
import {
  Header,
  SpaceBetween,
  ContentLayout,
  Alert,
  Spinner,
} from "@cloudscape-design/components";
import ConversationsPanel from "./conversations";
import { useTranslation } from "react-i18next";
import ModelSettings from "../../commons/chat-settings";
import { useLocalStorage } from "../../../common/localStorage";
import {params_local_storage_key} from "./common-components";
import { useAuthUserInfo,useAuthorizedHeader } from "../../commons/use-auth";
import { defaultModelParams } from "./prompt-panel";
import {useSettingCtx} from "../../commons/common-components";
import { getPrompts } from "../../commons/api-gateway";
import { generateId } from "../../prompt_hub/common-components";

export default function Content({id}){
  
  const [hideRefDoc, setHideRefDoc] = useState(false);

  const [modelParams, setModelParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [img2txtUrl, setImg2txtUrl] = useState([]);
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
    params_local_storage_key + username+'-msgitems-'+id,
    []
  );
  const [msgItems, setMsgItems] = useState(localStoredMsgItems);
  // const [useTrace, setUseTrace] = useState( 
  //   localStoredParams?.use_trace !== undefined
  //   ? localStoredParams?.use_trace
  //   : defaultModelParams.use_trace);
  const { modelSettingVisible } = useSettingCtx();

  // const [enableSearch,setEnableSearch] = useState( localStoredParams?.enableSearch !== undefined
  //   ? localStoredParams?.enableSearch
  //   : false);

  const [loadingState,setLoadingState] = useState(false);
  const [formData, setFormData] = useState();

  const headers = useAuthorizedHeader();
  // const [agentInfo,setAgentInfo] = useState({});
  const [ready,setReady] = useState(false);
  const company = userinfo?.company || 'default';
  const queryParams = {
      id:id
  }

  function formatHistoryMesssages (history_messages){
    const msg_eles = Object.keys(history_messages).map(key => history_messages[key]);
    return msg_eles.map( (it)=>({id:'id'+generateId(),
                      who:it.role === 'assistant'?'AI':(it.role === 'assistant'?'user':''),
                    text:it.content}))
  }

  useEffect(()=>{
    setLoadingState(true);
    getPrompts(headers,queryParams)
    .then(data =>{
      console.log(data);
      // setAgentInfo(data);
      setFormData(data);

      //如果历史消息为空，则使用预制消息
      if (msgItems.length === 0 && data.history_messages){
        setMsgItems(formatHistoryMesssages(data.history_messages));
      }
      setLoadingState(false);
      setReady(true);
      setImg2txtUrl(data.imgurl);
      setModelParams(prev =>({
        ...prev,
        feature_config:data.web_search?'default':'search_disabled',
        system_role_prompt:data.system_role_prompt,
        system_role:'',
        use_qa:false,
      }))
    })
    .catch(err =>{
        setLoadingState(false);
        console.log(JSON.stringify(err))
    }
    )

  },[]);


  useEffect(()=>{
    setModelParams(prev =>({
      ...prev,
      apigateway_endpoint:localStoredParams?.apigateway_endpoint||'',
      OPENAI_API_KEY:localStoredParams?.OPENAI_API_KEY||'',
      s3_region:localStoredParams?.s3_region||'',
      s3_bucket:localStoredParams?.s3_bucket||'',
      ak:localStoredParams?.ak||'',
      sk:localStoredParams?.sk||'',
      // obj_prefix:localStoredParams?.obj_prefix||defaultModelParams.obj_prefix,
      // feature_config:localStoredParams?.enableSearch === true?'default':'search_disabled' //the search is enabled using 'default';
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
        formData, 
        setFormData,
        // useTrace,
        // setUseTrace,
        // enableSearch,
        // setEnableSearch,
        // agentInfo
      }}
    >
      <ModelSettings href={'/prompt_hub'}/>
      {ready?
      <ContentLayout header={<Header variant="h1">{t("start_chat")+" ["+formData.template_name+ "]"}</Header>}>
        <SpaceBetween size="l">
          {alertopen && (
            <Alert statusIconAriaLabel="Error" dismissible type="error">
              {t("connection_retrying")}
            </Alert>
          )}

          <ConversationsPanel id={id} />
        </SpaceBetween>
      </ContentLayout>
      :<Spinner size="large" description={t("loading")}/>
      }
    </ChatDataCtx.Provider>
  );
};
