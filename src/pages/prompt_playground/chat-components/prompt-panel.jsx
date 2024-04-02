// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState, useRef, useContext } from "react";
import {
  FormField,
  Container,
  Grid,
  Textarea,
  SpaceBetween,
  Toggle,
  Input,
  Button,
  FileUpload,
  ExpandableSection,
  Select,
  ColumnLayout,
  Autosuggest,
  Checkbox,
} from "@cloudscape-design/components";

import { useChatData, generateUniqueId } from "./common-components";
import { useTranslation } from "react-i18next";
import { useAuthUserInfo, useAuthToken } from "../../commons/use-auth";
import { models } from "../../../common/shared";
import { useLocalStorage } from "../../../common/localStorage";
import { getPrompts, uploadS3, uploadFile } from "../../commons/api-gateway";
import { params_local_storage_key } from "./common-components";
import { AddVariablesComp, OpeningQuesionsComp, TemplateEditor, previewTemplate,ImageReadOnlyPreviewComp } from "../../prompt_hub/common-components";


const default_bucket = process.env.REACT_APP_DEFAULT_UPLOAD_BUCKET;
export const defaultModelParams = {
  temperature: 0.01,
  max_tokens: 3000,
  model_name: models[0].value,
  model_name_opt: models[0],
  use_qa: false,
  multi_rounds: true,
  obj_prefix: "ai-content/",
  system_role: "",
  system_role_prompt: "",
  template_id: "empty",
  template_opt: { label: "default", value: "default" },
  hide_ref: false,
  use_stream: true,
  use_trace: true,
};



