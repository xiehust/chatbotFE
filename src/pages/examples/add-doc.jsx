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
import { useAuthUserInfo ,useAuthToken} from "../commons/use-auth";
import { uploadS3 ,uploadFile} from "../commons/api-gateway";
import {useSimpleNotifications} from '../commons/use-notifications';

const default_bucket = process.env.REACT_APP_DEFAULT_UPLOAD_BUCKET;


const SettingsPanel = ()=>{
    const { t } = useTranslation();
    const userinfo = useAuthUserInfo();
    const { setNotificationItems } = useSimpleNotifications();
    const token = useAuthToken();
    const [catSelectedOption,setCatSelectedOption] = useState()
    const username = userinfo?.username || 'default';
    const company = userinfo?.company || 'default';
    const [localStoredParams] = useLocalStorage(
      params_local_storage_key+username,
      null
    );
    const [helperMsg, setHelperMsg] = useState(".pdf,.txt,.csv,.faq,.md,.example,.examples,.json,.wiki");
    const [uploadErrtxt, setUploadErr] = useState();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const handleUpload = () =>{
      setHelperMsg('');
      files.map( file =>{
        const msgid = `msg-${Math.random().toString(8)}`;
        setLoading(true);
        console.log('localStoredParams:',localStoredParams);
        if (localStoredParams?.ak && localStoredParams?.sk&&localStoredParams?.obj_prefix
                 && localStoredParams?.s3_bucket && localStoredParams?.s3_region){
          uploadS3(file,
            localStoredParams?.s3_bucket,
            localStoredParams?.obj_prefix+company+'/'+username+'/',
            {"username":username,"company":encodeURIComponent(company),"category":encodeURIComponent(catSelectedOption?.value??'')},
            localStoredParams?.s3_region,
            localStoredParams?.ak,
            localStoredParams?.sk,
            ).then(()=>{
              setLoading(false);
              setHelperMsg(prev => (prev+` Upload ${file.name} success`));
              setFiles([]);
              setNotificationItems((item) => [
                ...item,
                {
                  header: t('upload_file'),
                  type: "success",
                  content: t('upload_file')+`:${localStoredParams?.s3_bucket}/${localStoredParams?.obj_prefix}${company}/${username}/${file.name}`,
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
          console.log(`missing buckets params, using default bucket:${default_bucket} to upload`);
          // setHelperMsg(`missing buckets params, using default bucket`);
          //upload to default bucket

         

          // files.map( file => {
            const headers = {
              'Authorization': token.token,
              'Content-Type':file.type
            };
            // console.log(file);
            const read = new FileReader();
            read.readAsBinaryString(file);
            read.onloadend = function(){
              // console.log(read.result);

              const bits = read.result;
              const body = {
                 filename: file.name,
                 mimeType: file.type,
                 fileSizeBytes: file.size,
                 lastModified: file.lastModified,
                 buf: bits,
                 metadata: {"username":username,"company":encodeURIComponent(company),"category":encodeURIComponent(catSelectedOption?.value??'')}
              };

              uploadFile( username,company,body, headers)
              .then((response) => {
                setLoading(false);
                setHelperMsg(prev => (prev+` Upload ${file.name} success`));
                setFiles([]);
                setNotificationItems((item) => [
                  ...item,
                  {
                    header: t('upload_file'),
                    type: "success",
                    content: t('upload_file')+`:${default_bucket}/ai-content/${company}/${username}/${file.name}, ${default_bucket}/bedrock-kb-src/${company}/${username}/${file.name}`,
                    dismissible: true,
                    dismissLabel: "Dismiss message",
                    onDismiss: () =>
                      setNotificationItems((items) =>
                        items.filter((item) => item.id !== msgid)
                      ),
                    id: msgid,
                  },
                ]);

              })
              .catch((error) => {
                console.log(error);
                setLoading(false);
                setUploadErr(`Upload ${file.name} error`);
                setFiles([]);
              });
          }

          // })
          

        }
      })
    }
    useEffect(() => {
      
      }, []);

    const handleDownload = () => {
        // Send a request to the server to download the file
        fetch('./faq_template.csv')
          .then((response) => response.blob())
          .then((blob) => {
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `template-${new Date().getTime()}.csv`); 
            document.body.appendChild(link);
            link.click();
            link.remove();
          })
          .catch((error) => {
            console.error('Error downloading the file:', error);
          });
      };

    return (
        <SpaceBetween direction="vertical" size="l">
          <Button variant="link" 
            iconName="external"
            onClick={handleDownload}
          target="_blank"
          >{t('download_template')}</Button>
          <FileUpload
            onChange={({ detail }) =>{
              setHelperMsg('');
             setFiles(detail.value);
            //  console.log(detail.value);
             setUploadErr(null);
             }
             }
            value={files}
            accept='.pdf,.txt,.csv,.faq,.md,.example,.examples,.json,.wiki'
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
                {/* <Button variant="primary" href = '#' onClick={ ()=> setVisible(false)}>{t('confirm')}</Button> */}
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