// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState,useRef } from 'react';
import {Container,Header, SpaceBetween} from '@cloudscape-design/components';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// import { CopyBlock,a11yDark } from "react-code-blocks";

import {useChatData,generateUniqueId} from './common-components';
import { useTranslation } from "react-i18next";
import botlogo from "../../resources/Res_Amazon-SageMaker_Model_48_Light.svg";
import {useAuthToken} from '../commons/use-auth';
import useWebSocket from "react-use-websocket";
import { API_socket } from '../commons/api-gateway';
import PromptPanel from './prompt-panel';

import {
    Box,
    Stack,
    Avatar,
    List,
    ListItem,
  } from "@mui/material";
  import {  grey } from "@mui/material/colors";


const BOTNAME = "AI";
const MAX_CONVERSATIONS = 6;

function stringToColor(string) {
  let hash = 0;
  let i;
  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */
  return color;
}

function stringAvatar(name) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    //   children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
    children: name[0].toUpperCase() + name[name.length - 1].toUpperCase(),
  };
}

const CodeComponent= ({language,code}) => {
  // const codeString = '(num) => num + 1';
  return (
    <SyntaxHighlighter
     language={language} 
     showLineNumbers
     wrapLongLines
    style={a11yDark}>
      {code}
    </SyntaxHighlighter>
  );
};


function findCodeStarts(inputString) {
  const codeRegex = /```([\w+#-]+)?\n+/gm;
  const matches = codeRegex.exec(inputString);
  if (!matches) {
    return {_code:null, _before:inputString, _after:null, _languageType:null};
  }
  const [fullMatch, languageType] = matches;
  const _before = matches.input?.substring(0, matches.index);
  const _code = matches.input?.substring(matches.index + fullMatch.length);
  return {_code, _before, _languageType:languageType||'javascript'}
}

function extractCodeFromString(inputString) {
  const codeRegex = /```([\w+#-]+)?\n([\s\S]*?)\n```/gm;
  const matches = codeRegex.exec(inputString);
  if (!matches) {
    return {code:null, before:inputString, after:null, languageType:null};
  }
  const [fullMatch, languageType, code] = matches;
  const before = matches.input?.substring(0, matches.index);
  const after = matches.input?.substring(matches.index + fullMatch.length);
  return {code, before, after, languageType:languageType||'javascript'}
}

const formatHtmlLines = (text)=>{
  return text.split("\n").map((it,idx) => (
    <span key={idx}>
      {it}
      <br />
    </span>
  ));
}

const MsgItem = ({ who, text }) => {
  let newlines=[];
  if (who === BOTNAME){
    const {code, before, after, languageType} = extractCodeFromString(text);
    const {_code, _before,_languageType} = findCodeStarts(text);
    _code || newlines.push(formatHtmlLines(before))
    if (code){
      newlines.push(formatHtmlLines(before))
      code&&newlines.push(<CodeComponent key={generateUniqueId()}  language={languageType} code={code}/>)
      after&&newlines.push(formatHtmlLines(after))
    }else{
      if (_code){
          newlines.push(formatHtmlLines(_before))
          _code&&newlines.push(<CodeComponent key={generateUniqueId()}  language={_languageType} code={_code}/>)
      }else{
        // newlines = formatHtmlLines(text);
      }
    }
  }else{
    newlines = formatHtmlLines(text);
  }
  // console.log(newlines);

  return who !== BOTNAME ? (
    <ListItem sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
        <TextItem sx={{ bgcolor: '#f2fcf3',borderColor:'#037f0c' }}>{newlines}</TextItem>
        <Avatar {...stringAvatar(who)} />
      </Stack>
    </ListItem>
  ) : (
    <ListItem>
      <Stack direction="row" spacing={2} sx={{ alignItems: "top" }}>
        <Avatar src={botlogo} alt={"AIBot"} />
        <TextItem> {newlines}</TextItem>
      </Stack>
    </ListItem>
  );
};

const TextItem = (props) => {
  const { sx, ...other } = props;
  // console.log(other);
  return (
    <Box
      sx={{
        p: 1.2,
        // m: 1.2,
        whiteSpace: "normal",
        bgcolor: '#f2f8fd',
        color: grey[800],
        border: "2px solid",
        borderColor: '#0972d3',
        borderRadius: 2,
        fontSize: "16px",
        fontWeight: "400",
        ...sx,
      }}
      {...other}
    />
  );
};

const ChatBox = ({ msgItems, loading }) => {
  const [loadingtext, setLoaderTxt] = useState(".");
  const intervalRef = useRef(0);

  function handleStartTick() {
    let textContent = "";
    const intervalId = setInterval(() => {
      setLoaderTxt((v) => v + ".");
      textContent += ".";
      if (textContent.length > 5) {
        setLoaderTxt(".");
        textContent = "";
      }
    }, 500);
    intervalRef.current = intervalId;
  }

  function handleStopClick() {
    const intervalId = intervalRef.current;
    if (intervalId) clearInterval(intervalId);
  }
  useEffect(() => {
    if (loading) {
      handleStartTick();
    } else {
      handleStopClick();
    }
  }, [loading]);

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behaviour: "smooth" });
    }
  }, [msgItems.length]);
  const items = msgItems.map((msg) => (
    <MsgItem key={generateUniqueId()} who={msg.who} text={msg.text} />
  ));

  return (
    <List
      sx={{
        position: "relative",
        overflow: "auto",
      }}
    >
      {items}
      {loading ? <MsgItem key={generateUniqueId()} who={BOTNAME} text={loadingtext} /> : <div />}
      <ListItem ref={scrollRef} />
    </List>
  );
};