function generateId() {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`;
}

const ExpandableSettingPanel = ({ id }) => {
  const { t } = useTranslation();
  const { formData } = useChatData();
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || "default";
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  const [selectedOption, setSelectedOption] = useState(
    localStoredParams?.model_name_opt || defaultModelParams.model_name_opt
  );

  const [tokenSize, settokenSize] = useState(
    localStoredParams?.max_tokens || defaultModelParams.max_tokens
  );
  const [temperatureValue, setTempValue] = useState(
    localStoredParams?.temperature || defaultModelParams.temperature
  );
  const { setModelParams } = useChatData();
  useEffect(() => {
    setLocalStoredParams({
      ...localStoredParams,
      multi_rounds:
        localStoredParams?.multi_rounds === undefined
          ? defaultModelParams.multi_rounds
          : localStoredParams?.multi_rounds,
      obj_prefix: defaultModelParams.obj_prefix,
      use_stream:
        localStoredParams?.use_stream === undefined
          ? defaultModelParams.use_stream
          : localStoredParams?.use_stream,
    });
  }, []);

  useEffect(() => {
    setModelParams({
      ...localStoredParams,
      obj_prefix: defaultModelParams.obj_prefix,
      max_tokens:
        localStoredParams?.max_tokens || defaultModelParams.max_tokens,
      temperature:
        localStoredParams?.temperature || defaultModelParams.temperature,
      use_qa: false,
      hide_ref: true,
      multi_rounds:
        localStoredParams?.multi_rounds !== undefined
          ? localStoredParams?.multi_rounds
          : defaultModelParams.multi_rounds,
      use_stream:
        localStoredParams?.use_stream !== undefined
          ? localStoredParams?.use_stream
          : defaultModelParams.use_stream,
      use_trace: defaultModelParams.use_trace,
      model_name:
        localStoredParams?.model_name || defaultModelParams.model_name,
      system_role:
        localStoredParams?.system_role || defaultModelParams.system_role,
      system_role_prompt: formData.system_role_prompt,
      template_id: defaultModelParams.template_id,
      username: userinfo?.username,
      company: userinfo?.company || "default",
      history_messages:formData.history_messages&&Object.keys(formData.history_messages).map(key => formData.history_messages[key]),
      feedback: null,
    });
  }, [formData]);

  return (
    <ExpandableSection headerText={t("addtional_settings")} variant="footer">
      <ColumnLayout borders="vertical" columns="3" variant="text-grid">
        <FormField label={t("model_name")}>
          <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
              setSelectedOption(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                model_name: detail.selectedOption.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                model_name: detail.selectedOption.value,
                model_name_opt: detail.selectedOption,
              });
            }}
            options={models}
            selectedAriaLabel="Selected"
          />
        </FormField>
        <FormField label={t("max_tokens")}>
          <Input
            onChange={({ detail }) => {
              settokenSize(detail.value);
              setModelParams((prev) => ({
                ...prev,
                max_tokens: parseInt(detail.value),
              }));
              setLocalStoredParams({
                ...localStoredParams,
                max_tokens: parseInt(detail.value),
              });
            }}
            value={tokenSize}
            inputMode="numeric"
          />
        </FormField>
        <FormField label={t("temperature")}>
          <Input
            onChange={({ detail }) => {
              setTempValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                temperature: parseFloat(detail.value),
              }));
              setLocalStoredParams({
                ...localStoredParams,
                temperature: parseFloat(detail.value),
              });
            }}
            value={temperatureValue}
            inputMode="decimal"
          />
        </FormField>
      </ColumnLayout>

    </ExpandableSection>
  );
};

const ImageUploadComp = ({ id }) => {
  const { t } = useTranslation();
  const { setMsgItems, msgItems, setImg2txtUrl, setStopFlag, setLoading } = useChatData();
  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || "default";
  const company = userinfo?.company || "default";
  const filesMetaRef = useRef();
  const [localStoredMsgItems, setLocalStoredMsgItems] = useLocalStorage(
    params_local_storage_key + userinfo.username+`-msgitems-` + id,
    []
  );
  const [uploadErrtxt, setUploadErr] = useState();
  const [uploadComplete, setUploadComplete] = useState(false);
  const [files, setFiles] = useState([]);
  // const [filesMeta, setFilesMeta] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [helperMsg, setHelperMsg] = useState('');
  const token = useAuthToken();
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
            setImg2txtUrl(prev =>
              [...prev,
              `${default_bucket}/images/${company}/${username}/${file.name}`
              ]
            );

            setUploadComplete(true);
            setFiles([]);

          })
          .catch((error) => {
            console.log(error);
            setImg2txtUrl([]);
            setLoading(false);
            setUploadErr(`Upload ${file.name} error`);
            setFiles([]);
            setStopFlag(false);
          });
      }
    });
    Promise.all(promises)
      .then(async () => {
        setStopFlag(false);
        const msgid = `image-${generateId()}`;
        //转成二进制string存入到local storage中
        const images_base64 = await Promise.all(imageFiles.map(async file => {
          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return base64Data;
        }));

        setMsgItems(
          (prev) => [
            ...prev,
            {
              id: msgid,
              who: userinfo.username,
              text: 'images',
              images: imageFiles,
              // images_base64: images_base64
            },
          ] //创建一个新的item
        );
        // console.log('msgItems:',msgItems);
        setLocalStoredMsgItems([
          ...msgItems,
          {
            id: msgid,
            who: userinfo.username,
            text: 'images',
            // images_base64: images_base64 //exceed the localstorage quota
          },
        ]);
      })
      .catch((error) => {
        console.error('Error uploading files:', error);
      });
  }

  return (
    <SpaceBetween size="s">
      <FileUpload
        onChange={({ detail }) => {
          setHelperMsg("");
          setFiles(detail.value);
          // console.log(detail.value);
          setUploadErr(null);
          setUploadComplete(false);
          setImg2txtUrl([]);
          setStopFlag(true);
          handleImageUpload(detail.value);
        }}
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
            e ? t('image') : t('image'),
          dropzoneText: (e) =>
            e ? "Drop files to upload" : "Drop file to upload",
          removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
          limitShowFewer: "Show fewer files",
          limitShowMore: "Show more files",
          errorIconAriaLabel: "Error",
        }}
      />
      {/* <Button
        variant="icon"
        iconName="upload"
        loading={loading}
        disabled={uploadComplete}
        onClick={handleImageUpload}
      /> */}
    </SpaceBetween>
  )
}

const VariablesComp = ({ id }) => {
  const { t } = useTranslation();

  // const {formData, setFormData} = useTemplateFormCtx();
  const { formData, setFormData, setModelParams } = useChatData();

  return (
    <ExpandableSection
      defaultExpanded
      headerText={t('pe_config')}
    >
      {formData &&
        <Grid gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}>
          <AddVariablesComp formData={formData} setFormData={setFormData} />
          <SpaceBetween size="l">
              <OpeningQuesionsComp  formData={formData} setFormData={setFormData}/>
            <FormField label={t("prompt_content")} >
              <TemplateEditor value={formData.template}
                onChange={(event) => {
                  setFormData((prev) => ({ ...prev, template: event.detail.value }));
                }
                } />
            </FormField>
            <ImageReadOnlyPreviewComp formData={formData} setFormData={setFormData}/>
          </SpaceBetween>
        </Grid>}
    </ExpandableSection>
  )
}

const PromptPanel = ({ sendMessage, id }) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const token = useAuthToken();
  const headers = { Authorization: token.token }
  const [promptValue, setPromptValue] = useState("");

  // const [formData, setFormData] = useState();
  const {
    modelParams,
    msgItems,
    setMsgItems,
    setLoading,
    setModelParams,
    conversations,
    setConversations,
    img2txtUrl,
    setImg2txtUrl,
    stopFlag,
    setStopFlag,
    newChatLoading,
    setNewChatLoading,
    formData,
    setFormData,
  } = useChatData();

  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + userinfo.username,
    null
  );

  const [localStoredMsgItems, setLocalStoredMsgItems] = useLocalStorage(
    params_local_storage_key + userinfo.username+'-msgitems-' + id,
    []
  );

  const [multiRoundsChecked, setMultiRoundsChecked] = useState(
    localStoredParams?.multi_rounds !== undefined
      ? localStoredParams?.multi_rounds
      : defaultModelParams.multi_rounds
  );

  const [useStreamChecked, setUseStreamChecked] = useState(
    localStoredParams?.use_stream !== undefined
      ? localStoredParams?.use_stream
      : defaultModelParams.use_stream
  );

  // useEffect(() => {
  //   getPrompts(headers, { id: id }).then(data => {
  //     setFormData(data);
  //   }).catch(err => {
  //     console.log(err);
  //   })
  // }, []);

  const onSubmit = (values, imgUrl = null) => {
    setStopFlag(true);
    const prompt = values.trimEnd();
    if (prompt === "") {
      setStopFlag(false);
      return;
    }
    const respid = generateUniqueId();
    setMsgItems((prev) => [
      ...prev,
      { id: respid, who: userinfo.username, text: prompt },
    ]);

    //save the messages to localstorage
    // console.log(msgItems);
    setLocalStoredMsgItems([
      ...msgItems,
      { id: respid, who: userinfo.username, text: prompt },
    ])

    setConversations((prev) => [...prev, { role: "user", content: prompt }]);
    const messages = [...conversations, { role: "user", content: prompt }];
    setLoading(true);
    const params = { ...modelParams, imgurl: img2txtUrl };
    console.log("PromptPanel modelParams:", params);

    sendMessage({
      action: "sendprompt",
      payload: { msgid: respid, messages: messages, params: params },
    });
    setPromptValue("");
  };

  return (
    //formData&&<PromptTemplateFormCtx.Provider  value = {{formData, setFormData}}>
    formData && <Container>
      <FormField
        stretch={true}
      >
        <SpaceBetween size="s">

          <Grid gridDefinition={[{ colspan: 9 }, { colspan: 3 }]}>
            <Textarea
              value={promptValue}
              disabled={stopFlag || newChatLoading}
              onChange={(event) => setPromptValue(event.detail.value)}
              onKeyDown={(event) => {
                if (event.detail.key === "Enter" && event.detail.ctrlKey) {

                  const fullPromptVal = previewTemplate(formData) + '\n' + promptValue
                  // console.log('fullPromptVal:',fullPromptVal);
                  onSubmit(fullPromptVal);
                }
              }}
              placeholder="Ctrl+Enter to send"
              autoFocus
              rows={1}
            />
            <SpaceBetween size="xs" direction="horizontal">
              <ImageUploadComp id={id} />
              <Button
                variant="primary"
                loading={stopFlag && !newChatLoading}
                disabled={newChatLoading}
                onClick={(event) => {
                  // console.log('formData:',formData);
                  const fullPromptVal = previewTemplate(formData) + '\n' + promptValue
                  // console.log('fullPromptVal:',fullPromptVal);
                  onSubmit(fullPromptVal);
                }}

              >
                {t("send")}
              </Button>
              <Button
                iconName="remove" variant="icon"
                loading={newChatLoading}
                onClick={() => {
                  setNewChatLoading(true);
                  onSubmit("/rs");
                  setImg2txtUrl([]);
                  setConversations([]);
                  setMsgItems([]);
                  setLocalStoredMsgItems([]);
                  setLoading(false);
                }}
              >
                {t("new_chat")}
              </Button>
            </SpaceBetween>
          </Grid>
          <SpaceBetween size="xl" direction="horizontal">
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setUseStreamChecked(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    use_stream: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    use_stream: detail.checked,
                  });
                }}
                checked={useStreamChecked}
              >{t("use_stream")}</Toggle>
            </FormField>
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setMultiRoundsChecked(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    multi_rounds: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    multi_rounds: detail.checked,
                  });
                }}
                checked={multiRoundsChecked}
              >{t("multi_rounds")}</Toggle>
            </FormField>

          </SpaceBetween>
          <ExpandableSettingPanel id={id} />
          <VariablesComp id={id} />
        </SpaceBetween>

      </FormField>
    </Container>
    //</PromptTemplateFormCtx.Provider>
  );
};

export default PromptPanel;
