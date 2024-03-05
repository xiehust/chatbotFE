// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect, useContext, createContext } from "react";
import {
  BreadcrumbGroup,
  SpaceBetween,
  Button,
  Modal,
  Box,
  Container,
  FormField,
  CodeEditor,
  Input,
  Select,
  Textarea,
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import { params_local_storage_key } from "../chatbot/common-components";
import { deletePrompt } from "../commons/api-gateway";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import { useSimpleNotifications } from '../commons/use-notifications';
import {PROMPT_CATS} from './table-config';
import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dawn.css';
import 'ace-builds/css/theme/tomorrow_night_bright.css';

// const ace = await import('ace-builds');
// ace.config.set('useStrictCSP', true);
export const addTemplateFormCtx = createContext();

export const useTemplateFormCtx = () => {
  return useContext(addTemplateFormCtx);
}

export const generateId = () => {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`
}

const formatHtmlLines = (text)=>{
  return text?.split("\n").map((it,idx) => (
    <span key={idx}>
      {it}
      <br />
    </span>
  ));
}


export const TemplateEditor = (props) => {
  const [preferences, setPreferences] = useState(
    undefined
  );
  const [ace, setAce] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAce() {
      const ace = await import('ace-builds');
      await import('ace-builds/webpack-resolver');
      ace.config.set('useStrictCSP', true);
      return ace;
    }

    loadAce()
      .then(ace => setAce(ace))
      .finally(() => setLoading(false));
  }, []);
  return (props.readOnly? <Textarea readOnly value={props.value}/> : <CodeEditor
    {...props}
    preferences={preferences}
    onPreferencesChange={e => setPreferences(e.detail)}
    ace={ace}
    loading={loading}
    language="text"
    themes={{ dark: ['dawn'], light: ['tomorrow_night_bright'] }}
  />)
}

export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/",
    },
    {
      text: t("prompt_hub"),
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

export const BreadcrumbsDynmic = ({ id }) => {
  const { t } = useTranslation();
  return (
    <BreadcrumbGroup
      items={[
        {
          text: t("awschatportal"),
          href: "/home",
        },
        {
          text: t("prompt_hub"),
          href: "/prompt_hub",
        },
        {
          text: id,
          href: "/prompt_hub/" + id,
        },
      ]}
      expandAriaLabel="Show path"
      ariaLabel="Breadcrumbs"
    />
  );
};
export const DeleteConfirmModal = ({ selectItem, visible, setVisible, refreshAction }) => {
  const { t } = useTranslation();
  const { setNotificationItems } = useSimpleNotifications();

  const headers = useAuthorizedHeader();

  const [loading, setLoading] = useState(false);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  const msgid = `msg-${Math.random().toString(8)}`;
  const main_fun_arn = localStoredParams.main_fun_arn;
  const apigateway_endpoint = localStoredParams.apigateway_endpoint;
  const deleteAction = () => {
    setLoading(true);
    const payload = {
      ...selectItem,
      main_fun_arn: main_fun_arn,
      apigateway_endpoint: apigateway_endpoint
    };
    console.log(payload);
    deletePrompt(headers, payload)
      .then(res => {
        setNotificationItems((item) => [
          ...item,
          {
            header: t('delete_template'),
            type: "success",
            content: t('delete_template') + ' success',
            dismissible: true,
            dismissLabel: "Dismiss message",
            onDismiss: () =>
              setNotificationItems((items) =>
                items.filter((item) => item.id !== msgid)
              ),
            id: msgid,
          },
        ]);
        setLoading(false);
        setVisible(false);
        refreshAction();
      })
      .catch(err => {
        setNotificationItems(() => [
          {
            header: t("delete_template"),
            content: `${err.message}`,
            type: "error",
            dismissible: true,
            dismissLabel: "Dismiss message",
            onDismiss: () => setNotificationItems([]),
            id: msgid,
          },
        ]);
        setLoading(false);
        setVisible(false);
      })

  }
  return (
    <Modal
      onDismiss={() => setVisible(false)}
      visible={visible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link"
              onClick={() => setVisible(false)}
            >{t('cancel')}</Button>
            <Button variant="primary"
              loading={loading}
              onClick={deleteAction}
            >{t('confirm')}</Button>
          </SpaceBetween>
        </Box>
      }
      header={t('delete')}
    >
      {t('delete_template') + ':' + selectItem?.template_name}
    </Modal>
  );

};

export const FullPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const isOnlyOneSelected = props.selectedItems.length === 1;
  const [visible, setVisible] = useState(false)
  const deleteAction = () => {
    setVisible(true);
  };
  const selectItem = isOnlyOneSelected ? props.selectedItems[0] : undefined;
  // console.log(selectItem);
  return (
    <div>
      <DeleteConfirmModal visible={visible} setVisible={setVisible} selectItem={selectItem} refreshAction={props.refreshAction} />
      <TableHeader
        variant="awsui-h1-sticky"
        title={resourceName}
        actionButtons={
          <SpaceBetween size="xs" direction="horizontal">
            <Button
              name="refresh"
              onClick={props.refreshAction}
              iconName="refresh"
            />
            <Button
              disabled={!isOnlyOneSelected}
              name="delete"
              onClick={deleteAction}
            >
              {t('delete')}
            </Button>
            {/* <Button
            disabled={!isOnlyOneSelected}
            name="edit"
            onClick={deleteAction}
          >
            {t('edit')}
          </Button> */}
            <Button
              href={'/prompt_hub/create'}
              variant="primary"
            >{t('create')}
            </Button>
          </SpaceBetween>
        }
        {...props}
      />
    </div>
  );
};

export const DetailPanel = ({ readOnlyWithErrors = false, readOnly = false }) => {

  const { t } = useTranslation();
  const { formData, setFormData, inValid, setInvalid } = useContext(addTemplateFormCtx);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  const getErrorText = (errorMessage) => {
    return readOnlyWithErrors ? errorMessage : undefined;
  };
  function previewTemplate(formData) {
    let rawText = formData.template;
    formData.variable_names &&
      Object.keys(formData.variable_names).map(key => {
        const name = formData.variable_names && formData.variable_names[key];
        const value = formData.variable_values && formData.variable_values[key];
        rawText = rawText?.replaceAll(`{${name}}`, value);
      });
    return rawText;
  }
  return (
    <Container
    >
      <SpaceBetween size="l">
        <FormField label={t("select_category")}> 
            <CategorySelect formData={formData} setFormData={setFormData} readOnly={readOnly}/>
        </FormField>

        <FormField
          label={t("template_name")}
          errorText={getErrorText("You must enter a unique template name")}
          i18nStrings={{ errorIconAriaLabel: "Error" }}
        >
          <Input
            invalid={inValid}
            readOnly={readOnly}
            placeholder="Required"
            value={formData.template_name}
            onChange={(event) => {
              !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, template_name: event.detail.value }));
              setInvalid(false);
            }
            }
          />
        </FormField>
        <FormField
          label={t("description")}
        >
          <Input
            placeholder="Optional"
            readOnly={readOnly}
            value={formData.description}
            onChange={(event) =>
              !readOnlyWithErrors &&
              setFormData((prev) => ({ ...prev, description: event.detail.value }))
            }
          />
        </FormField>
        <FormField
          label={t("template")}
        >
          <TemplateEditor
            readOnly={readOnly}
            invalid={inValid}
            value={formData.template}
            onChange={(event) => {
              setFormData((prev) => ({ ...prev, template: event.detail.value }));
              setInvalid(false);
            }
            }
          />
        </FormField>
        <FormField>
            <AddVariablesComp formData={formData} setFormData={setFormData} readOnly={readOnly}/>
        </FormField>
        <FormField
          label={t("preview")}
        >
          <Box variant="code">
            {formatHtmlLines(previewTemplate(formData))}
          </Box>
        </FormField>
      </SpaceBetween>
    </Container>
  );
}

export const CategorySelect = ({formData, setFormData,readOnly}) =>{
  const [selectedOption, setSelectedOption] = useState(formData.prompt_category??{});
  return (
    <Select
    disabled = {readOnly}
    selectedOption={selectedOption}
    onChange={({ detail }) => {
      setSelectedOption(detail.selectedOption);
      setFormData((prev) => ({
        ...prev,
        prompt_category: detail.selectedOption,
      }));
    }}
    options={PROMPT_CATS}
    selectedAriaLabel="Selected"
    />
  )
} 

const VariableComp = ({ sn, formData, setFormData,readOnly }) => {
  const { t } = useTranslation();
  const [inValid1, setInvalid1] = useState(false);
  const [fieldName, setFieldName] = useState(formData.variable_names?formData.variable_names[sn]:'');
  const [inValid2, setInvalid2] = useState(false);
  const [defaultValue, setDefaultValue] = useState(formData.variable_values?formData.variable_values[sn]:'');

  return (

    <SpaceBetween direction="horizontal" size="xl">
      <FormField label={t('field') + ' ' + sn}
        constraintText={`${fieldName.length}/30`}
      >
        <Input
          invalid={inValid1}
          placeholder="(Required)"
          readOnly = {readOnly}
          value={fieldName}
          onChange={({ detail }) => {
            detail.value?.length > 30 ? setInvalid1(true) : setInvalid1(false);
            const restrict_val = detail.value.slice(0, 30);
            setFieldName(restrict_val);
            setFormData((prev) => ({ ...prev, variable_names: { ...prev.variable_names, [sn]: restrict_val } }));
          }
          }
        />
      </FormField>
      <FormField label={t('default_value')}
        constraintText={`${defaultValue.length}/1000`}>
        <Textarea
          invalid={inValid2}
          readOnly = {readOnly}
          placeholder="(Required)"
          rows={1}
          value={defaultValue}
          onChange={({ detail }) => {
            detail.value?.length > 1000 ? setInvalid2(true) : setInvalid2(false);
            const restrict_val = detail.value.slice(0, 1000);
            setDefaultValue(restrict_val);
            setFormData((prev) => ({ ...prev, variable_values: { ...prev.variable_values, [sn]: restrict_val } }));
          }
          }
        />
      </FormField>
    </SpaceBetween>
  )


}

const AddVariablesComp = ({ formData, setFormData,readOnly }) => {
  const { t } = useTranslation();
  const [addVariable, setAddVariable] = useState(false);
  const [cnts, setCnts] = useState(formData.variable_names
    ? Object.keys(formData.variable_names).map(key => Number(key))
    : [1]);
  return (
    (!addVariable && !readOnly) ?
    <Button variant="normal" onClick={(event) => {
      event.preventDefault();
      setAddVariable(true);
    }}>
      {t('add_variables')}
    </Button> :
    <SpaceBetween size='xs'>
      {cnts.map(sn => <VariableComp readOnly={readOnly} key={sn} sn={sn} formData={formData} setFormData={setFormData} />)}
      <SpaceBetween size='xs' direction="horizontal">
        <Button iconName="add-plus" variant="icon"
          disabled={cnts.length >= 10 || readOnly}
          onClick={(event) => {
            event.preventDefault();
            setCnts(prev => [...prev, prev[prev.length - 1] + 1])
          }} />
        <Button iconName="remove" variant="icon"
          disabled={cnts.length <= 0 || readOnly}
          onClick={(event) => {
            event.preventDefault();
            //重新显示AddVariable button
            cnts.length <= 1 
            ? setAddVariable(false)
              :setCnts((prev) => prev.slice(0, prev.length - 1))
          }} />
      </SpaceBetween>
    </SpaceBetween>
  )
}

