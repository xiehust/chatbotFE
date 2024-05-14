// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState,useRef } from "react";
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
import { useAuthUserInfo, useAuthToken } from "../commons/use-auth";
import { models } from "../../common/shared";
import { useLocalStorage } from "../../common/localStorage";
import { listTemplate, uploadS3,uploadFile } from "../commons/api-gateway";
import { params_local_storage_key } from "./common-components";

const default_bucket = process.env.REACT_APP_DEFAULT_UPLOAD_BUCKET;
export const defaultModelParams = {
  temperature: 0.1,
  max_tokens: 1024,
  model_name: models[0].value,
  model_name_opt: models[0],
  use_qa: true,
  multi_rounds:false,
  // embedding_model_name: embeddings[0].value,
  // embedding_model_name_opt: embeddings[0],
  obj_prefix: "ai-content/",
  system_role: "",
  system_role_prompt: "",
  template_id: "default",
  template_opt: { label: "default", value: "default" },
  // template_id: "1698905450793-bcfab8",
  // template_opt: { label: "sso-chatbot-1102", value: "1698905450793-bcfab8" },
  hide_ref: false,
  use_stream:true,
  use_trace:false,
};

function generateId() {
  const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
  const randomNumber = Math.random().toString(16).slice(2, 8);
  return `${timestamp}-${randomNumber}`;
}

const ExpandableSettingPanel = () => {
  const { t } = useTranslation();

  const userinfo = useAuthUserInfo();
  const username = userinfo?.username || "default";
  const company = userinfo?.company || "default";
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + username,
    null
  );
  // console.log('localStoredParams:',localStoredParams);
  const [selectedOption, setSelectedOption] = useState(
    localStoredParams?.model_name_opt || defaultModelParams.model_name_opt
  );
  // const [embselectedOption, setembSelectedOption] = useState(
  //   localStoredParams?.embedding_model_name_opt ||
  //     defaultModelParams.embedding_model_name_opt
  // );
  const [tokenSize, settokenSize] = useState(
    localStoredParams?.max_tokens || defaultModelParams.max_tokens
  );
  const [temperatureValue, setTempValue] = useState(
    localStoredParams?.temperature || defaultModelParams.temperature
  );
  const [systemRoleValue, setSystemRoleValue] = useState(
    localStoredParams?.system_role === undefined
    ? defaultModelParams.system_role
    : localStoredParams?.system_role
  );
  const [systemRolePromptValue, setSystemRolePromptValue] = useState(
    localStoredParams?.system_role_prompt === undefined
          ? defaultModelParams.system_role_prompt
          : localStoredParams?.system_role_prompt,
  );
  const { setMsgItems, msgItems,setModelParams, setImg2txtUrl} = useChatData();
  const [alldocs, setAlldocs] = useState([]);

  const [selectTemplate, setSelectTemplate] = useState(
    localStoredParams?.template_opt || defaultModelParams.template_opt
  );
  

  const [loadStatus, setLoadStatus] = useState("loading");
  const token = useAuthToken();
  const main_fun_arn = localStoredParams?.main_fun_arn;
  const apigateway_endpoint = localStoredParams?.apigateway_endpoint;
  const queryParams = {
    main_fun_arn: main_fun_arn,
    apigateway_endpoint: apigateway_endpoint,
    company:company,
  };

  const handleLoadItems = async ({
    detail: { filteringText, firstPage, samePage },
  }) => {
    const headers = {
      Authorization: token.token,
    };
    setLoadStatus("loading");
    try {
      const data = await listTemplate(headers, queryParams);
      let items = data.body.map((it) => ({
        template_name: it.template_name.S,
        id: it.id.S,
        username: it.username.S,
      }));
      items.sort((a,b) => a.template_name > b.template_name ?1:-1);
      items.unshift({
        id: defaultModelParams.template_id,
        template_name: defaultModelParams.template_id,
        username: "system",
      });
      setAlldocs(items);
      setLoadStatus("finished");
    } catch (error) {
      console.log(error);
      setLoadStatus("error");
    }
  };


  useEffect(() => {
    setLocalStoredParams({
      ...localStoredParams,
      system_role:
        localStoredParams?.system_role === undefined  || localStoredParams?.system_role === ''
          ? defaultModelParams.system_role
          : localStoredParams.system_role,
      use_qa:
        localStoredParams?.use_qa === undefined
          ? defaultModelParams.use_qa
          : localStoredParams?.use_qa,
      multi_rounds:
          localStoredParams?.multi_rounds === undefined
            ? defaultModelParams.multi_rounds
            : localStoredParams?.multi_rounds,
      hide_ref:
        localStoredParams?.hide_ref === undefined
          ? defaultModelParams.hide_ref
          : localStoredParams?.hide_ref,
      system_role_prompt:
        localStoredParams?.system_role_prompt === undefined || localStoredParams?.system_role_prompt === ''
          ? defaultModelParams.system_role_prompt
          : localStoredParams?.system_role_prompt,
      obj_prefix:
        (localStoredParams?.obj_prefix === undefined || localStoredParams?.obj_prefix === '')
          ? defaultModelParams.obj_prefix
          : localStoredParams?.obj_prefix,
      use_stream:
          localStoredParams?.use_stream === undefined
            ? defaultModelParams.use_stream
            : localStoredParams?.use_stream,
      
    });
  }, []);

  // console.log('modelParams:',modelParams);

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

        <FormField label={t("system_role")}>
          <Input
            onChange={({ detail }) => {
              setSystemRoleValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                system_role: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                system_role: detail.value,
              });
            }}
            value={systemRoleValue}
          />
        </FormField>
        <FormField label={t("system_role_prompt")}>
          <Input
            onChange={({ detail }) => {
              setSystemRolePromptValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                system_role_prompt: detail.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                system_role_prompt: detail.value,
              });
            }}
            value={systemRolePromptValue}
          />
        </FormField>
        <FormField label={t("prompt_template")}>
          <Select
            statusType={loadStatus}
            onLoadItems={handleLoadItems}
            selectedOption={selectTemplate}
            onChange={({ detail }) => {
              setSelectTemplate(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                template_id: detail.selectedOption.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                template_id: detail.selectedOption.value,
                template_opt: detail.selectedOption,
              });
            }}
            options={alldocs.map(({ template_name, id, username }) => ({
              label: `${template_name}[${id}]`,
              value: id,
            }))}
            selectedAriaLabel="Selected"
          />
        </FormField>
      </ColumnLayout>
    </ExpandableSection>
  );
};

