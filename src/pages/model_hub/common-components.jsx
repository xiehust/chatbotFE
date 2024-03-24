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
  Link,
  Input,
  Select,
  Textarea,
  Multiselect,
  Header,
  Toggle,
  Checkbox,
  DatePicker,
  RadioGroup,
} from "@cloudscape-design/components";
import { TableHeader } from "../commons/common-components";
import { useTranslation, Trans } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import { params_local_storage_key } from "../chatbot/common-components";
import { deleteModelCard } from "../commons/api-gateway";
import { useAuthorizedHeader, useAuthUserInfo } from "../commons/use-auth";
import { useSimpleNotifications } from '../commons/use-notifications';
import { MODEL_TYPE_LIST, GEO_CATS, MODEL_SIZE_LIST,HW_LIST,QUANT_METHOD ,MODEL_DEPLOY_MODE_LIST,
  CODE_TYPE_LIST,FRAMEWORK_TYPE_LIST} from './table-config';
import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dawn.css';
import 'ace-builds/css/theme/tomorrow_night_bright.css';

// const ace = await import('ace-builds');
// ace.config.set('useStrictCSP', true);
export const addModelFormCtx = createContext();

export const useModelFormCtx = () => {
  return useContext(addModelFormCtx);
}

export function validateForm(props) {
  if (
    !props.model_name?.length ||
    !props.model_type||
    !props.model_size||
    !isURL(props.code_repo??'')||
    !props.code_type?.length||
    !props.model_deploy_mode?.length||
    !props.email?.length
      ) {
    return false;
  } else return true;
}

function isURL(url) {
  const startsWithGitHub = url.startsWith("https://");
  return startsWithGitHub;
}

function isGitHubNotebookURL(url) {
  // 检查URL是否以"https://github.com"开头
  const startsWithGitHub = url.startsWith("https://github.com");
  // 检查URL是否以".ipynb"结尾
  const endsWithIpynb = url.endsWith(".ipynb");
  return startsWithGitHub && endsWithIpynb;
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

export const Breadcrumbs = () => {
  const { t, i18n } = useTranslation();
  const breadcrumbs = [
    {
      text: t("awschatportal"),
      href: "/model_hub",
    },
    {
      text: t("model_hub"),
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
          text: t("model_hub"),
          href: "/model_hub",
        },
        {
          text: id,
          href: "/model_hub/" + id,
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
    deleteModelCard(headers, payload)
      .then(res => {
        setNotificationItems((item) => [
          ...item,
          {
            header: t('delete_model'),
            type: "success",
            content: t('delete_model') + ' success',
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
            header: t("delete_model"),
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
      {t('delete_model') + ':' + selectItem?.template_name}
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
            <Button
              disabled={!isOnlyOneSelected || userinfo.groupname != 'admin'}
              name="delete"
              onClick={deleteAction}
            >
              {t('delete')}
            </Button>
            <Button
              href={'/model_hub/create'}
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
  const { formData, setFormData, inValid, setInvalid } = useContext(addModelFormCtx);
  const [codeRepoInValid, setCodeRepoInvalid] = useState(false);

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || 'default';
  const [localStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );

  return (
    <SpaceBetween size="l">
      <Container
        header={
          <Header variant="h3">
            {t('basic_info')}
          </Header>}
      >
        <SpaceBetween size="l">
          {/* <FormField label={t("select_geo_category")}>
            <GeoSelect readOnly={readOnly} />
          </FormField> */}
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
            {t('main_info')}
          </Header>}
      >
        <SpaceBetween size="l">
          <FormField label={t("model_size")}>
            <ModelSizeSelect readOnly={readOnly} />
          </FormField>
          <FormField label={t("model_type")}>
            <ModelTypeSelect readOnly={readOnly} />
          </FormField>
          <FormField
            label={t("model_name")}
            constraintText="Format e.g,{model_name}-{size}-{quantization_method}-{quant-bits}"
          >
            <Input
              invalid={inValid && !formData.model_name}
              readOnly={readOnly}
              placeholder="(Required)"
              value={formData.model_name}
              onChange={(event) => {
                !readOnlyWithErrors &&
                  setFormData((prev) => ({ ...prev, model_name: event.detail.value }));
                setInvalid(false);
              }
              }
            />
          </FormField>
          <FormField label={t("quant_method")}>
            <QuantMethodSelect readOnly={readOnly} />
          </FormField>

          <FormField label={t("description")} description="Introduction/Scenario/Pros and Cons, etc">
            <Textarea
              placeholder="Introduction/Scenario/Pros and Cons, etc"
              readOnly={readOnly}
              rows={3}
              value={formData.description}
              onChange={(event) =>
                !readOnlyWithErrors &&
                setFormData((prev) => ({ ...prev, description: event.detail.value }))
              }
            />
          </FormField>

          <FormField label={t("frame_work")}>
            <FrameworkTypeSelect readOnly={readOnly} />
          </FormField>
          <FormField label={t("deploy_mode")} description="(Required)">
            <DeployModeSelect readOnly={readOnly} />
          </FormField>
          <FormField label={t("code_type")} description="(Required)">
            <RepoCodeTypeSelect readOnly={readOnly} />
          </FormField>
          <FormField
            label={t("code_repo")}
            description="must starts with https://...."
          >
            {
              !readOnly?
            <Input
              // invalid={inValid && !formData.code_repo}
              invalid={codeRepoInValid || (inValid && !formData.code_repo)}
              readOnly={readOnly}
              placeholder="(Required)"
              value={formData.code_repo}
              onChange={(event) => {
                !readOnlyWithErrors &&
                  setFormData((prev) => ({ ...prev, code_repo: event.detail.value }));
                  setInvalid(false);
                  if (isURL(event.detail.value)){
                    setCodeRepoInvalid(false);
                    setInvalid(false);
                  }else{
                    setCodeRepoInvalid(true);
                    setInvalid(false);
                  }       
              }
              }
            />
            :
            <Link  external href={`${formData?.code_repo}`} >{formData?.code_repo}</Link>
          }
          </FormField>
          <FormField label={t("mini_hardware")} description="(Required)">
            <HwSelect readOnly={readOnly} />
          </FormField>
          <FormField
            label={t("model_published_date")}
            constraintText="Use YYYY/MM format."
        >
          <PublishDatePicker readOnly={readOnly} />
        </FormField>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}



const PublishDatePicker = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addModelFormCtx);
  const [value, setValue] = useState(formData.model_published_date);
  return (
    <DatePicker
        onChange={({ detail }) => {
          setValue(detail.value);
          setFormData((prev) => ({
            ...prev,
            model_published_date: detail.value,
          }));}}
          disabled={readOnly}
        value={value}
        openCalendarAriaLabel={selectedDate =>
          "Choose published date" +
          (selectedDate
            ? `, selected date is ${selectedDate}`
            : "")
        }
        granularity="month"
        placeholder="YYYY/MM"
      />
  )
}

const HwSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOptions, setSelectedOptions] = useState(formData.mini_hardware);
  return (
    <Multiselect
      invalid={inValid && !formData.mini_hardware?.length}
      disabled={readOnly}
      selectedOptions={selectedOptions}
      onChange={({ detail }) => {
        setSelectedOptions(detail.selectedOptions);
        setFormData((prev) => ({
          ...prev,
          mini_hardware: detail.selectedOptions,
        }));
      }}
      options={HW_LIST}
    />
  )
}

const RepoCodeTypeSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOptions, setSelectedOptions] = useState(formData.code_type);
  return (
    <Multiselect
      invalid={inValid && !formData.code_type?.length}
      disabled={readOnly}
      selectedOptions={selectedOptions}
      onChange={({ detail }) => {
        setSelectedOptions(detail.selectedOptions);
        setFormData((prev) => ({
          ...prev,
          code_type: detail.selectedOptions,
        }));
      }}
      options={CODE_TYPE_LIST}
    />
  )
}


const DeployModeSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOptions, setSelectedOptions] = useState(formData.model_deploy_mode);
  return (
    <Multiselect
     invalid={inValid && !formData.model_deploy_mode?.length}
      disabled={readOnly}
      selectedOptions={selectedOptions}
      onChange={({ detail }) => {
        setSelectedOptions(detail.selectedOptions);
        setFormData((prev) => ({
          ...prev,
          model_deploy_mode: detail.selectedOptions,
        }));
      }}
      options={MODEL_DEPLOY_MODE_LIST}
    />
  )
}


