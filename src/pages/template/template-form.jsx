import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Form,
  SpaceBetween,
  Button,
  FormField,
  Container,
  Header,
  Input,
  Textarea,
  Link,
} from "@cloudscape-design/components";
import { TemplateEditor } from "./common-components";
import { useAuthorizedHeader,useAuthUserInfo } from "../commons/use-auth";
import { useNavigate } from "react-router-dom";
import { useSimpleNotifications } from "../commons/use-notifications";
import {  addTemplate } from "../commons/api-gateway";
import { useTranslation } from 'react-i18next';
import {params_local_storage_key} from "../chatbot/common-components";
import { useLocalStorage } from '../../common/localStorage';

const addTemplateFormCtx = createContext();

function validateForm(props) {
  if (
    !props.template_name?.length ||
    !props.template?.length
  ) {
    return false;
  } else return true;
}

function generateId(){
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2,8);
  return `${timestamp}-${randomNumber}`
}

function BaseFormContent({ content, onCancelClick, errorText = null }) {
  const {t} = useTranslation();
  const { formData ,setInvalid} = useContext(addTemplateFormCtx);
  const { setNotificationItems } = useSimpleNotifications();
  const headers = useAuthorizedHeader();
  const userInfo = useAuthUserInfo();
  const navigate = useNavigate();
  const [sumbitloading, setSubLoading] = useState(false);
  const msgid = generateId();
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key+userInfo.username,
    null
  );
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;

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
        const id = msgid;
        const body = { ...formData, 
        id: id, 
        main_fun_arn:main_fun_arn,
        apigateway_endpoint:apigateway_endpoint,
        username:userInfo.username };

        return addTemplate(headers, body)
          .then((data) => {
            setSubLoading(false);
            setNotificationItems((item) => [
              ...item,
              {
                header: `Success to create template`,
                type: "success",
                content: `Success to create`,
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
                header: "Failed to create template",
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
            {t('add_template')}
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
              {t('confirm')}
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
  const { formData, setFormData,inValid,setInvalid } = useContext(addTemplateFormCtx);

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
    setFormData((prev) => ({ ...prev, 
      template:"{system_role_prompt} {role_bot}，请严格根据反括号中的资料提取相关信息，回答用户的各种问题\n```\n{chat_history}\n{context}\n```\n用户:{question}\n{role_bot}:"}));
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

export default function FormContent() {
  const [inValid,setInvalid] = useState(false);
  const [formData, setFormData] = useState({
  });
  return (
    <addTemplateFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
      <BaseFormContent
        content={
          <SpaceBetween size="l">
            <AddPanel />
          </SpaceBetween>
        }
      />
    </addTemplateFormCtx.Provider>
  );
}