const PromptPanel = ({ sendMessage }) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const [promptValue, setPromptValue] = useState("");
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
    setHideRefDoc,
    newChatLoading, 
    setNewChatLoading,
    useTrace,
    setUseTrace,
    enableSearch,
    setEnableSearch
  } = useChatData();
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key + userinfo.username,
    null
  );

  const [localStoredMsgItems, setLocalStoredMsgItems] = useLocalStorage(
    params_local_storage_key + '-msgitems-'+userinfo.username,
    []
  );

  const [checked, setChecked] = useState(
    localStoredParams?.use_qa !== undefined
      ? localStoredParams?.use_qa
      : defaultModelParams.use_qa
  );
  const [multiRoundsChecked, setMultiRoundsChecked] = useState(
    localStoredParams?.multi_rounds !== undefined
      ? localStoredParams?.multi_rounds
      : defaultModelParams.multi_rounds
  );

  const [hideRefchecked, setRefDocChecked] = useState(
    localStoredParams?.hide_ref !== undefined
      ? localStoredParams?.hide_ref
      : defaultModelParams.hide_ref
  );

  const [useStreamChecked, setUseStreamChecked] = useState(
    localStoredParams?.use_stream !== undefined
      ? localStoredParams?.use_stream
      : defaultModelParams.use_stream
  );

  useEffect(() => {
    setModelParams({
      ...localStoredParams,
      obj_prefix:
        localStoredParams?.obj_prefix || defaultModelParams.obj_prefix,
      max_tokens:
        localStoredParams?.max_tokens || defaultModelParams.max_tokens,
      temperature:
        localStoredParams?.temperature || defaultModelParams.temperature,
      use_qa:
        localStoredParams?.use_qa !== undefined
          ? localStoredParams?.use_qa
          : defaultModelParams.use_qa,
      multi_rounds:
          localStoredParams?.multi_rounds !== undefined
            ? localStoredParams?.multi_rounds
            : defaultModelParams.multi_rounds,
      use_stream:
          localStoredParams?.use_stream !== undefined
            ? localStoredParams?.use_stream
            : defaultModelParams.use_stream,
      use_trace:
          localStoredParams?.use_trace !== undefined
            ? localStoredParams?.use_trace
            : defaultModelParams.use_trace,
      model_name:
        localStoredParams?.model_name || defaultModelParams.model_name,
      system_role:
        localStoredParams?.system_role || defaultModelParams.system_role,
      system_role_prompt:
        localStoredParams?.system_role_prompt ||
        defaultModelParams.system_role_prompt,
      template_id:
        localStoredParams?.template_id || defaultModelParams.template_id,
      username: userinfo?.username,
      company:userinfo?.company || "default",
      feedback:null,
    });
  }, []);


  const [autoSuggest, setAutoSuggest] = useState(false);
  const onSubmit = (values,imgUrl=null) => {
    setStopFlag(true);
    const prompt = values.trimEnd();
    if (prompt === "") {
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
    const params = {...modelParams,imgurl:img2txtUrl}
    sendMessage({
      action: "sendprompt",
      payload: { msgid: respid, messages: messages, params: params },
    });
    console.log("modelParams:", params);
    setPromptValue("");
  };

  return (
    <Container footer={<ExpandableSettingPanel />}>
     {/* <Container> */}
      <FormField
        stretch={true}
        // label={t('prompt_label')}
      >
      <SpaceBetween size="s">

      <Grid gridDefinition={[{ colspan: 9 }, { colspan: 3 }]}>
          
          {autoSuggest?
          //<SpaceBetween size="xs" direction="horizontal"> 
          <Grid gridDefinition={[{ colspan: 10 }, { colspan: 2 }]}>
          <ExampleQuery value={promptValue} setValue={setPromptValue} onSubmit={onSubmit}/>
          <Checkbox
            onChange={({ detail }) =>
            setAutoSuggest(detail.checked)
            }
            checked = {autoSuggest}
          >{t('auto_suggestion')}</Checkbox>
          </Grid>
          //</SpaceBetween> 
          :
          <Grid gridDefinition={[{ colspan: 10 }, { colspan: 2 }]}>
          <Textarea
            value={promptValue}
            disabled={stopFlag || newChatLoading}
            onChange={(event) => setPromptValue(event.detail.value)}
            onKeyDown={(event) => {
              if (event.detail.key === "Enter" && !event.detail.ctrlKey) {
                onSubmit(promptValue);
              }
            }}
            placeholder="Enter to send"
            autoFocus
            rows={1}
          />
            <Checkbox
            onChange={({ detail }) =>
            setAutoSuggest(detail.checked)
            }
            checked = {autoSuggest}
          >{t('auto_suggestion')}</Checkbox>
          </Grid>
          }
          
          <SpaceBetween size="xs" direction="horizontal">
          <ImageUploadComp id={'chat'} />
            <Button
              variant="primary"
              loading={stopFlag&&!newChatLoading}
              disabled={newChatLoading}
              onClick={(event) => onSubmit(promptValue)}
            >
              {t("send")}
            </Button>
            <Button
              loading={newChatLoading}
              iconName="remove" variant="icon"
              onClick={() => {
                setNewChatLoading(true);
                onSubmit("/rs");
                setImg2txtUrl(null);
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
                  setChecked(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    use_qa: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    use_qa: detail.checked,
                  });
                }}
                checked={checked}
              >{t("use_qa")}</Toggle>
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

            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setRefDocChecked(detail.checked);
                  setHideRefDoc(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    hide_ref: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    hide_ref: detail.checked,
                  });
                }}
                checked={hideRefchecked}
              >{t("hide_ref_doc")}</Toggle>
            </FormField>
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setUseTrace(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    use_trace: detail.checked,
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    use_trace: detail.checked,
                  });
                }}
                checked={useTrace}
              >{t("use_trace")}</Toggle>
            </FormField>
            <FormField >
              <Toggle
                onChange={({ detail }) => {
                  setEnableSearch(detail.checked);
                  setModelParams((prev) => ({
                    ...prev,
                    feature_config: detail.checked?'default':'search_disabled',
                  }));
                  setLocalStoredParams({
                    ...localStoredParams,
                    enableSearch: detail.checked,
                  });
                }}
                checked={enableSearch}
              >{t("enable_search")}</Toggle>
            </FormField>

          </SpaceBetween>
      </SpaceBetween>
      
      </FormField>
    </Container>
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
        // console.log('images_base64:',images_base64);
        setLocalStoredMsgItems([
          ...msgItems,
          {
            id: msgid,
            who: userinfo.username,
            text: 'images',
            // images_base64: images_base64
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
            e ? '' : '',
          dropzoneText: (e) =>
            e ? "Drop files to upload" : "Drop file to upload",
          removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
          limitShowFewer: "Show fewer files",
          limitShowMore: "Show more files",
          errorIconAriaLabel: "Error",
        }}
      />
    </SpaceBetween>
  )
}

