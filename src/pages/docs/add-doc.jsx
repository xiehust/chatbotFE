// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState,useEffect } from "react";
import {
    FormField,
    FileUpload,
    Box,
    SpaceBetween,
    Button,
    Modal,
  } from "@cloudscape-design/components";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "../../common/localStorage";
import {params_local_storage_key} from "../chatbot/common-components";
import { useAuthUserInfo } from "../commons/use-auth";
import { uploadS3 } from "../commons/api-gateway";
import {useSimpleNotifications} from '../commons/use-notifications';



const SettingsPanel = ()=>{
    const { t } = useTranslation();
    const userinfo = useAuthUserInfo();
    const { setNotificationItems } = useSimpleNotifications();

    const username = userinfo?.username || 'default';
    const [localStoredParams] = useLocalStorage(
      params_local_storage_key+username,
      null
    );
    const [helperMsg, setHelperMsg] = useState(".pdf,.txt,.faq,.md,.example,.examples");
    const [uploadErrtxt, setUploadErr] = useState();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleUpload = () =>{
      setHelperMsg('');
      files.map( file =>{
        const msgid = `msg-${Math.random().toString(8)}`;
        setLoading(true);
        console.log('localStoredParams:',localStoredParams);
        if (localStoredParams.ak && localStoredParams.sk&&localStoredParams.obj_prefix
                 && localStoredParams.s3_bucket && localStoredParams.s3_region){
          uploadS3(file,
            localStoredParams.s3_bucket,
            localStoredParams.obj_prefix,
            localStoredParams.s3_region,
            localStoredParams.ak,
            localStoredParams.sk
            ).then(()=>{
              setLoading(false);
              setHelperMsg(prev => (prev+` Upload ${file.name} success`));
              setFiles([]);
              setNotificationItems((item) => [
                ...item,
                {
                  header: t('upload_file'),
                  type: "success",
                  content: t('upload_file')+`:${localStoredParams.s3_bucket}/${localStoredParams.obj_prefix}${file.name}`,
                  dismissible: true,
                  dismissLabel: "Dismiss message",
                  onDismiss: () =>
                    setNotificationItems((items) =>
                      items.filter((item) => item.id !== msgid)
                    ),
                  id: msgid,
                },
              ]);

            }).catch(error =>{
              console.log(error);
              setLoading(false);
              setUploadErr(`Upload ${file.name} error`);
              setFiles([]);
            })
        }else{
          setLoading(false);
          setUploadErr(`Missing parameters, please check the setting panel`);
          setFiles([]);
        }
      })
    }
    useEffect(() => {
      
      }, []);

    return (
        <SpaceBetween direction="vertical" size="l">
          <FileUpload
            onChange={({ detail }) =>{
              setHelperMsg('');
             setFiles(detail.value);
            //  console.log(detail.value);
             setUploadErr(null);
             }
             }
            value={files}
            accept='.pdf,.txt,.faq,.md,.example,.examples'
            multiple
            constraintText = {helperMsg}
            showFileLastModified
            showFileSize
            showFileThumbnail
            tokenLimit={3}
            errorText={uploadErrtxt}
            i18nStrings={{
          uploadButtonText: e =>
            e ? t("choose_files") : t("choose_file"),
          dropzoneText: e =>
            e
              ? "Drop files to upload"
              : "Drop file to upload",
          removeFileAriaLabel: e =>
            `Remove file ${e + 1}`,
          limitShowFewer: "Show fewer files",
          limitShowMore: "Show more files",
          errorIconAriaLabel: "Error"
        }}
          />
           <Button  variant="normal"
           loading  = {loading}
           onClick={handleUpload}
            >
              {t("upload")}
            </Button>

</SpaceBetween>
    );
}

const AddDocModal =({visible,setVisible}) =>{
    const { t } = useTranslation();
    return (
        <Modal
          onDismiss={() => setVisible(false)}
          visible={visible}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={ ()=> setVisible(false)}>{t('close')}</Button>
                <Button variant="primary" href = '#' onClick={ ()=> setVisible(false)}>{t('confirm')}</Button>
              </SpaceBetween>
            </Box>
          }
          header={t('upload')}
        >
          <SettingsPanel/>
        </Modal>
      );
}

export default AddDocModal;