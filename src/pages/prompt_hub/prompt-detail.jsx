// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState ,createContext,useContext} from "react";
import { useParams } from "react-router-dom";
import {
  Header,
  SpaceBetween,
  Spinner,
  Form,
  Link,
  Box,
  Button
} from "@cloudscape-design/components";
import { BreadcrumbsDynmic ,generateId,DetailPanel,addTemplateFormCtx,useTemplateFormCtx,validateForm} from "./common-components";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import {getPrompts,addPrompt} from '../commons/api-gateway';
import {params_local_storage_key} from "./common-components";
import { useLocalStorage } from '../../common/localStorage';
import { useTranslation } from "react-i18next";
import { useSimpleNotifications } from "../commons/use-notifications";
import { useNavigate } from "react-router-dom";



function BaseFormContent({ content,setReadOnly, errorText = null }) {
  const {t} = useTranslation();
  const { formData ,setInvalid} = useTemplateFormCtx();
  const { setNotificationItems } = useSimpleNotifications();
  const headers = useAuthorizedHeader();
  const userInfo = useAuthUserInfo();
  const company = userInfo.company??'default';
  const navigate = useNavigate();
  const [sumbitloading, setSubLoading] = useState(false);
  const [editState, setEditState] = useState(false);
  const msgid = generateId();
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        console.log(formData);
        if (!validateForm(formData)) {
          console.log('invalid form')
          setInvalid(true);
          return "";
        }
        setSubLoading(true);
        // console.log(JSON.stringify(formData));
        const body = { ...formData, 
          images_base64:undefined,
        id: formData.id, 
        username:userInfo.username,
        company:company
         };

        return addPrompt(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success!`,
                type: "success",
                content: <Box>{'Success to save '}<Link href={`/prompt_hub/${formData?.id}`}>{`${formData?.template_name}`}</Link></Box>,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== msgid)
                  ),
                id: msgid,
              },
            ]);
            navigate("/prompt_hub");
          })
          .catch((error) => {
            console.log(error);
            setSubLoading(false);
            setNotificationItems(() => [
              {
                header: "Failed to save template",
                type: "error",
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () => setNotificationItems([]),
                id: msgid,
              },
            ]);
          });
      }}
    >
      <Form
        header={
          <Header
          variant="h1"
          >
          {`${formData.id}`}
        </Header>
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={(event)=>{
              event.preventDefault();
              navigate('/prompt_hub')}} >
            {t('cancel')}
            </Button>

            {!editState&&<Button 
              disabled = {userInfo.groupname !== 'admin'}
              variant="link" onClick={(event)=>{
              event.preventDefault();
              setEditState(true);
              setReadOnly(false);
              }} >
            {t('edit')}
            </Button>}
            <Button 
              disabled = {userInfo.groupname !== 'admin' ||!editState }
              loading={sumbitloading} variant="primary">
              {t('confirm_change')}
            </Button>
          </SpaceBetween>
        }
        errorText={errorText}
        errorIconAriaLabel="Error"
      >
        {content}
      </Form>
    </form>
  );
}



export default function PromptDetail() {
  const { templateId } = useParams();
  const [details, setDetail] = useState(null);
  const headers = useAuthorizedHeader();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [readOnly, setReadOnly] = useState(true);
  const appLayout = useRef();
  const userInfo = useAuthUserInfo();
  const company = userInfo.company??'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;
  const [inValid,setInvalid] = useState(false);
  const [formData, setFormData] = useState({
  });
  useEffect(() => {
    getPrompts(headers,{
      id:templateId,
      main_fun_arn:main_fun_arn,
      apigateway_endpoint:apigateway_endpoint,
      company:company,
    })
    .then(data =>{
      setDetail(data);
        console.log(data);
        setFormData({
          ...data,
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
      navigation={<Navigation activeHref="/prompt_hub" />}
      breadcrumbs={<BreadcrumbsDynmic id={templateId} />}
      content={
        details ? (
          <addTemplateFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
            <BaseFormContent 

            setReadOnly={setReadOnly}
            content={
          <SpaceBetween size="l">
            <DetailPanel readOnly={readOnly} />
          </SpaceBetween>
          }

            />
            </addTemplateFormCtx.Provider>
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