const ConversationsPanel = ()=>{
    const {t} = useTranslation();
    const {msgItems, setMsgItems,loading, setLoading,conversations, setConversations,alertopen, setAlertOpen} = useChatData();
    const [isInit, setInit] = useState(false);
    const [streamMsg, setStreamMsg] = useState('');


    const authtoken = useAuthToken();

    const onMessageCallback = ({ data }) => {
      setLoading(false);
      //save conversations
      const resp = JSON.parse(data);
      // console.log(resp);
  
  
      if (resp.role) {
  
        setStreamMsg(prev => (prev+resp.text.content));
  
        // if stream stop, save the whole message
        if ( resp.text?.content ==='[DONE]') {
          setConversations((prev) => [
            ...prev,
            {role: resp.role, content: streamMsg },
          ]);
          setStreamMsg('');
          // console.log(streamMsg);
          if (conversations.length > MAX_CONVERSATIONS) {
            setConversations((prev) =>
              prev.slice(0,1).concat(prev.slice(conversations.length - MAX_CONVERSATIONS)) //prev.slice(0,1)是默认的第一条AI预设角色
            );
          }
        }
      }
      if ( resp.text?.content !=='[DONE]') {
        setMsgItems((prev) =>
           prev.filter(item => (item.id === resp.msgid)).length  // 如果msgid已经存在
            ? 
             (prev.map((it) => ( (it.id === resp.msgid)?  
              { id: it.id, who: BOTNAME, text: streamMsg }:
                {id: it.id, who: it.who, text: it.text })) )
            : [...prev, { id: resp.msgid, who: BOTNAME, text: resp.text.content }] //创建一个新的item
          
        );
      }
      //  console.log(conversations);   

       
      };
    
      // setup websocket
      const { sendMessage, sendJsonMessage, getWebSocket, readyState } =
        useWebSocket(API_socket, {
          queryParams: authtoken,
          onOpen: () =>
            {
            setAlertOpen(false);
            setLoading(false);
          },
          onMessage: onMessageCallback,
          retryOnError: true,
          onClose: () => {
            setLoading(false);
            setAlertOpen(true);
            console.log('connection close');
          },
          onError: () => {
            setLoading(false);
            setAlertOpen(true);
            console.log('connection error');
          },
          shouldReconnect: (closeEvent) => {
            return true;
          },
          reconnectAttempts: 100,
          reconnectInterval: (attemptNumber) =>
            Math.min(Math.pow(2, attemptNumber) * 1000, 15000),
        });


    return (
        <SpaceBetween size='l'>
        <Container 
         header={
          <Header
            variant="h2"
          >
            {t("conversations")}
          </Header>
        }
        >
           <ChatBox msgItems={msgItems} loading={loading}/>
        
        </Container>

        <PromptPanel sendMessage={sendJsonMessage}/>

        </SpaceBetween>
    );


} 

export default ConversationsPanel;