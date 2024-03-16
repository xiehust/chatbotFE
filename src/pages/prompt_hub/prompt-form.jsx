import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Form,
  SpaceBetween,
  Button,
  FormField,
  Container,
  Box,
  Link,
  Header,
} from "@cloudscape-design/components";
import { generateId,DetailPanel,useTemplateFormCtx,addTemplateFormCtx} from "./common-components";
import { useAuthorizedHeader,useAuthUserInfo } from "../commons/use-auth";
import { useNavigate } from "react-router-dom";
import { useSimpleNotifications } from "../commons/use-notifications";
import {  addPrompt } from "../commons/api-gateway";
import { useTranslation } from 'react-i18next';
import {params_local_storage_key} from "./common-components";
import { useLocalStorage } from '../../common/localStorage';



export default function FormContent() {
  const [inValid,setInvalid] = useState(false);
  const [formData, setFormData] = useState({
    template:''
  });
  return (
    <addTemplateFormCtx.Provider value={{ formData, setFormData,inValid,setInvalid }}>
      <BaseFormContent
        content={
          <SpaceBetween size="l">
            <DetailPanel />
          </SpaceBetween>
        }
      />
    </addTemplateFormCtx.Provider>
  );
}
