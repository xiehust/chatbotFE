// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useEffect, useContext, createContext } from "react";
import {
  BreadcrumbGroup,
  SpaceBetween,
  Button,
  Box,
  Modal,
  Container,
  FormField,
  CodeEditor,
  Input,
  Select,
  Textarea,
  Multiselect,
  Header,
  Toggle,
  Grid,
  FileUpload,
  RadioGroup,
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
// import { params_local_storage_key } from "../chatbot/common-components";
import { deletePrompt,uploadFile } from "../commons/api-gateway";
import { useAuthorizedHeader, useAuthUserInfo,useAuthToken } from "../commons/use-auth";
import { useSimpleNotifications } from '../commons/use-notifications';
import { PROMPT_CATS, GEO_CATS, COMPAT_MODELS,INSTRUSTRY_LIST } from './table-config';
import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dawn.css';
import 'ace-builds/css/theme/tomorrow_night_bright.css';

export const params_local_storage_key = 'pehub-localstorage';
// const ace = await import('ace-builds');
// ace.config.set('useStrictCSP', true);
const default_bucket = process.env.REACT_APP_DEFAULT_UPLOAD_BUCKET;

export const addTemplateFormCtx = createContext();

export const useTemplateFormCtx = () => {
  return useContext(addTemplateFormCtx);
}

export const generateId = () => {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`
}

const formatHtmlLines = (text) => {
  return text?.split("\n").map((it, idx) => (
    <span key={idx}>
      {it}
      <br />
    </span>
  ));
}


export function validateForm(props) {
  if (
    !props.template_name?.length ||
    !props.email?.length||
    !props.prompt_category ||
    !props.industry
  ) {
    return false;
  } else return true;
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
  return (props.readOnly ? <Textarea readOnly value={props.value} rows={24} /> : <CodeEditor
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
      href: "/prompt_hub",
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

export const CardBreadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/prompt_playground",
    },
    {
      text: t("demo_hub"),
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
          href: "/prompt_hub",
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
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;
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
  const userinfo = useAuthUserInfo();
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
            {
              userinfo?.groupname === 'admin'&&
            <Button
              disabled={!isOnlyOneSelected || userinfo.groupname != 'admin'}
              name="delete"
              onClick={deleteAction}
            >
              {t('delete')}
            </Button>
          }
            <Button
            onClick={props.handleAddClick}
          >
            {t("submit_new_feedback")}
          </Button>
            <Button
              disabled={!isOnlyOneSelected}
              href={'/prompt_playground/' + selectItem?.id}
              variant="primary"
            >{t('start_chat')}
            </Button>
            <Button
             iconName="add-plus"
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

export const CardPageHeader = ({
  resourceName,
  createButtonText,
  ...props
}) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
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
            onClick={props.handleAddClick}
          >
            {t("submit_new_feedback")}
          </Button>
            <Button
              disabled={!isOnlyOneSelected}
              href={'/prompt_playground/' + selectItem?.id}
              variant="primary"
            >{t('start_chat')}
            </Button>
          </SpaceBetween>
        }
        {...props}
      />
    </div>
  );
};

export function previewTemplate(formData) {
  let rawText = formData.template??'';
  formData.variable_names &&
    Object.keys(formData.variable_names).map(key => {
      const name = formData.variable_names && formData.variable_names[key];
      const value = formData.variable_values && formData.variable_values[key];
      rawText = rawText?.replaceAll(`{${name}}`, value);
    });
  return rawText;
}


export const DetailPanel = ({ readOnlyWithErrors = false, readOnly = false }) => {

  const { t } = useTranslation();
  const { formData, setFormData, inValid, setInvalid } = useContext(addTemplateFormCtx);
  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header variant="h3"
            actions={<Button
              disabled={!readOnly}
              href={'/prompt_playground/' + formData?.id}
              variant="primary"
            >{t('start_chat')}
            </Button>}>
            {t('basic_info')}
          </Header>}
      >
        <SpaceBetween size="l">
          <FormField label={t("uploader_email")} description={t("your_amazon_email")}>
            <Input
              invalid={inValid && !formData.email}
              placeholder="Required"
              readOnly={readOnly}
              inputMode="email"
              value={formData.email}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, email: event.detail.value }))
              }
            />
          </FormField>
          <FormField label={t("department")} description={t("your_department")}>
            <Input
              placeholder="Optional"
              readOnly={readOnly}
              value={formData.department}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, department: event.detail.value }))
              }
            />
          </FormField>
        </SpaceBetween>
      </Container >
      <Container
        header={
          <Header variant="h3" >
            {t('template_info')}
          </Header>}
      >
        <SpaceBetween size="l">
          <FormField label={t("select_compat_models")}>
            <ModelSelect readOnly={readOnly} />
          </FormField>
          <FormField label={t("select_industry")}>
            <IndustrySelect readOnly={readOnly} />
          </FormField>
          <FormField label={t("select_category")}>
            <CategorySelect readOnly={readOnly} />
          </FormField>
          <FormField
            label={t("template_name")}
          >
            <Input
              invalid={inValid && !formData.template_name}
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
          <FormField label={t("description")}>
            <Textarea
              placeholder="Optional"
              readOnly={readOnly}
              value={formData.description}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, description: event.detail.value }))
              }
            />
          </FormField >
          <RecommendedPE readOnly={readOnly}/>

        </SpaceBetween>
      </Container>
      <Container
        header={
          <Header variant="h3" >
            {t('main_info')}
          </Header>}
      >
        <SpaceBetween size="l">
        <OpeningQuesionsComp formData={formData} setFormData={setFormData} readOnly={readOnly} />
        <FormField label={t("prompt_content")}>
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
          <AddMigrationComp readOnly={readOnly} />
        </FormField>
        <FormField stretch={true}>
          <AddVariablesComp formData={formData} setFormData={setFormData} readOnly={readOnly} />
        </FormField>
        <FormField stretch={true}>
            <ImageUploader formData={formData} setFormData={setFormData} readOnly={readOnly}/>
        </FormField>

        </SpaceBetween>
      </Container>
      <Container>
        <FormField
          label={t("preview")}
        >
          <PreviewBox formData={formData} />
        </FormField>

      </Container>
    </SpaceBetween>
  );
}

export const PreviewBox = ({ formData }) => {
  return (
    //   <Box variant="code">
    //   {formatHtmlLines(previewTemplate(formData))}
    // </Box>
    <Textarea
      value={previewTemplate(formData)}
      rows={24}
      readOnly
    />
  )
}

const CategorySelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addTemplateFormCtx);
  const [selectedOption, setSelectedOption] = useState(formData.prompt_category);
  const value = formData.prompt_category?.label;

  return (
    readOnly?<ReadOnlyBox value = {value}/> :<Select
      invalid={inValid && !formData.prompt_category}
      disabled={readOnly}
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

const ReadOnlyBox = ({value}) =>{
  return (
    <Box>{value}</Box>
  )
}

const ModelSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addTemplateFormCtx);

  const [selectedOptions, setSelectedOptions] = useState(formData.compat_models);
  const value = formData.compat_models?.map(it => it.label).join(' | ');
  return (
    readOnly?<ReadOnlyBox value = {value}/> :<Multiselect
      invalid={inValid && !formData.compat_models}
      disabled={readOnly}
      selectedOptions={selectedOptions}
      onChange={({ detail }) => {
        setSelectedOptions(detail.selectedOptions);
        setFormData((prev) => ({
          ...prev,
          compat_models: detail.selectedOptions,
        }));
      }}
      options={COMPAT_MODELS}
    />
  )
}

const IndustrySelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addTemplateFormCtx);

  const [selectedOptions, setSelectedOptions] = useState(formData.industry);
  const value = formData.industry?.map(it => it.label).join(' | ') || '-';
  return (
    readOnly?<ReadOnlyBox value = {value}/> :<Multiselect
      invalid={inValid && !formData.industry}
      disabled={readOnly}
      selectedOptions={selectedOptions}
      onChange={({ detail }) => {
        setSelectedOptions(detail.selectedOptions);
        setFormData((prev) => ({
          ...prev,
          industry: detail.selectedOptions,
        }));
      }}
      options={INSTRUSTRY_LIST}
    />
  )
}


const GeoSelect = ({ readOnly }) => {
  const { formData, setFormData } = useContext(addTemplateFormCtx);

  const [value, setValue] = useState(formData.geo ?? GEO_CATS[0].value);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      geo: formData.geo ?? GEO_CATS[0].value
    }));
  }, [])
  return (
    <RadioGroup
      disabled={readOnly}
      value={value}
      onChange={({ detail }) => {
        if (!readOnly) {
          setValue(detail.value);
          setFormData((prev) => ({
            ...prev,
            geo: detail.value,
          }));
        }
      }
      }
      items={GEO_CATS}
    />
  )
}

const RecommendedPE = ({ readOnly }) => {
  const { t } = useTranslation();
  const userInfo = useAuthUserInfo();
  const { formData, setFormData } = useContext(addTemplateFormCtx);
  const [checked, setChecked] = useState(formData.is_recommended ?? false);
  return   (<Toggle
  description={t('is_recommended_desc')}
  disabled={readOnly || userInfo.groupname !== 'admin'} checked={checked} onChange={(event) => {
    setChecked(event.detail.checked);
    setFormData((prev) => ({ ...prev, is_recommended: event.detail.checked }))
  }}>
  {t('is_recommended')}
</Toggle>
)

}

const VariableComp = ({ sn, formData, setFormData, readOnly }) => {
  const { t } = useTranslation();
  const [inValid1, setInvalid1] = useState(false);
  const [fieldName, setFieldName] = useState(formData.variable_names ? formData.variable_names[sn] ?? '' : '');
  const [inValid2, setInvalid2] = useState(false);
  const [defaultValue, setDefaultValue] = useState(formData.variable_values ? formData.variable_values[sn] ?? '' : '');

  return (

    <SpaceBetween direction="horizontal" size="xl">
      <FormField label={t('field') + ' ' + sn} stretch={true}
        constraintText={`${fieldName.length}/30`}
      >
        <Input
          invalid={inValid1}
          placeholder="(Required)"
          readOnly={readOnly}
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
      <FormField label={t('default_value')} stretch={true}
        constraintText={`${defaultValue.length}/1000`}>
        <Textarea
          invalid={inValid2}
          readOnly={readOnly}
          placeholder="(Required)"
          rows={1}
          value={defaultValue}
          onChange={({ detail }) => {
            detail.value?.length > 10000 ? setInvalid2(true) : setInvalid2(false);
            const restrict_val = detail.value.slice(0, 10000);
            setDefaultValue(restrict_val);
            setFormData((prev) => ({ ...prev, variable_values: { ...prev.variable_values, [sn]: restrict_val } }));
          }
          }
        />
      </FormField>
    </SpaceBetween>
  )
}

const AddMigrationComp = ({ readOnly }) => {
  const { t } = useTranslation();
  const { formData, setFormData, inValid, setInvalid } = useContext(addTemplateFormCtx);
  const [checked, setChecked] = useState(formData.is_migration ?? false);
  return (
    <SpaceBetween size="l">
      <Toggle
        description={t('if_is_gpt_migrate_desc')}
        disabled={readOnly} checked={checked} onChange={(event) => {
          setChecked(event.detail.checked);
          setFormData((prev) => ({ ...prev, is_migration: event.detail.checked }))
        }}>
        {t('is_migration')}
      </Toggle>
      {checked &&
        <FormField description={t('gpt_prompt_content_desc')}>
          <TemplateEditor
            readOnly={readOnly}
            invalid={inValid}
            value={formData.gpt_template}
            onChange={(event) => {
              setFormData((prev) => ({
                ...prev,
                gpt_template: event.detail.value
              }));
              setInvalid(false);
            }
            }
          />
        </FormField>
      }
    </SpaceBetween>
  )

}

export const AddVariablesComp = ({ formData, setFormData, readOnly }) => {
  const { t } = useTranslation();
  const [addVariable, setAddVariable] = useState(formData.variable_names ? true : false);
  const [cnts, setCnts] = useState(formData.variable_names && Object.keys(formData.variable_names).length > 0
    ? Object.keys(formData.variable_names).map(key => Number(key))
    : [1]);
  return (
    (!addVariable) ?
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
              console.log('cnts.length:',cnts.length);
              //重新显示AddVariable button
              if (cnts.length <= 1){
                setAddVariable(false);
              }{

                cnts.length > 1&& setCnts((prev) => prev.slice(0, prev.length - 1));
                setFormData( prev => {
                    let t = prev.variable_names
                    t&& delete t[cnts.length]; 
                    let t_val = prev.variable_values
                    t_val&& delete t_val[cnts.length];
                    console.log('t:',t);
                    console.log('t_val:',t_val);
                    return {...prev,variable_names:{...t},variable_values:{...t_val}}
                  });
              }
            }} 
          />
        </SpaceBetween>
      </SpaceBetween>
  )
}


const OpeningQuesionInputComp = ({ sn, formData, setFormData, readOnly }) => {
  const roles = [{ label: "Assistant", value: "assistant", iconName: "contact" },
  { label: "User", value: "user", iconName: "user-profile" },
  { label: "System", value: "system", iconName: "suggestions" },
  ]
  const { t } = useTranslation();
  const roleName = sn > 0?roles[sn % 2].value :'system';
  // console.log(formData);
  const [inputVal, setInputVal] = useState(
    formData.history_messages ? 
    (formData.history_messages.hasOwnProperty(sn)&& formData.history_messages[sn].role === roleName ?formData.history_messages[sn].content??'': ''):''
  )
  const [selectedOption, setSelectedOption] = useState(sn>0?roles[sn % 2]:roles[2]);

  return (
    <FormField
      label={selectedOption.value === 'system'?t("system_role_prompt"):(t("prefilling_message") + ' ' + sn)}
      stretch={true}
      constraintText={`${inputVal.length}/1000`}
    >
      <Grid gridDefinition={[{ colspan: 2 }, { colspan: 6 }]}>
        <FormField stretch={true}>
          <Select
            selectedOption={selectedOption}
            onChange={({ detail }) =>
            {
              setSelectedOption(detail.selectedOption);
              setFormData((prev) => ({ ...prev, history_messages:{...prev.history_messages,[sn]:{role:detail.selectedOption.value,
                content:prev.history_messages&&prev.history_messages[sn]?.content}}  }));
              if (detail.selectedOption.value === 'system') { //sn 预留给system用,后续改成message api之后，这个字段不需要了
                setFormData((prev) => ({ ...prev, system_role_prompt: prev.history_messages&&prev.history_messages[sn].content}));
              }
            }
            }
            disabled={readOnly}
            options={roles}
          />
        </FormField>
        <FormField stretch={true}>
          <Textarea
            rows={1}
            placeholder="Optional"
            readOnly={readOnly}
            value={inputVal}
            onChange={({ detail }) => {
              setInputVal(detail.value);
              setFormData((prev) => ({ ...prev, history_messages:{...prev.history_messages,[sn]:{role:selectedOption.value,content:detail.value}}  }));
              if (selectedOption.value === 'system') { //sn 预留给system用,后续改成message api之后，这个字段不需要了
                setFormData((prev) => ({ ...prev, system_role_prompt: detail.value}));
              }
            }
            }
          />
        </FormField>
      </Grid>

    </FormField>
  )
}


// const initArray = (n) => Array.from({ length: n }, (_, i) => i + 1);

export const OpeningQuesionsComp = ({ readOnly,formData, setFormData  }) => {
  const { t } = useTranslation();
  const [cnts,setCnts] = useState(
    formData.history_messages  && Object.keys(formData.history_messages).length > 0
    ?Object.keys(formData.history_messages).map(key => Number(key))
    :[0]);


  return (
    <SpaceBetween size='s'>
      {/* <SystemInputComp sn={0} formData={formData} setFormData={setFormData} readOnly={readOnly}/> */}
      {cnts.map(sn => <OpeningQuesionInputComp key={sn} sn={sn} formData={formData} setFormData={setFormData} readOnly={readOnly} />)}
      <SpaceBetween size='xs' direction="horizontal">
        <Button iconName="add-plus" variant="icon"
          disabled={cnts.length >= 10 || readOnly}
          onClick={(event) => {
            event.preventDefault();
            setCnts(prev => [...prev, prev[prev.length - 1] + 1])
          }} />
        <Button iconName="remove" variant="icon"
          disabled={cnts.length <= 1 || readOnly}
          onClick={(event) => {
            event.preventDefault();
            setCnts((prev) => prev.slice(0, prev.length - 1));
            setFormData( prev => {
              let t = prev.history_messages
              t&& delete t[cnts.length-1];
              return {...prev,history_messages:{...t}}});
          }} />
      </SpaceBetween>
    </SpaceBetween>
  )
}

export const ImageUploader = ({readOnly,formData, setFormData}) =>{
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || "default";
  const company = userinfo?.company || "default";
  const [uploadErrtxt, setUploadErr] = useState();
  const [files, setFiles] = useState([]);
  const [helperMsg, setHelperMsg] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = useAuthToken();
  const [imagesBase64, setImagesBase64] = useState(formData.images_base64??[]);
  // const [imgurl,setImgUrl] = useState(formData.imgurl??[]);


  // useEffect(()=>{
  //   !formData.imgS3Urls&&
  //   setFormData(prev => ({
  //     ...prev,
  //     images_base64:[],
  //     imgurl:[]
  //   }));
  // },[])

  const handleImageUpload = (imageFiles) => {
    const promises = imageFiles.map(file => {
      setLoading(true);
      const headers = {
        'Authorization': token.token,
        'Content-Type': file.type,
        'Accept': file.type
      };
      const read = new FileReader();
      read.readAsBinaryString(file);
      read.onloadend = () => {
        const bits = read.result;
        const body = {
          filename: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          lastModified: file.lastModified,
          buf: bits
        };

        uploadFile(username, company, body, headers)
          .then((response) => {
            setLoading(false);
            setUploadComplete(true);
            setFormData(prev => ({
              ...prev,
              imgurl:[...prev.imgurl??[],`${default_bucket}/images/${company}/${username}/${file.name}`]
            }));

            setFiles([]);
          })
          .catch((error) => {
            console.log(error);
            setLoading(false);
            setUploadErr(`Upload ${file.name} error`);
            setFiles([]);
          });
      }
    });
    Promise.all(promises)
      .then(async () => {
        const images_base64 = await Promise.all(imageFiles.map(async file => {
          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return base64Data;
        }));

        //保存base64 数据
        // setFormData(prev => ({
        //   ...prev,
        //   images_base64:[...prev.images_base64??[],...images_base64]
        // }));
        setImagesBase64(prev =>([...prev,...images_base64]))
      })
      .catch((error) => {
        console.error('Error uploading files:', error);
      });
  }

  return (
    <SpaceBetween size="s">
      <SpaceBetween size="s" direction="horizontal">
        <FileUpload
          onChange={({ detail }) => {
            if(!readOnly){
              setHelperMsg("");
              setFiles(detail.value);
              handleImageUpload(detail.value);
              setUploadErr(null);
              setUploadComplete(false);
            }
          }}
          disabled={readOnly}
          multiple
          value={files}
          accept=".png,.jpg,.jpeg"
          constraintText={helperMsg}
          showFileLastModified
          showFileSize
          showFileThumbnail
          tokenLimit={3}
          errorText={uploadErrtxt}
          i18nStrings={{
            uploadButtonText: (e) =>
              e ? t('upload_image') : t('upload_image'),
            dropzoneText: (e) =>
              e ? "Drop files to upload" : "Drop file to upload",
            removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
            limitShowFewer: "Show fewer files",
            limitShowMore: "Show more files",
            errorIconAriaLabel: "Error",
          }}
        />
      </SpaceBetween>
      {(formData?.images_base64||imagesBase64)&&
      <ImagePreview 
      readOnly={readOnly}
      formData={formData}
       setFormData={setFormData}
       imagesBase64={imagesBase64}
       setImagesBase64={setImagesBase64}
      alt="image preview" 
       loading={loading}
        setLoading={setLoading}
      />}
    </SpaceBetween>
  )
}


const ImageEnlargeComp =({...props})=>{
  const [visible, setVisible] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const userinfo = useAuthUserInfo();
  const company = userinfo?.company || "default";
  const [localStoredImagesData, setLocalStoredImagesData] = useLocalStorage(
    params_local_storage_key + company + userinfo.username+`-images-`,
    null
  );
  const handleLoad = () => {
    props.setLoading(false);
  };
  const handleEnlarge = () => {
    setIsEnlarged(!isEnlarged);
    setVisible(!visible);
  };
  const handleDelete = () => {
    // console.log(props.index);
    props.setImagesBase64(prev => prev.filter((item, index)=>index!==props.index));
    props.setFormData(prev => ({
      ...prev,
      imgurl:prev.imgurl.filter((item,index)=>index!==props.index)
    }));
  }
  return (
      props.loading ? (
          <Box variant="p">{'Loading...'}</Box>
        ):
         <Box textAlign="left">
          <div style={ {borderStyle:"solid",borderRadius:'5px', borderColor:'#0972d3'}}>
          <img src={props.src} alt={props.alt} 
          style={{
            maxWidth: '256px',
            cursor: 'pointer',
          }}
          onClick={handleEnlarge}
          onLoad={handleLoad} /> 
          </div>
          {
            isEnlarged&&
            <Modal
            size="large"
            onDismiss={() => 
              { setVisible(false);
                setIsEnlarged(false);
              }}
            visible={visible}
          >
           <img src={props.src} alt={props.alt} 
            style={{
              maxWidth: '100%',
            }}
           />
          </Modal>
        }
        <Button disabled={props.readOnly} variant="icon" iconName="close" onClick={handleDelete} />
        </Box>
  );

}

const  base64toFiles =(images_base64) =>{
  return images_base64.map( (base64Data,key) =>{
    const binaryString = window.atob(base64Data); // 将 base64 字符串解码为二进制字符串
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' }); 
      // Create a new File object from the Blob
      return new File([blob], `image_${key}.png`, { type: 'image/png' });
  });
}


const ImagePreview = ({ formData, setFormData,alt,imagesBase64,setImagesBase64, loading, setLoading,readOnly}) => {
  const sample_imgs_base64 = base64toFiles(imagesBase64);
  const srcs = sample_imgs_base64.map(image => URL.createObjectURL(image))
  return (
    <SpaceBetween size="m" direction="horizontal">
      {srcs.map((src,key) => (
        <Box key={key} textAlign="left">
         <ImageEnlargeComp readOnly={readOnly} 
         src={src} 
         index={key} 
         loading={loading} 
         alt={alt} 
         setLoading={setLoading} 
         setImagesBase64={setImagesBase64}
         setFormData={setFormData}/>
        </Box>
      ))}
    </SpaceBetween>
  );
};

export const ImageReadOnlyPreviewComp = ({ formData,setFormData}) => {
  const [imagesBase64, setImagesBase64] = useState(formData.images_base64??[]);
  const [loading,setLoading ] = useState(false);

  const sample_imgs_base64 = base64toFiles(imagesBase64);
  const srcs = sample_imgs_base64.map(image => URL.createObjectURL(image))
  return (
    <SpaceBetween size="m" direction="horizontal">
      {srcs.map((src,key) => (
        <Box key={key} textAlign="left">
         <ImageEnlargeComp 
         src={src} 
         index={key} 
         loading={loading}
         setLoading={setLoading} 
         alt={'alt'} 
         setImagesBase64={setImagesBase64}
         setFormData={setFormData}/>
        </Box>
      ))}
    </SpaceBetween>
  );


}