// const ModelTagsSelect = ({ readOnly }) => {
//   const { inValid, formData, setFormData } = useContext(addModelFormCtx);
//   const [selectedOptions, setSelectedOptions] = useState(formData.model_tags);
//   return (
//     <Multiselect
//       disabled={readOnly}
//       selectedOptions={selectedOptions}
//       onChange={({ detail }) => {
//         setSelectedOptions(detail.selectedOptions);
//         setFormData((prev) => ({
//           ...prev,
//           model_tags: detail.selectedOptions,
//         }));
//       }}
//       options={MODEL_TAG_LIST}
//     />
//   )
// }

const QuantMethodSelect = ({ readOnly }) => {
  const {  formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOption, setSelectedOption] = useState(formData.quant_method);
  return (
    <Select
      // invalid={inValid && !formData.model_size}
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          quant_method: detail.selectedOption,
        }));
      }}
      options={QUANT_METHOD}
      selectedAriaLabel="Selected"
    />
  )
}

const ModelSizeSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOption, setSelectedOption] = useState(formData.model_size);
  return (
    <Select
      invalid={inValid && !formData.model_size}
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          model_size: detail.selectedOption,
        }));
      }}
      options={MODEL_SIZE_LIST}
      selectedAriaLabel="Selected"
    />
  )
}

const ModelTypeSelect = ({ readOnly }) => {
  const { inValid, formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOption, setSelectedOption] = useState(formData.model_type);
  return (
    <Select
      invalid={inValid && !formData.model_type}
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          model_type: detail.selectedOption,
        }));
      }}
      options={MODEL_TYPE_LIST}
      selectedAriaLabel="Selected"
    />
  )
}

const FrameworkTypeSelect = ({ readOnly }) => {
  const { formData, setFormData } = useContext(addModelFormCtx);
  const [selectedOption, setSelectedOption] = useState(formData.framework_type);
  return (
    <Select
      disabled={readOnly}
      selectedOption={selectedOption}
      onChange={({ detail }) => {
        setSelectedOption(detail.selectedOption);
        setFormData((prev) => ({
          ...prev,
          framework_type: detail.selectedOption,
        }));
      }}
      options={FRAMEWORK_TYPE_LIST}
      selectedAriaLabel="Selected"
    />
  )
}


const GeoSelect = ({ readOnly }) => {
  const { formData, setFormData } = useContext(addModelFormCtx);

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
