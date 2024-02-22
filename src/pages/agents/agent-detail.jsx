// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState ,createContext,useContext} from "react";
import { useParams } from "react-router-dom";
import {
  SpaceBetween,
  Spinner,

} from "@cloudscape-design/components";
import { BreadcrumbsDynmic } from "./common-components";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';
import { AddPanel,BaseFormContent } from "./common-components";
import {  listAgents } from "../commons/api-gateway";



const detailAgentFormCtx = createContext();

export default function AgentDetail() {
  const { agentId } = useParams();
  const [details, setDetail] = useState(null);
  const headers = useAuthorizedHeader();
  const [toolsOpen, setToolsOpen] = useState(false);
  const appLayout = useRef();
  const userInfo = useAuthUserInfo();
  const company = userInfo.company??'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;
  const [inValid,setInvalid] = useState(false);
  const [formData, setFormData] = useState({
  });
  useEffect(() => {
      listAgents(headers,{
      id:agentId,
      // main_fun_arn:main_fun_arn,
      // apigateway_endpoint:apigateway_endpoint,
      company:company,
    })
    .then(data =>{
      setDetail(data);
        const payload = data;
        console.log(payload);
        setFormData({
          ...payload,
        })
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
      navigation={<Navigation activeHref="/agents" />}
      breadcrumbs={<BreadcrumbsDynmic id={agentId} />}
      content={
        details ? (
          <detailAgentFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
            <BaseFormContent 
            formCtx={detailAgentFormCtx}
            content={
          <SpaceBetween size="l">
            <AddPanel formCtx={detailAgentFormCtx} />
          </SpaceBetween>
          }
            />
            </detailAgentFormCtx.Provider>
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