const ExampleQuery = ({value, setValue,onSubmit}) => {
  // const [value, setValue] = useState("");
  const [loadingStatus, setLoadStatus]  = useState('loading');
  const [options, setOptions] = useState([])
  const handleLoadItems = async ({
    detail: { filteringText, firstPage, samePage },
  }) => {
      setLoadStatus("loading");
      fetch('/faq_examples.txt').then(
        response=>response.text()
      ).then(data =>{
        const lines = data.split('\n');
        // console.log(lines);
        setOptions(lines.map(it =>({value:it, label:it})));

        setLoadStatus("finished");
      }).catch(error =>{
        console.log(error);
        setLoadStatus("error");
      })
  };

  const enteredTextLabel = value => `"${value}"`;


  return (
    <Autosuggest
      onChange={({ detail }) => setValue(detail.value)}
      enteredTextLabel = {enteredTextLabel}
      onLoadItems = {handleLoadItems}
      value={value}
      statusType = {loadingStatus}
      options={options}
      autoFocus
      ariaLabel="Autosuggest example with values and labels"
      placeholder="Input your question and press enter"
      empty=""
      onKeyDown={(event) => {
              if (event.detail.key === "Enter" && !event.detail.ctrlKey) {
                onSubmit(value);
              }
      }}
    />
  );
}
export default PromptPanel;
