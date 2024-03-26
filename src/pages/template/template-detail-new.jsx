// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useRef, useState ,createContext,useContext} from "react";
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
  FormField,
  Link,
  Textarea,
  Input,
  Form,
  Button
} from "@cloudscape-design/components";
import { BreadcrumbsDynmic ,generateId,TemplateEditor} from "./common-components";
import {  addTemplate } from "../commons/api-gateway";
import { CustomAppLayout, Navigation } from "../commons/common-components";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import {getTemplate} from '../commons/api-gateway';
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';
import { useTranslation } from "react-i18next";
import { useSimpleNotifications } from "../commons/use-notifications";
import { useNavigate } from "react-router-dom";


const detailTemplateFormCtx = createContext();


function validateForm(props) {
  if (
    !props.template_name?.length ||
    !props.template?.length
  ) {
    return false;
  } else return true;
}

function BaseFormContent({ content, errorText = null }) {
  const {t} = useTranslation();
  const { formData ,setInvalid} = useContext(detailTemplateFormCtx);
  const { setNotificationItems } = useSimpleNotifications();
  const headers = useAuthorizedHeader();
  const userInfo = useAuthUserInfo();
  const company = userInfo.company??'default';
  const navigate = useNavigate();
  const [sumbitloading, setSubLoading] = useState(false);
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
        if (!validateForm(formData)) {
          setInvalid(true);
          return "";
        }
        setSubLoading(true);
        console.log(JSON.stringify(formData));
        const body = { ...formData, 
        id: formData.id, 
        main_fun_arn:main_fun_arn,
        apigateway_endpoint:apigateway_endpoint,
        username:userInfo.username,
        company:company
         };

        return addTemplate(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success to save template`,
                type: "success",
                content: `Success to save`,
                dismissible: true,
                dismissLabel: "Dismiss message",
                onDismiss: () =>
                  setNotificationItems((items) =>
                    items.filter((item) => item.id !== msgid)
                  ),
                id: msgid,
              },
            ]);
            navigate("/template");
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
              navigate('/template')}} >
            {t('cancel')}
            </Button>
            <Button loading={sumbitloading} variant="primary">
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


function AddPanel({ readOnlyWithErrors = false }) {

  const {t} = useTranslation();
  const { formData, setFormData,inValid,setInvalid } = useContext(detailTemplateFormCtx);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+username,
    null
  );

  const getErrorText = (errorMessage) => {
    return readOnlyWithErrors ? errorMessage : undefined;
  };
  useEffect(()=>{
  },
  []);
  // console.log(localStoredParams);
  function previewTemplate(rawText){
    const system_role = localStoredParams.system_role;
    const system_role_prompt = localStoredParams.system_role_prompt;
    let text = rawText?.replaceAll('{system_role_prompt}',system_role_prompt);
    text = text?.replaceAll('{role_bot}',system_role);
    return text;
  }
  return (
    <Container
    >
      <SpaceBetween size="l">
        <FormField
        
          label={t("template_name")}
          errorText={getErrorText("You must enter a unique template name")}
          i18nStrings={{ errorIconAriaLabel: "Error" }}
        >
          <Input
          invalid={inValid}
            ariaRequired={true}
            placeholder="Required"
            value={formData.template_name}
            onChange={(event) =>{
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, template_name: event.detail.value }));
              setInvalid(false);
            }
            }
          />
        </FormField>
        <FormField
          label={t("template")}
          description={<>{"Keywords: {system_role_prompt},{question},{role_bot},{chat_history},{context} "}
          <Link href="https://github.com/xiehust/chatbotFE/blob/main/HowToUsePromptTemplate.md"
            external="true">{t('readme')}</Link></>}
        >
          <TemplateEditor
          invalid={inValid}
            value={formData.template}
            onChange={(event) =>{
              setFormData((prev) => ({ ...prev, template: event.detail.value }));
              setInvalid(false);
            }
            }
          />
        </FormField>
        <FormField
          label={t("preview")}
        >
          <Textarea
          placeholder="Required"
          readOnly = {true}
            rows={6}
            ariaRequired={true}
            value={previewTemplate(formData.template)}
            onChange={(event) =>{
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, template: event.detail.value }));
              setInvalid(false);
            }
            }
          />
        </FormField>
        <FormField
          label={t("comment")}
        >
          <Input
           placeholder="Optional"
            ariaRequired={true}
            value={formData.comment}
            onChange={(event) =>
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, comment: event.detail.value }))
            }
          />
        </FormField>
        
      </SpaceBetween>
    </Container>
  );
}



export default function TemplateDetail() {
  const { templateId } = useParams();
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
    getTemplate(headers,{
      id:templateId,
      main_fun_arn:main_fun_arn,
      apigateway_endpoint:apigateway_endpoint,
      company:company,
    })
    .then(data =>{
      setDetail(data.body);
        const body = data.body;
        console.log(body);
        setFormData({
          comment:body.comment.S,
          template:body.template.S,
          template_name:body.template_name.S,
          username:body.username.S,
          id:body.id.S
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
      navigation={<Navigation activeHref="/template" />}
      breadcrumbs={<BreadcrumbsDynmic id={templateId} />}
      content={
        details ? (
          <detailTemplateFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
            <BaseFormContent 
            content={
          <SpaceBetween size="l">
            <AddPanel />
          </SpaceBetween>
          }

            />
            </detailTemplateFormCtx.Provider>
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